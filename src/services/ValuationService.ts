import { computePureWeight } from './MetalPriceService';
import { priceFeed } from './PriceFeedService';
import { getAssetType } from '@/catalog';
import {
  Asset,
  AssetCategory,
  CategoryBreakdown,
  Currency,
  PortfolioSnapshot,
  ValuationScenario,
  ValuationSnapshot,
  ValuationSource,
} from '@/types';
import { createId, nowIso } from '@/utils/id';

/**
 * ValuationService — her varlık için 3 senaryo üretir.
 *
 * Fiyatlama moduna göre üç yol var:
 *  1. `metal`      — altın/gümüş: saf gram × maden fiyatı × piyasa çarpanı
 *  2. `manualSale` — kullanıcı güncel satış değerini girer, 3 senaryo türetilir
 *  3. `manual3`    — kullanıcı üç senaryoyu da kendi girer, aynen kullanılır
 *
 * Kurallar değişmedi: Normal Satış ana metriktir, her sonuç güven skoru ve
 * kaynak taşır, uydurma kesinlik üretilmez.
 */

interface LiquidityProfile {
  fastDiscount: number;
  patientPremium: number;
}

const LIQUIDITY: Record<AssetCategory, LiquidityProfile> = {
  // Altın/gümüş neredeyse nakit: kuyumcu makası dar.
  gold: { fastDiscount: 0.02, patientPremium: 0.02 },
  silver: { fastDiscount: 0.05, patientPremium: 0.05 },
  jewelry: { fastDiscount: 0.28, patientPremium: 0.18 },
  watch: { fastDiscount: 0.22, patientPremium: 0.2 },
  electronics: { fastDiscount: 0.2, patientPremium: 0.12 },
  photography: { fastDiscount: 0.18, patientPremium: 0.14 },
  vehicle: { fastDiscount: 0.14, patientPremium: 0.1 },
  bicycle: { fastDiscount: 0.24, patientPremium: 0.15 },
  furniture: { fastDiscount: 0.35, patientPremium: 0.16 },
  collectible: { fastDiscount: 0.3, patientPremium: 0.35 },
  // Gayrimenkul yavaş satılır: acele edenin kaybı büyük, bekleyenin kazancı gerçek.
  property: { fastDiscount: 0.18, patientPremium: 0.12 },
  // Döviz ve kripto neredeyse nakit; makas çok dar.
  currency: { fastDiscount: 0.01, patientPremium: 0.01 },
  crypto: { fastDiscount: 0.02, patientPremium: 0.02 },
  other: { fastDiscount: 0.25, patientPremium: 0.15 },
};

export interface IValuationService {
  /**
   * @param isPremium Otomatik fiyat güncellemesi premium özelliğidir.
   *   Ücretsiz kullanıcıda piyasa fiyatı çekilmez; kullanıcının en son
   *   elle girdiği değer kullanılır.
   */
  valuateAsset(asset: Asset, isPremium: boolean, currency?: Currency): Promise<ValuationSnapshot>;
  valuateAll(assets: Asset[], isPremium: boolean, currency?: Currency): Promise<ValuationSnapshot[]>;
  buildPortfolioSnapshot(
    assets: Asset[],
    valuations: ValuationSnapshot[],
    currency?: Currency,
  ): PortfolioSnapshot;
}

interface PriceResult {
  fast: number;
  normal: number;
  patient: number;
  source: ValuationSource;
  reliability: number;
  factors: string[];
}

