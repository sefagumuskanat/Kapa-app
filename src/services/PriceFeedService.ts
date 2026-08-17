import { Currency, MetalKind, ValuationSource } from '@/types';

/**
 * PriceFeedService — altın/gümüş, döviz ve kripto fiyatları.
 *
 * GERÇEK API'LER BAĞLANMAYA HAZIR
 * Aşağıdaki `HttpPriceFeed` sınıfı araştırılmış, ücretsiz ve anahtarsız
 * uçlara göre yazıldı:
 *
 *  - Altın/gümüş (Kapalıçarşı): https://kapalicarsi.apiluna.org/
 *      Anahtar yok, saniyede 1 istek sınırı. `code` alanları: ALTIN,
 *      CEYREK_YENI, GUMUSTRY vb. `alis`/`satis` string olarak gelir.
 *  - Döviz (resmi): https://www.tcmb.gov.tr/kurlar/today.xml
 *      Anahtar yok. Günde bir kez (15:30) yayınlanır — canlı değildir.
 *      Kapalıçarşı ucu serbest piyasa kuru da verdiği için döviz de
 *      oradan okunuyor; TCMB yedek olarak duruyor.
 *  - Kripto: https://api.coingecko.com/api/v3/simple/price
 *      Anahtarsız kullanılabilir, dakikada ~50 çağrı.
 *
 * VARSAYILAN NEDEN MOCK?
 * Bu ortamdan dış ağa çıkılamadığı için gerçek uçlar test edilemedi.
 * Test edilmemiş ağ kodunu varsayılan yapmak, uygulamanın ilk açılışta
 * çökmesi demek olurdu. Bu yüzden:
 *   - Varsayılan `mockPriceFeed` (referans tablo, isLive:false)
 *   - `USE_LIVE_FEED` true yapılınca `HttpPriceFeed` devreye girer
 *   - Canlı uç hata verirse otomatik mock'a düşer, uygulama çalışmaya devam eder
 * Her iki durumda da kullanıcı verinin canlı olup olmadığını ekranda görür.
 */

export type QuoteKind = 'fx' | 'crypto';

export interface PriceQuote {
  /** 1 birimin TL karşılığı (1 gram saf altın, 1 USD, 1 BTC…). */
  unitPrice: number;
  currency: Currency;
  source: ValuationSource;
  isLive: boolean;
}

export interface IPriceFeed {
  /** 1 gram saf madenin TL fiyatı. */
  getMetalGram(metal: MetalKind): Promise<PriceQuote>;
  /** 1 birim dövizin/kriptonun TL fiyatı. */
  getQuote(kind: QuoteKind, symbol: string): Promise<PriceQuote>;
  invalidate(): void;
}

/** Canlı uçları açmak için tek anahtar. */
export const USE_LIVE_FEED = false;

const CACHE_TTL_MS = 5 * 60 * 1000;
const REFERENCE_TIME = '2026-08-17T09:42:00.000Z';

/**
 * Demo referans tablosu — 17 Ağustos 2026 civarındaki gerçekçi seviyeler.
 * Piyasa iddiası taşımaz, yalnızca uygulamanın anlamlı rakamlar göstermesi içindir.
 */
const REFERENCE_METAL_GRAM: Record<MetalKind, number> = {
  gold: 6766,
  silver: 78,
};

const REFERENCE_FX: Record<string, number> = {
  USD: 47.2,
  EUR: 51.4,
  GBP: 59.8,
  CHF: 54.1,
  SAR: 12.6,
  JPY: 0.31,
  AUD: 30.2,
  CAD: 33.9,
  RUB: 0.52,
  AED: 12.85,
};

const REFERENCE_CRYPTO: Record<string, number> = {
  BTC: 4_950_000,
  ETH: 168_000,
  USDT: 47.2,
  BNB: 34_500,
  SOL: 9_800,
  XRP: 128,
  ADA: 42,
  DOGE: 11.4,
  AVAX: 1_680,
  TRX: 14.2,
  DOT: 315,
  LTC: 4_850,
  SHIB: 0.0013,
  LINK: 890,
};

interface CacheEntry {
  quote: PriceQuote;
  at: number;
}

function mockSource(label: string): ValuationSource {
  return { kind: 'metal-price', label, timestamp: REFERENCE_TIME };
}

class MockPriceFeed implements IPriceFeed {
  private cache = new Map<string, CacheEntry>();

  async getMetalGram(metal: MetalKind): Promise<PriceQuote> {
    await delay(120);
    return {
      unitPrice: REFERENCE_METAL_GRAM[metal],
      currency: 'TRY',
      source: mockSource('Demo referans fiyatı (canlı bağlantı kapalı)'),
      isLive: false,
    };
  }

  async getQuote(kind: QuoteKind, symbol: string): Promise<PriceQuote> {
    await delay(120);
    const table = kind === 'fx' ? REFERENCE_FX : REFERENCE_CRYPTO;
    const unitPrice = table[symbol] ?? 0;
    return {
      unitPrice,
      currency: 'TRY',
      source: mockSource('Demo referans fiyatı (canlı bağlantı kapalı)'),
      isLive: false,
    };
  }

