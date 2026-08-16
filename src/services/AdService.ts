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
    headline: 'Burası reklam yeri 🙂',
    body: 'Merak etme, reklamcılar senin neyin olduğunu görmüyor. Premium alırsan burası tamamen kapanır.',
    ctaLabel: 'Şunları kaldır',
  },
  'asset-list-footer': {
    headline: 'Reklamsız takılmak ister misin?',
    body: 'Listendeki hiçbir şey reklamcılara gitmiyor — zaten gitmeyecek. Ama görüntü kirliliğinden kurtulabilirsin.',
    ctaLabel: 'Premium’a bakayım',
  },
  'ranking-footer': {
    headline: 'Sıralamanın reklamla alakası yok',
    body: 'Hangi ligde olduğunla reklamlar arasında hiçbir bağ kurmuyoruz.',
    ctaLabel: 'Premium’a bakayım',
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
