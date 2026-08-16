import { catalogService } from './CatalogService';
import { marketPriceService, MARKET_BASELINES } from './MarketPriceService';
import { CATALOG } from '@/data/catalog';
import {
  Asset,
  AssetCategory,
  AssetCondition,
  CategoryBreakdown,
  Currency,
  PortfolioSnapshot,
  ValuationScenario,
  ValuationSnapshot,
  ValuationSource,
} from '@/types';
import { createId, nowIso } from '@/utils/id';

/**
 * ValuationService (MOCK + adapter).
 *
 * Kurallar:
 *  - Yalnızca 3 değer üretilir: fast / normal / patient.
 *  - Normal Satış ana metriktir; toplam ve sıralama onu kullanır.
 *  - Sahte kesinlik yoktur: her sonuç confidenceScore + kaynak + zaman taşır.
 *  - Yatırım tavsiyesi, getiri vaadi veya garanti üretilmez.
 */

export interface ValuationAdapter {
  readonly id: string;
  readonly label: string;
  /** Birim değer + güvenilirlik + kaynak döner; çözemezse null. */
  resolveUnitValue(asset: Asset, currency: Currency): Promise<AdapterResult | null>;
}

export interface AdapterResult {
  unitValue: number;
  reliability: number;
  source: ValuationSource;
}

/** Likidite profili: hızlı satış iskontosu ve sabırlı satış primi. */
interface LiquidityProfile {
  fastDiscount: number;
  patientPremium: number;
}

const LIQUIDITY: Record<AssetCategory, LiquidityProfile> = {
  gold: { fastDiscount: 0.03, patientPremium: 0.04 },
  silver: { fastDiscount: 0.06, patientPremium: 0.06 },
  jewelry: { fastDiscount: 0.28, patientPremium: 0.18 },
  watch: { fastDiscount: 0.22, patientPremium: 0.2 },
  electronics: { fastDiscount: 0.2, patientPremium: 0.12 },
  photography: { fastDiscount: 0.18, patientPremium: 0.14 },
  vehicle: { fastDiscount: 0.14, patientPremium: 0.1 },
  bicycle: { fastDiscount: 0.24, patientPremium: 0.15 },
  furniture: { fastDiscount: 0.35, patientPremium: 0.16 },
  collectible: { fastDiscount: 0.3, patientPremium: 0.35 },
  other: { fastDiscount: 0.25, patientPremium: 0.15 },
};

const CONDITION_MULTIPLIER: Record<AssetCondition, number> = {
  new: 1.0,
  likeNew: 0.92,
  good: 0.8,
  fair: 0.64,
  poor: 0.45,
};

/** Değerli maden kondisyondan neredeyse etkilenmez — ayar/gramaj belirleyicidir. */
const CONDITION_INSENSITIVE: AssetCategory[] = ['gold', 'silver'];

class CatalogAdapter implements ValuationAdapter {
  readonly id = 'catalog';
  readonly label = 'Katalog eşleşmesi';

  async resolveUnitValue(asset: Asset, currency: Currency): Promise<AdapterResult | null> {
    if (!asset.catalogRef) return null;
    const item = await catalogService.getByRef(asset.catalogRef);
    if (!item) return null;
    // Katalog eşleşmesi güven verir ama kategorinin kendi belirsizliğini silmez:
    // gramla ölçülen altın ile tek parça pırlanta aynı kesinlikte değerlenemez.
    const categoryReliability =
      MARKET_BASELINES[item.category]?.reliability ?? MARKET_BASELINES.other.reliability;
    return {
      unitValue: item.referenceUnitValue,
      reliability: clamp(categoryReliability * 0.85 + 0.15, 0.2, 0.97),
      source: {
        kind: 'mock-catalog',
        label: `Katalog: ${item.name}`,
        timestamp: '2026-08-16T08:00:00.000Z',
      },
    };
  }
}

class DeclaredValueAdapter implements ValuationAdapter {
  readonly id = 'declared';
  readonly label = 'Kullanıcı beyanı';

  async resolveUnitValue(asset: Asset): Promise<AdapterResult | null> {
    if (asset.declaredUnitValue == null || asset.declaredUnitValue <= 0) return null;
    return {
      unitValue: asset.declaredUnitValue,
      reliability: 0.6,
      source: {
        kind: 'user-declared',
        label: 'Senin girdiğin referans değer',
        timestamp: asset.updatedAt,
      },
    };
  }
}