class ValuationServiceImpl implements IValuationService {
  async valuateAsset(
    asset: Asset,
    isPremium: boolean,
    currency: Currency = 'TRY',
  ): Promise<ValuationSnapshot> {
    const type = getAssetType(asset.typeId);
    const factors: string[] = [];
    const autoPriced = type != null && (type.pricing === 'metal' || type.pricing === 'quote');

    let priced: PriceResult;
    if (!type) {
      priced = this.unavailable('Tür tanımı bulunamadı', asset);
    } else if (autoPriced && !isPremium) {
      // Ücretsiz kademede piyasa fiyatı çekilmez; kullanıcının girdiği değer geçerli.
      priced = this.priceFromDeclaredSale(asset, 'Ücretsiz kademe — fiyatı sen güncelliyorsun');
      // Henüz elle bir değer girmemişse sıfır göstermek yanlış olur:
      // alış fiyatını başlangıç kabul edip bunu açıkça söylüyoruz.
      if (priced.source.kind === 'unavailable') {
        priced = this.priceFromPurchase(asset);
      }
    } else if (type.pricing === 'metal') {
      priced = await this.priceFromMetal(asset, currency);
    } else if (type.pricing === 'quote') {
      priced = await this.priceFromQuote(asset, currency);
    } else if (type.pricing === 'manual3') {
      priced = this.priceFromManualThree(asset);
    } else {
      priced = this.priceFromDeclaredSale(asset);
    }

    factors.push(...priced.factors);

    const acquisitionCost = this.acquisitionCost(asset);
    if (acquisitionCost == null) factors.push('Kaça aldığın bilinmiyor, kâr/zarar çıkmaz');

    const staleness = this.stalenessDays(asset, type?.pricing, autoPriced && isPremium);
    if (staleness != null && staleness > 45) {
      factors.push(`Bu değeri ${Math.round(staleness)} gündür güncellemedin`);
    }

    const confidenceScore = this.confidence(asset, priced, acquisitionCost, staleness, factors);

    return {
      id: createId('val'),
      assetId: asset.id,
      currency,
      fastValue: round(priced.fast),
      normalValue: round(priced.normal),
      patientValue: round(priced.patient),
      confidenceScore,
      source: priced.source,
      sourceTimestamp: priced.source.timestamp,
      acquisitionCost,
      unrealizedGain: acquisitionCost == null ? null : round(priced.normal - acquisitionCost),
      confidenceFactors: factors,
      computedAt: nowIso(),
    };
  }

  async valuateAll(
    assets: Asset[],
    isPremium: boolean,
    currency: Currency = 'TRY',
  ): Promise<ValuationSnapshot[]> {
    return Promise.all(assets.map((asset) => this.valuateAsset(asset, isPremium, currency)));
  }

  /* --------------------------------------------------------------- */

  /** Altın / gümüş: saf gram × gram fiyatı × piyasa çarpanı. */
  private async priceFromMetal(asset: Asset, currency: Currency): Promise<PriceResult> {
    const type = getAssetType(asset.typeId);
    if (!type?.metal) return this.unavailable('Maden bilgisi eksik', asset);

    const weight = computePureWeight(type, asset.attributes);
    if (!weight) return this.unavailable('Gram veya ayar bilgisi eksik', asset);

    const quote = await priceFeed.getMetalGram(type.metal.metal);
    const base = weight.pureGram * quote.unitPrice * type.metal.marketFactor;
    const liquidity = LIQUIDITY[asset.category] ?? LIQUIDITY.other;

    const factors = [
      `${weight.explanation} = ${weight.pureGram.toFixed(2)} g saf`,
      `Gram fiyatı ${Math.round(quote.unitPrice)} ₺`,
    ];
    if (type.metal.marketFactor < 1) {
      factors.push(`İşçilik payı düşüldü (×${type.metal.marketFactor})`);
    } else if (type.metal.marketFactor > 1) {
      factors.push(`Piyasa primi eklendi (×${type.metal.marketFactor})`);
    }
    if (!quote.isLive) factors.push('Canlı fiyat bağlantısı yok, demo tablo kullanıldı');

    return {
      fast: base * (1 - liquidity.fastDiscount),
      normal: base,
      patient: base * (1 + liquidity.patientPremium),
      source: quote.source,
      // Maden fiyatı en güvenilir kalem; canlı olmadığı için tavan yapmıyoruz.
      reliability: quote.isLive ? 0.95 : 0.8,
      factors,
    };
  }

