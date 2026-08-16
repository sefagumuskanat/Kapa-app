import { localStore, STORAGE_KEYS } from '@/data/storage';
import { PremiumFeature, SubscriptionEntitlement } from '@/types';

/**
 * SubscriptionService (MOCK store).
 * Gerçek mağaza SDK'sı yoktur; satın alma ve geri yükleme simüle edilir.
 * Fiyatlar demo amaçlıdır, mağaza fiyatı iddiası taşımaz.
 */

export interface SubscriptionProduct {
  productId: string;
  title: string;
  /** Gösterim amaçlı mock fiyat metni. */
  priceLabel: string;
  periodLabel: string;
  badge?: string;
  savingLabel?: string;
}

export const PRODUCTS: SubscriptionProduct[] = [
  {
    productId: 'kapametre.premium.monthly',
    title: 'Aylık',
    priceLabel: '₺149',
    periodLabel: '/ay',
  },
  {
    productId: 'kapametre.premium.yearly',
    title: 'Yıllık',
    priceLabel: '₺1.190',
    periodLabel: '/yıl',
    badge: 'En popüler',
    savingLabel: '2 ay hediye',
  },
];

export const PREMIUM_FEATURES: Array<{ key: PremiumFeature; title: string; description: string }> = [
  {
    key: 'detailed-rank',
    title: 'Detaylı sıralama',
    description: 'Kohort içindeki dilimini ve zaman içindeki değişimini gör.',
  },
  {
    key: 'valuation-history',
    title: 'Değerleme geçmişi',
    description: 'Varlıklarının 3 senaryolu değer geçmişini sakla ve karşılaştır.',
  },
  {
    key: 'unlimited-assets',
    title: 'Sınırsız varlık',
    description: 'Ücretsiz kademedeki varlık sınırı kalkar.',
  },
  {
    key: 'ad-free',
    title: 'Reklamsız',
    description: 'Tüm reklam alanları kapanır.',
  },
  {
    key: 'export-report',
    title: 'Rapor dışa aktarma',
    description: 'Portföy özetini cihazında dosya olarak oluştur.',
  },
];

export const FREE_ASSET_LIMIT = 25;

const FREE_ENTITLEMENT: SubscriptionEntitlement = {
  tier: 'free',
  active: false,
  productId: null,
  renewsAt: null,
  source: 'mock-store',
  features: [],
};

export interface ISubscriptionService {
  getEntitlement(): Promise<SubscriptionEntitlement>;
  purchase(productId: string): Promise<SubscriptionEntitlement>;
  /** Mağaza "restore purchases" akışının stub'ı. */
  restorePurchases(): Promise<SubscriptionEntitlement>;
  cancel(): Promise<SubscriptionEntitlement>;
  listProducts(): SubscriptionProduct[];
  hasFeature(entitlement: SubscriptionEntitlement, feature: PremiumFeature): boolean;
}

const simulateLatency = (ms = 700) => new Promise((resolve) => setTimeout(resolve, ms));

class MockSubscriptionService implements ISubscriptionService {
  async getEntitlement(): Promise<SubscriptionEntitlement> {
    return localStore.read<SubscriptionEntitlement>(STORAGE_KEYS.subscription, FREE_ENTITLEMENT);
  }

  async purchase(productId: string): Promise<SubscriptionEntitlement> {
    await simulateLatency();
    const product = PRODUCTS.find((p) => p.productId === productId);
    if (!product) throw new Error('Ürün bulunamadı.');

    const renews = new Date();
    if (productId.endsWith('yearly')) renews.setFullYear(renews.getFullYear() + 1);
    else renews.setMonth(renews.getMonth() + 1);

    const entitlement: SubscriptionEntitlement = {
      tier: 'premium',
      active: true,
      productId,
      renewsAt: renews.toISOString(),
      source: 'mock-store',
      features: PREMIUM_FEATURES.map((f) => f.key),
    };
    await localStore.write(STORAGE_KEYS.subscription, entitlement);
    return entitlement;
  }

  async restorePurchases(): Promise<SubscriptionEntitlement> {
    await simulateLatency(900);
    // Stub: mağaza sorgusu yerine yerel kaydı döner.
    return this.getEntitlement();
  }

  async cancel(): Promise<SubscriptionEntitlement> {
    await simulateLatency(400);
    await localStore.write(STORAGE_KEYS.subscription, FREE_ENTITLEMENT);
    return FREE_ENTITLEMENT;
  }

  listProducts(): SubscriptionProduct[] {
    return PRODUCTS;
  }

  hasFeature(entitlement: SubscriptionEntitlement, feature: PremiumFeature): boolean {
    return entitlement.active && entitlement.features.includes(feature);
  }
}

export const subscriptionService: ISubscriptionService = new MockSubscriptionService();
export { FREE_ENTITLEMENT };