class MarketAdapter implements ValuationAdapter {
  readonly id = 'market';
  readonly label = 'Referans tablo';

  async resolveUnitValue(asset: Asset, currency: Currency): Promise<AdapterResult | null> {
    const quote = await marketPriceService.getQuote({
      category: asset.category,
      unit: asset.unit,
      currency,
    });
    // Birim uyuşmuyorsa (ör. set vs adet) güvenilirliği düşür.
    const unitMatches = quote.unit === asset.unit;
    return {
      unitValue: quote.unitValue,
      reliability: unitMatches ? quote.reliability : quote.reliability * 0.6,
      source: quote.source,
    };
  }
}

class AcquisitionFallbackAdapter implements ValuationAdapter {
  readonly id = 'acquisition';
  readonly label = 'Edinim maliyeti';

  async resolveUnitValue(asset: Asset): Promise<AdapterResult | null> {
    const priced = asset.lots.filter((lot) => lot.unitCost != null && lot.unitCost > 0);
    if (priced.length === 0) return null;
    const totalQty = priced.reduce((sum, lot) => sum + lot.quantity, 0);
    if (totalQty <= 0) return null;
    const totalCost = priced.reduce((sum, lot) => sum + (lot.unitCost as number) * lot.quantity, 0);
    return {
      unitValue: totalCost / totalQty,
      reliability: 0.35,
      source: {
        kind: 'acquisition-fallback',
        label: 'Referans yok — edinim maliyetinden türetildi',
        timestamp: asset.updatedAt,
      },
    };
  }
}

export interface IValuationService {
  valuateAsset(asset: Asset, currency?: Currency): Promise<ValuationSnapshot>;
  valuateAll(assets: Asset[], currency?: Currency): Promise<ValuationSnapshot[]>;
  buildPortfolioSnapshot(
    assets: Asset[],
    valuations: ValuationSnapshot[],
    currency?: Currency,
  ): PortfolioSnapshot;
  registerAdapter(adapter: ValuationAdapter): void;
}

class MockValuationService implements IValuationService {
  /** Sıra önemlidir: ilk çözen adapter kazanır. */
  private adapters: ValuationAdapter[] = [
    new CatalogAdapter(),
    new DeclaredValueAdapter(),
    new MarketAdapter(),
    new AcquisitionFallbackAdapter(),
  ];

  registerAdapter(adapter: ValuationAdapter): void {
    this.adapters = [adapter, ...this.adapters.filter((a) => a.id !== adapter.id)];
  }

  async valuateAsset(asset: Asset, currency: Currency = 'TRY'): Promise<ValuationSnapshot> {
    let resolved: AdapterResult | null = null;
    for (const adapter of this.adapters) {
      resolved = await adapter.resolveUnitValue(asset, currency);
      if (resolved) break;
    }

    const factors: string[] = [];
    const fallback: AdapterResult = {
      unitValue: 0,
      reliability: 0.1,
      source: {
        kind: 'user-declared',
        label: 'Değerleme için yeterli veri yok',
        timestamp: asset.updatedAt,
      },
    };
    const base = resolved ?? fallback;
    if (!resolved) factors.push('Referans bulunamadı, değer hesaplanamadı');
    else factors.push(base.source.label);

    const conditionMultiplier = CONDITION_INSENSITIVE.includes(asset.category)
      ? 1
      : CONDITION_MULTIPLIER[asset.condition];
    if (!CONDITION_INSENSITIVE.includes(asset.category) && asset.condition !== 'new') {
      factors.push(`Durum etkisi uygulandı (×${conditionMultiplier.toFixed(2)})`);
    }

    const componentValue = this.componentUplift(asset);
    if (componentValue > 0) factors.push(`${asset.components.length} parça ayrı değerlendi`);

    const normalRaw = base.unitValue * asset.quantity * conditionMultiplier + componentValue;
    const liquidity = LIQUIDITY[asset.category] ?? LIQUIDITY.other;

    const normalValue = round(normalRaw);
    const fastValue = round(normalRaw * (1 - liquidity.fastDiscount));
    const patientValue = round(normalRaw * (1 + liquidity.patientPremium));

    const acquisitionCost = this.acquisitionCost(asset);
    if (acquisitionCost == null) factors.push('Edinim maliyeti bilinmiyor');

    const confidenceScore = this.confidence(asset, base, acquisitionCost, factors);

    return {
      id: createId('val'),
      assetId: asset.id,
      currency,
      fastValue,
      normalValue,
      patientValue,
      confidenceScore,
      source: base.source,
      sourceTimestamp: base.source.timestamp,
      acquisitionCost,
      unrealizedGain: acquisitionCost == null ? null : round(normalValue - acquisitionCost),
      confidenceFactors: factors,
      computedAt: nowIso(),
    };
  }

