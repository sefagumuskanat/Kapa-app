import { AssetCategory, Currency, MarketQuote, MeasurementUnit, ValuationSource } from '@/types';

/**
 * MarketPriceService (MOCK).
 *
 * ÖNEMLİ: Bu servis canlı fiyat vermez ve canlı fiyat veriyormuş gibi
 * davranmaz. Değerler sabit, gömülü referanslardır; her yanıt kaynağını ve
 * zaman damgasını taşır. Gerçek üründe bu servisin ardına, yalnızca
 * "kategori + birim" içeren minimal bir sorgu payload'ı ile çalışan bir
 * fiyat ucu takılır — varlık adı, not, konum veya kimlik ASLA gönderilmez.
 */
export interface MarketQuoteRequest {
  category: AssetCategory;
  unit: MeasurementUnit;
  /** Sunucuya giden tek ek alan. Kişisel veri içermez. */
  currency: Currency;
}

export interface IMarketPriceService {
  getQuote(request: MarketQuoteRequest): Promise<MarketQuote>;
  getQuotes(requests: MarketQuoteRequest[]): Promise<MarketQuote[]>;
  /** Sunucuya gönderilecek payload'ın ne olduğunu UI'da göstermek için. */
  describeOutboundPayload(request: MarketQuoteRequest): Record<string, string>;
}

interface CategoryBaseline {
  unitValue: number;
  unit: MeasurementUnit;
  reliability: number;
}

/** Kategori bazlı mock referanslar. Piyasa iddiası değildir. */
const BASELINES: Record<AssetCategory, CategoryBaseline> = {
  gold: { unitValue: 3450, unit: 'gram', reliability: 0.95 },
  silver: { unitValue: 42, unit: 'gram', reliability: 0.9 },
  jewelry: { unitValue: 165000, unit: 'carat', reliability: 0.55 },
  watch: { unitValue: 58000, unit: 'piece', reliability: 0.6 },
  electronics: { unitValue: 46000, unit: 'piece', reliability: 0.75 },
  photography: { unitValue: 92000, unit: 'piece', reliability: 0.72 },
  vehicle: { unitValue: 850000, unit: 'piece', reliability: 0.65 },
  bicycle: { unitValue: 18500, unit: 'piece', reliability: 0.68 },
  furniture: { unitValue: 52000, unit: 'set', reliability: 0.5 },
  collectible: { unitValue: 850, unit: 'piece', reliability: 0.4 },
  other: { unitValue: 5000, unit: 'piece', reliability: 0.3 },
};

/** Mock verinin "tazelik" damgası — sabit bir referans anı. */
const SNAPSHOT_TIME = '2026-08-16T08:00:00.000Z';

const simulateLatency = (ms = 260) => new Promise((resolve) => setTimeout(resolve, ms));

class MockMarketPriceService implements IMarketPriceService {
  async getQuote(request: MarketQuoteRequest): Promise<MarketQuote> {
    await simulateLatency();
    const baseline = BASELINES[request.category] ?? BASELINES.other;
    const source: ValuationSource = {
      kind: 'mock-market',
      label: 'KAPAMETRE demo referans tablosu',
      timestamp: SNAPSHOT_TIME,
    };
    return {
      category: request.category,
      unit: baseline.unit,
      unitValue: baseline.unitValue,
      currency: request.currency,
      source,
      reliability: baseline.reliability,
    };
  }

  async getQuotes(requests: MarketQuoteRequest[]): Promise<MarketQuote[]> {
    return Promise.all(requests.map((request) => this.getQuote(request)));
  }

  describeOutboundPayload(request: MarketQuoteRequest): Record<string, string> {
    // Sunucuya giden her şeyin tamamı budur.
    return {
      category: request.category,
      unit: request.unit,
      currency: request.currency,
    };
  }
}

export const marketPriceService: IMarketPriceService = new MockMarketPriceService();
export { BASELINES as MARKET_BASELINES };