  /** Döviz / kripto: miktar × birim fiyat. */
  private async priceFromQuote(asset: Asset, currency: Currency): Promise<PriceResult> {
    const type = getAssetType(asset.typeId);
    if (!type?.quote) return this.unavailable('Kur bilgisi eksik', asset);

    const amount = Number(String(asset.attributes.miktar ?? '').replace(',', '.'));
    if (!Number.isFinite(amount) || amount <= 0) {
      return this.unavailable('Miktar girilmemiş', asset);
    }

    const quote = await priceFeed.getQuote(type.quote.kind, type.quote.symbol);
    if (quote.unitPrice <= 0) return this.unavailable('Fiyat alınamadı', asset);

    const base = amount * quote.unitPrice;
    const liquidity = LIQUIDITY[asset.category] ?? LIQUIDITY.other;
    const factors = [
      `${amount} ${type.quote.symbol} × ${Math.round(quote.unitPrice).toLocaleString('tr-TR')} ₺`,
    ];
    if (!quote.isLive) factors.push('Canlı bağlantı kapalı, demo tablo kullanıldı');

    return {
      fast: base * (1 - liquidity.fastDiscount),
      normal: base,
      patient: base * (1 + liquidity.patientPremium),
      source: quote.source,
      reliability: quote.isLive ? 0.95 : 0.8,
      factors,
    };
  }

  /** Kullanıcı üç fiyatı da kendi girmiş. */
  private priceFromManualThree(asset: Asset): PriceResult {
    const prices = asset.manualPrices;
    if (!prices || prices.normal <= 0) {
      return this.unavailable('Üç fiyat girilmemiş', asset);
    }
    // Girilen sıralama bozuksa düzelt — kullanıcı yanlış kutuya yazmış olabilir.
    const sorted = [prices.fast, prices.normal, prices.patient].sort((a, b) => a - b);
    return {
      fast: sorted[0],
      normal: prices.normal,
      patient: sorted[2],
      source: {
        kind: 'user-three-prices',
        label: 'Üç fiyatı sen girdin',
        timestamp: asset.valueUpdatedAt ?? asset.updatedAt,
      },
      reliability: 0.7,
      factors: ['Fiyatları sen belirledin'],
    };
  }

  /** Kullanıcı tek bir güncel satış değeri girmiş (pırlanta, ev, arsa). */
  private priceFromDeclaredSale(asset: Asset, label?: string): PriceResult {
    const value = asset.declaredSaleValue;
    if (value == null || value <= 0) {
      return this.unavailable(
        label ? 'Değeri henüz güncellemedin' : 'Güncel değer girilmemiş',
        asset,
      );
    }
    const liquidity = LIQUIDITY[asset.category] ?? LIQUIDITY.other;
    return {
      fast: value * (1 - liquidity.fastDiscount),
      normal: value,
      patient: value * (1 + liquidity.patientPremium),
      source: {
        kind: 'user-declared',
        label: label ?? 'Senin girdiğin güncel değer',
        timestamp: asset.valueUpdatedAt ?? asset.updatedAt,
      },
      reliability: 0.65,
      factors: [label ?? 'Güncel değeri sen girdin'],
    };
  }

  /**
   * Son çare: alış fiyatını bugünkü değer sayar.
   * Doğru olduğunu iddia etmiyoruz — sıfır göstermekten iyi ve güven skoru düşük.
   */
  private priceFromPurchase(asset: Asset): PriceResult {
    const cost = this.acquisitionCost(asset);
    if (cost == null || cost <= 0) {
      return this.unavailable('Değeri henüz girmedin', asset);
    }
    const liquidity = LIQUIDITY[asset.category] ?? LIQUIDITY.other;
    return {
      fast: cost * (1 - liquidity.fastDiscount),
      normal: cost,
      patient: cost * (1 + liquidity.patientPremium),
      source: {
        kind: 'acquisition-fallback',
        label: 'Aldığın fiyat baz alındı — güncelle',
        timestamp: asset.valueUpdatedAt ?? asset.updatedAt,
      },
      // Bilinçli olarak düşük: bu bir tahmin bile değil, eski fiyat.
      reliability: 0.3,
      factors: ['Güncel değeri girmedin, alış fiyatını kullandık'],
    };
  }

  private unavailable(reason: string, asset: Asset): PriceResult {
    return {
      fast: 0,
      normal: 0,
      patient: 0,
      source: {
        kind: 'unavailable',
        label: 'Değer hesaplanamadı',
        timestamp: asset.updatedAt,
      },
      reliability: 0.05,
      factors: [reason],
    };
  }

  /* --------------------------------------------------------------- */

  private acquisitionCost(asset: Asset): number | null {
    if (asset.lots.length === 0) return null;
    const known = asset.lots.filter((lot) => lot.unitCost != null);
    // Partilerin bir kısmı bilinmiyorsa toplam maliyet iddia edilmez.
    if (known.length !== asset.lots.length || known.length === 0) return null;
    return round(known.reduce((sum, lot) => sum + (lot.unitCost as number) * lot.quantity, 0));
  }