  async valuateAll(assets: Asset[], currency: Currency = 'TRY'): Promise<ValuationSnapshot[]> {
    return Promise.all(assets.map((asset) => this.valuateAsset(asset, currency)));
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

      if (valuation.acquisitionCost == null) unknownCostAssetCount += 1;
      else knownAcquisitionCost += valuation.acquisitionCost;

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

    // Maliyeti bilinmeyen varlıklar varken toplam kâr/zarar iddia edilmez.
    const comparableNormal = assets.reduce((sum, asset) => {
      const valuation = byId.get(asset.id);
      if (!valuation || valuation.acquisitionCost == null) return sum;
      return sum + valuation.normalValue;
    }, 0);

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
      unrealizedGain: knownAcquisitionCost > 0 ? round(comparableNormal - knownAcquisitionCost) : null,
      averageConfidence: counted > 0 ? confidenceSum / counted : 0,
      byCategory,
    };
  }

  /** Alt parçalar ana birim değere ek olarak katkı verir. */
  private componentUplift(asset: Asset): number {
    return asset.components.reduce((sum, component) => {
      const conditionMultiplier = CONDITION_INSENSITIVE.includes(component.category)
        ? 1
        : CONDITION_MULTIPLIER[component.condition];
      const reference = componentReference(component.catalogRef);
      return sum + reference * component.quantity * conditionMultiplier;
    }, 0);
  }

  private acquisitionCost(asset: Asset): number | null {
    if (asset.lots.length === 0) return null;
    const known = asset.lots.filter((lot) => lot.unitCost != null);
    // Partilerin bir kısmı bilinmiyorsa toplam maliyet iddia edilmez.
    if (known.length !== asset.lots.length || known.length === 0) return null;
    return round(known.reduce((sum, lot) => sum + (lot.unitCost as number) * lot.quantity, 0));
  }

  /**
   * Güven skoru = kaynak güvenilirliği (%70) + veri eksiksizliği (%30).
   *
   * Bileşik tutulmasının sebebi: tek bir sinyal skoru tavana yapıştırmasın.
   * Skor asla 1'e ulaşmaz — tahmin olduğunu gizleyecek bir kesinlik iddiası
   * üretmemek ürün kuralıdır.
   */
  private confidence(
    asset: Asset,
    base: AdapterResult,
    acquisitionCost: number | null,
    factors: string[],
  ): number {
    let completeness = 0;

    if (asset.catalogRef) completeness += 0.3;
    else factors.push('Katalog eşleşmesi yok');

    if (asset.lots.length > 0) completeness += 0.15;
    if (acquisitionCost != null) completeness += 0.25;
    if (asset.declaredUnitValue != null && asset.declaredUnitValue > 0) completeness += 0.15;

    if (asset.category === 'other') factors.push('Kategori belirsiz');
    else completeness += 0.15;

    if (asset.quantity <= 0) {
      completeness = 0;
      factors.push('Miktar geçersiz');
    }

    let score = base.reliability * 0.7 + clamp(completeness, 0, 1) * 0.3;

    const staleness = daysSince(base.source.timestamp);
    if (staleness > 30) {
      score -= 0.1;
      factors.push('Referans verisi 30 günden eski');
    }

    return clamp(score, 0.05, 0.92);
  }
}

/** Alt parça için basit referans; katalog dışı parçalar 0 katkı verir. */
function componentReference(catalogRef?: string): number {
  if (!catalogRef) return 0;
  const item = CATALOG.find((candidate) => candidate.ref === catalogRef);
  return item ? item.referenceUnitValue : 0;
}

function round(value: number): number {
  return Math.round(value);
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function daysSince(iso: string): number {
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return 0;
  return Math.max(0, (Date.now() - then) / 86_400_000);
}

export const valuationService: IValuationService = new MockValuationService();
export { LIQUIDITY as LIQUIDITY_PROFILES, CONDITION_MULTIPLIER };