  invalidate(): void {
    this.cache.clear();
  }
}

/** Kapalıçarşı ucundaki kodlar. */
const KAPALICARSI_CODE: Record<MetalKind, string> = {
  gold: 'ALTIN',
  silver: 'GUMUSTRY',
};

/** CoinGecko id eşlemesi (sembol → coin id). */
const COINGECKO_ID: Record<string, string> = {
  BTC: 'bitcoin',
  ETH: 'ethereum',
  USDT: 'tether',
  BNB: 'binancecoin',
  SOL: 'solana',
  XRP: 'ripple',
  ADA: 'cardano',
  DOGE: 'dogecoin',
  AVAX: 'avalanche-2',
  TRX: 'tron',
  DOT: 'polkadot',
  LTC: 'litecoin',
  SHIB: 'shiba-inu',
  LINK: 'chainlink',
};

export class HttpPriceFeed implements IPriceFeed {
  private cache = new Map<string, CacheEntry>();
  private fallback = new MockPriceFeed();

  constructor(
    private kapalicarsiUrl = 'https://kapalicarsi.apiluna.org/',
    private coingeckoUrl = 'https://api.coingecko.com/api/v3/simple/price',
  ) {}

  async getMetalGram(metal: MetalKind): Promise<PriceQuote> {
    const key = `metal:${metal}`;
    const hit = this.cached(key);
    if (hit) return hit;

    try {
      const rows = (await this.fetchJson(this.kapalicarsiUrl)) as Array<{
        code: string;
        alis: string;
        satis: string;
        tarih?: string;
      }>;
      const row = rows.find((r) => r.code === KAPALICARSI_CODE[metal]);
      if (!row) throw new Error('Kod bulunamadı');

      // Satarken alış fiyatı geçerlidir; kullanıcı elindekini bozduruyor.
      const price = Number(String(row.alis).replace(',', '.'));
      if (!Number.isFinite(price) || price <= 0) throw new Error('Geçersiz fiyat');

      return this.store(key, {
        unitPrice: price,
        currency: 'TRY',
        source: {
          kind: 'metal-price',
          label: 'Kapalıçarşı canlı fiyatı',
          timestamp: new Date().toISOString(),
        },
        isLive: true,
      });
    } catch {
      // Canlı uç patlarsa uygulama çalışmaya devam etsin.
      return this.fallback.getMetalGram(metal);
    }
  }

  async getQuote(kind: QuoteKind, symbol: string): Promise<PriceQuote> {
    const key = `${kind}:${symbol}`;
    const hit = this.cached(key);
    if (hit) return hit;

    try {
      if (kind === 'crypto') {
        const id = COINGECKO_ID[symbol];
        if (!id) throw new Error('Bilinmeyen kripto');
        const data = (await this.fetchJson(
          `${this.coingeckoUrl}?ids=${id}&vs_currencies=try`,
        )) as Record<string, { try: number }>;
        const price = data[id]?.try;
        if (!Number.isFinite(price)) throw new Error('Fiyat yok');
        return this.store(key, {
          unitPrice: price,
          currency: 'TRY',
          source: {
            kind: 'metal-price',
            label: 'CoinGecko canlı fiyatı',
            timestamp: new Date().toISOString(),
          },
          isLive: true,
        });
      }

      // Döviz de Kapalıçarşı ucundan (serbest piyasa kuru)
      const rows = (await this.fetchJson(this.kapalicarsiUrl)) as Array<{
        code: string;
        alis: string;
      }>;
      const row = rows.find((r) => r.code === `${symbol}TRY` || r.code === symbol);
      if (!row) throw new Error('Kur bulunamadı');
      const price = Number(String(row.alis).replace(',', '.'));
      if (!Number.isFinite(price) || price <= 0) throw new Error('Geçersiz kur');

      return this.store(key, {
        unitPrice: price,
        currency: 'TRY',
        source: {
          kind: 'metal-price',
          label: 'Serbest piyasa kuru',
          timestamp: new Date().toISOString(),
        },
        isLive: true,
      });
    } catch {
      return this.fallback.getQuote(kind, symbol);
    }
  }

  private async fetchJson(url: string): Promise<unknown> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 8000);
    try {
      const response = await fetch(url, { signal: controller.signal });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return await response.json();
    } finally {
      clearTimeout(timer);
    }
  }

  private cached(key: string): PriceQuote | null {
    const hit = this.cache.get(key);
    if (hit && Date.now() - hit.at < CACHE_TTL_MS) return hit.quote;
    return null;
  }

  private store(key: string, quote: PriceQuote): PriceQuote {
    this.cache.set(key, { quote, at: Date.now() });
    return quote;
  }

  invalidate(): void {
    this.cache.clear();
    this.fallback.invalidate();
  }
}

export const priceFeed: IPriceFeed = USE_LIVE_FEED ? new HttpPriceFeed() : new MockPriceFeed();

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
