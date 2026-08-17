import { localStore } from '@/data/storage';

/**
 * AdService — reklam yerleşimleri ve gösterim kuralları.
 *
 * Reklam politikası tek yerde ve kesindir:
 *  - Ücretsiz kademede reklam KAPATILAMAZ (uygulamayı bu finanse ediyor).
 *  - Premium'da reklam AÇILAMAZ; istese de gösterilmez.
 *
 * Gizlilik: reklam isteği hiçbir finansal veri, varlık adı veya portföy
 * değeri taşımaz. Yalnızca slot kimliği ve dil gider.
 */

export type AdSlot =
  | 'home-footer'
  | 'asset-list-footer'
  | 'ranking-footer'
  | 'app-open'
  | 'before-add'
  | 'before-share'
  | 'before-update';

/** Tam ekran mı, şerit mi. */
export type AdFormat = 'banner' | 'interstitial' | 'rewarded';

export interface AdCreative {
  slot: AdSlot;
  format: AdFormat;
  headline: string;
  body: string;
  ctaLabel: string;
  /** Atlanabilir tam ekran reklamlarda kaç saniye sonra geçilebilir. */
  skipAfterSeconds?: number;
  personalized: false;
}

export interface AdRequest {
  slot: AdSlot;
  locale: 'tr-TR';
}

export interface IAdService {
  requestAd(request: AdRequest, isPremium: boolean): Promise<AdCreative | null>;
  /**
   * Fiyat güncellerken reklam gösterilsin mi?
   * Günde bir kez gösterilir — 10 ürün güncelleyen kullanıcı 10 reklam görmez.
   */
  shouldShowUpdateAd(isPremium: boolean): Promise<boolean>;
  markUpdateAdShown(): Promise<void>;
  describeOutboundPayload(request: AdRequest): Record<string, string>;
}

const UPDATE_AD_KEY = 'ad-update-last-shown';

const CREATIVES: Record<AdSlot, Omit<AdCreative, 'slot' | 'personalized'>> = {
  'home-footer': {
    format: 'banner',
    headline: 'Burası reklam yeri 🙂',
    body: 'Merak etme, reklamcılar senin neyin olduğunu görmüyor. Premium alırsan burası tamamen kapanır.',
    ctaLabel: 'Şunları kaldır',
  },
  'asset-list-footer': {
    format: 'banner',
    headline: 'Reklamsız takılmak ister misin?',
    body: 'Listendeki hiçbir şey reklamcılara gitmiyor — zaten gitmeyecek. Ama görüntü kirliliğinden kurtulabilirsin.',
    ctaLabel: 'Premium’a bakayım',
  },
  'ranking-footer': {
    format: 'banner',
    headline: 'Sıralamanın reklamla alakası yok',
    body: 'Hangi ligde olduğunla reklamlar arasında hiçbir bağ kurmuyoruz.',
    ctaLabel: 'Premium’a bakayım',
  },
  'app-open': {
    format: 'interstitial',
    headline: 'Günaydın, bir saniye 👋',
    body: 'Uygulamayı ücretsiz tutabilmek için açılışta bir reklam gösteriyoruz. Premium’da hiç çıkmaz.',
    ctaLabel: 'Premium’a geç',
  },
  'before-add': {
    format: 'rewarded',
    headline: 'Kısa bir reklam',
    body: 'Yeni bir şey eklemeden önce bir reklam. Premium’da bu ekran hiç çıkmaz.',
    ctaLabel: 'Premium’a geç',
    skipAfterSeconds: 5,
  },
  'before-share': {
    format: 'rewarded',
    headline: 'Paylaşmadan önce',
    body: 'Karneni paylaşmak bedava, reklam da öyle. Premium’da atlanır.',
    ctaLabel: 'Premium’a geç',
    skipAfterSeconds: 5,
  },
  'before-update': {
    format: 'rewarded',
    headline: 'Fiyatları elle mi giriyorsun?',
    body: 'Premium’da altın, döviz ve kripto fiyatları kendiliğinden güncellenir. Elle uğraşmazsın.',
    ctaLabel: 'Otomatik olsun',
    skipAfterSeconds: 5,
  },
};

const simulateLatency = (ms = 300) => new Promise((resolve) => setTimeout(resolve, ms));

class MockAdService implements IAdService {
  async requestAd(request: AdRequest, isPremium: boolean): Promise<AdCreative | null> {
    if (isPremium) return null;
    await simulateLatency();
    const creative = CREATIVES[request.slot];
    if (!creative) return null;
    return { slot: request.slot, personalized: false, ...creative };
  }

  async shouldShowUpdateAd(isPremium: boolean): Promise<boolean> {
    if (isPremium) return false;
    const last = await localStore.read<string | null>(UPDATE_AD_KEY, null);
    if (!last) return true;
    const then = new Date(last).getTime();
    if (Number.isNaN(then)) return true;
    // Aynı gün içinde tekrar gösterme.
    return Date.now() - then >= 24 * 60 * 60 * 1000;
  }

  async markUpdateAdShown(): Promise<void> {
    await localStore.write(UPDATE_AD_KEY, new Date().toISOString());
  }

  describeOutboundPayload(request: AdRequest): Record<string, string> {
    // Reklam katmanına giden her şeyin tamamı budur.
    return { slot: request.slot, locale: request.locale };
  }
}

export const adService: IAdService = new MockAdService();