  /** Elle güncellenen kalemlerde değerin kaç gün önce tazelendiği. */
  private stalenessDays(asset: Asset, pricing?: string, autoActive = false): number | null {
    if (autoActive) return null; // piyasadan otomatik geliyor, bayatlamaz
    const ref = asset.valueUpdatedAt ?? asset.updatedAt;
    const then = new Date(ref).getTime();
    if (Number.isNaN(then)) return null;
    return Math.max(0, (Date.now() - then) / 86_400_000);
  }

  private confidence(
    asset: Asset,
    priced: PriceResult,
    acquisitionCost: number | null,
    staleness: number | null,
    factors: string[],
  ): number {
    let completeness = 0;
    const type = getAssetType(asset.typeId);

    // Türe özel zorunlu alanlar dolduruldu mu?
    const required = (type?.fields ?? []).filter((f) => f.required);
    if (required.length > 0) {
      const filled = required.filter((f) => (asset.attributes[f.key] ?? '') !== '').length;
      completeness += 0.5 * (filled / required.length);
      if (filled < required.length) factors.push('Bazı bilgiler eksik kalmış');
    } else {
      completeness += 0.5;
    }

    if (acquisitionCost != null) completeness += 0.3;
    if (asset.quantity > 0) completeness += 0.2;

    let score = priced.reliability * 0.7 + clamp(completeness, 0, 1) * 0.3;

    // Bayat elle girilen değer güveni düşürür.
    if (staleness != null) {
      if (staleness > 180) score -= 0.25;
      else if (staleness > 90) score -= 0.15;
      else if (staleness > 45) score -= 0.08;
    }

    return clamp(score, 0.05, 0.92);
  }

  buildPortfolioSnapshot(
    assets: Asset[],
    valuations: ValuationSnapshot[],
    currency: Currency = 'TRY',
  ): PortfolioSnapshot {
    const byId = new Map(valuations.map((v) => [v.assetId, v]));
    const totals: Record<ValuationScenario, number> = { fast: 0, normal: 0, patient: 0 };
    const categoryMap = new Map<AssetCategory, { value: number; count: number }>();

    let knownAcquisitionCost = 0;
    let unknownCostAssetCount = 0;
    let confidenceSum = 0;
    let counted = 0;
    let comparableNormal = 0;

    for (const asset of assets) {
      const valuation = byId.get(asset.id);
      if (!valuation) continue;
      totals.fast += valuation.fastValue;
      totals.normal += valuation.normalValue;
      totals.patient += valuation.patientValue;

      const bucket = categoryMap.get(asset.category) ?? { value: 0, count: 0 };
      bucket.value += valuation.normalValue;
      bucket.count += 1;
      categoryMap.set(asset.category, bucket);

      if (valuation.acquisitionCost == null) {
        unknownCostAssetCount += 1;
      } else {
        knownAcquisitionCost += valuation.acquisitionCost;
        comparableNormal += valuation.normalValue;
      }

      confidenceSum += valuation.confidenceScore;
      counted += 1;
    }

    const byCategory: CategoryBreakdown[] = Array.from(categoryMap.entries())
      .map(([category, bucket]) => ({
        category,
        normalValue: round(bucket.value),
        assetCount: bucket.count,
        share: totals.normal > 0 ? bucket.value / totals.normal : 0,
      }))
      .sort((a, b) => b.normalValue - a.normalValue);

    return {
      id: createId('snap'),
      createdAt: nowIso(),
      currency,
      totals: {
        fast: round(totals.fast),
        normal: round(totals.normal),
        patient: round(totals.patient),
      },
      assetCount: counted,
      knownAcquisitionCost: round(knownAcquisitionCost),
      unknownCostAssetCount,
      unrealizedGain:
        knownAcquisitionCost > 0 ? round(comparableNormal - knownAcquisitionCost) : null,
      averageConfidence: counted > 0 ? confidenceSum / counted : 0,
      byCategory,
    };
  }
}

function round(value: number): number {
  return Math.round(value);
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export const valuationService: IValuationService = new ValuationServiceImpl();
export { LIQUIDITY as LIQUIDITY_PROFILES };
