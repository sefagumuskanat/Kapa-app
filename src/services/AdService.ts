/**
 * AdService (MOCK, veri sızıntısı yok).
 *
 * Kurallar:
 *  - Reklam isteği hiçbir finansal veri, varlık adı, kategori toplamı veya
 *    portföy değeri taşımaz. Yalnızca "ekran adı" gibi bağlamsız bir slot
 *    kimliği kullanılır.
 *  - Kişiselleştirilmiş hedefleme yoktur.
 *  - Premium kullanıcıda reklam katmanı tamamen devre dışıdır.
 */

export type AdSlot = 'home-footer' | 'asset-list-footer' | 'ranking-footer';

export interface AdCreative {
  slot: AdSlot;
  headline: string;
  body: string;
  ctaLabel: string;
  /** Hedefleme yapılmadığını UI'da göstermek için. */
  personalized: false;
}

export interface AdRequest {
  slot: AdSlot;
  /** Reklam katmanına giden TEK alan budur. */
  locale: 'tr-TR';
}

export interface IAdService {
  requestAd(request: AdRequest, adsEnabled: boolean, isPremium: boolean): Promise<AdCreative | null>;
  describeOutboundPayload(request: AdRequest): Record<string, string>;
}

const CREATIVES: Record<AdSlot, Omit<AdCreative, 'slot' | 'personalized'>> = {
  'home-footer': {
    headline: 'Bu alan reklam alanıdır',
    body: 'Reklam isteği portföy verisi içermez. Premium ile tamamen kapatılır.',
    ctaLabel: 'Reklamları kaldır',
  },
  'asset-list-footer': {
    headline: 'Reklamsız kullan',
    body: 'Varlık listen reklam sağlayıcısına hiçbir zaman iletilmez.',
    ctaLabel: 'Premium’a bak',
  },
  'ranking-footer': {
    headline: 'Sıralama reklamla ilişkilendirilmez',
    body: 'Sıralama verisi ile reklam katmanı arasında bağlantı kurulmaz.',
    ctaLabel: 'Premium’a bak',
  },
};

const simulateLatency = (ms = 400) => new Promise((resolve) => setTimeout(resolve, ms));

class MockAdService implements IAdService {
  async requestAd(
    request: AdRequest,
    adsEnabled: boolean,
    isPremium: boolean,
  ): Promise<AdCreative | null> {
    if (isPremium || !adsEnabled) return null;
    await simulateLatency();
    const creative = CREATIVES[request.slot];
    return { slot: request.slot, personalized: false, ...creative };
  }

  describeOutboundPayload(request: AdRequest): Record<string, string> {
    return { slot: request.slot, locale: request.locale };
  }
}

export const adService: IAdService = new MockAdService();
