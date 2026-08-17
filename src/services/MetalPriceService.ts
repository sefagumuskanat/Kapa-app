import { AssetTypeDef, MetalPricing } from '@/catalog/types';
import { Currency, MetalKind, MetalQuote, ValuationSource } from '@/types';
import { nowIso } from '@/utils/id';

/**
 * MetalPriceService — altın ve gümüşün gram fiyatı.
 *
 * ÖNEMLİ / DÜRÜSTLÜK NOTU
 * Bu sürümde GERÇEK bir fiyat sağlayıcısı bağlı DEĞİLDİR. Ücretli bir API
 * anahtarı olmadan canlı kur çekilemez ve uydurma rakamı "canlı fiyat" diye
 * göstermek ürünün en temel kuralını çiğner. Bu yüzden:
 *
 *  - Mock uygulama sabit bir referans tablo döndürür ve `isLive: false` der.
 *  - Arayüz gerçek bir sağlayıcıya göre tasarlandı: `fetchQuote` tek iş yapar,
 *    1 gram saf madenin TL karşılığını döndürür.
 *  - Gerçek API bağlamak için tek yapılacak: `HttpMetalPriceService` içindeki
 *    endpoint'i doldurup `metalPriceService`i ona çevirmek. Hesaplama, önbellek
 *    ve tüm ekranlar aynen çalışmaya devam eder.
 *
 * Uygulama, verinin canlı olup olmadığını kullanıcıdan gizlemez.
 */

export interface IMetalPriceService {
  getQuote(metal: MetalKind, currency?: Currency): Promise<MetalQuote>;
  /** Önbelleği temizler; "fiyatları yenile" akışı bunu kullanır. */
  invalidate(): void;
}

/** Demo referans tablosu — piyasa iddiası taşımaz. */
const REFERENCE_PRICE_PER_GRAM: Record<MetalKind, number> = {
  gold: 4180,
  silver: 48,
};

const REFERENCE_TIMESTAMP = '2026-08-17T09:00:00.000Z';
const CACHE_TTL_MS = 5 * 60 * 1000;

interface CacheEntry {
  quote: MetalQuote;
  at: number;
}

class MockMetalPriceService implements IMetalPriceService {
  private cache = new Map<string, CacheEntry>();

  async getQuote(metal: MetalKind, currency: Currency = 'TRY'): Promise<MetalQuote> {
    const key = `${metal}:${currency}`;
    const hit = this.cache.get(key);
    if (hit && Date.now() - hit.at < CACHE_TTL_MS) return hit.quote;

    await new Promise((resolve) => setTimeout(resolve, 180));

    const source: ValuationSource = {
      kind: 'metal-price',
      // Etiket kullanıcıya doğrudan gösterilir; "canlı" demiyoruz çünkü değil.
      label: 'Demo referans fiyatı (canlı bağlantı yok)',
      timestamp: REFERENCE_TIMESTAMP,
    };

    const quote: MetalQuote = {
      metal,
      pricePerGram: REFERENCE_PRICE_PER_GRAM[metal],
      currency,
      source,
      isLive: false,
    };

    this.cache.set(key, { quote, at: Date.now() });
    return quote;
  }

  invalidate(): void {
    this.cache.clear();
  }
}

/**
 * Gerçek sağlayıcı iskeleti. Endpoint ve anahtar hazır olduğunda
 * aşağıdaki `metalPriceService` bunu kullanacak şekilde değiştirilir.
 */
export class HttpMetalPriceService implements IMetalPriceService {
  private cache = new Map<string, CacheEntry>();

  constructor(
    private endpoint: string,
    private apiKey: string,
  ) {}

  async getQuote(metal: MetalKind, currency: Currency = 'TRY'): Promise<MetalQuote> {
    const key = `${metal}:${currency}`;
    const hit = this.cache.get(key);
    if (hit && Date.now() - hit.at < CACHE_TTL_MS) return hit.quote;

    const response = await fetch(`${this.endpoint}?metal=${metal}&currency=${currency}`, {
      headers: { Authorization: `Bearer ${this.apiKey}` },
    });
    if (!response.ok) throw new Error(`Fiyat alınamadı (${response.status})`);

    const data = (await response.json()) as { pricePerGram: number; updatedAt: string };
    const quote: MetalQuote = {
      metal,
      pricePerGram: data.pricePerGram,
      currency,
      source: {
        kind: 'metal-price',
        label: 'Canlı piyasa fiyatı',
        timestamp: data.updatedAt,
      },
      isLive: true,
    };
    this.cache.set(key, { quote, at: Date.now() });
    return quote;
  }

  invalidate(): void {
    this.cache.clear();
  }
}

export const metalPriceService: IMetalPriceService = new MockMetalPriceService();

/* ------------------------------------------------------------------ */
/* Ağırlık hesabı                                                      */
/* ------------------------------------------------------------------ */

export interface PureWeightResult {
  /** Toplam saf maden ağırlığı (gram). */
  pureGram: number;
  /** Hesabın nasıl yapıldığını açıklayan kısa not. */
  explanation: string;
}

/**
 * Bir varlığın saf maden ağırlığını öznitelikten hesaplar.
 * Sikkelerde sabit ağırlık, işçilikli/gram üründe `gram × ayar milyemi`.
 */
export function computePureWeight(
  type: AssetTypeDef,
  attributes: Record<string, string>,
): PureWeightResult | null {
  const pricing: MetalPricing | undefined = type.metal;
  if (!pricing) return null;

  const count = toNumber(attributes.adet) ?? 1;
  if (count <= 0) return null;

  let pureGram: number;
  let explanation: string;

  if (pricing.weightMode === 'fixed') {
    if (!pricing.fixedPureGram) return null;
    pureGram = pricing.fixedPureGram * count;
    explanation = `${count} × ${pricing.fixedPureGram.toFixed(3)} g saf altın`;
  } else {
    const gram = toNumber(attributes[pricing.gramField ?? 'gram']);
    if (gram == null || gram <= 0) return null;
    const purity = optionFactor(type, pricing.purityField, attributes);
    if (purity == null) return null;
    pureGram = gram * purity * count;
    explanation = `${gram} g × ${(purity * 1000).toFixed(0)} milyem${count > 1 ? ` × ${count}` : ''}`;
  }

  // Eski/yeni tarih gibi ek çarpanlar
  for (const field of pricing.multiplierFields ?? []) {
    const factor = optionFactor(type, field, attributes);
    if (factor != null && factor !== 1) {
      pureGram *= factor;
      explanation += ` × ${factor}`;
    }
  }

  return { pureGram, explanation };
}

function optionFactor(
  type: AssetTypeDef,
  fieldKey: string | undefined,
  attributes: Record<string, string>,
): number | null {
  if (!fieldKey) return null;
  const field = type.fields.find((f) => f.key === fieldKey);
  if (!field?.options) return null;
  const selected = attributes[fieldKey];
  const option = field.options.find((o) => o.value === selected);
  return option?.factor ?? null;
}

function toNumber(value: string | undefined): number | null {
  if (value == null || value === '') return null;
  const parsed = Number(String(value).replace(',', '.'));
  return Number.isFinite(parsed) ? parsed : null;
}

export { toNumber as parseAttributeNumber };
