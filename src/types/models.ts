/**
 * KAPAMETRE domain modelleri.
 *
 * Ürün kuralı: bu uygulama banka, pazar yeri, sosyal platform veya
 * fotoğraf tabanlı envanter uygulaması DEĞİLDİR. Modeller yalnızca
 * "metin tabanlı varlık kaydı + 3 senaryoda değerleme" ihtiyacını karşılar.
 */

export type Currency = 'TRY' | 'USD' | 'EUR';

export type AssetCategory =
  | 'gold'
  | 'silver'
  | 'jewelry'
  | 'watch'
  | 'electronics'
  | 'photography'
  | 'vehicle'
  | 'bicycle'
  | 'furniture'
  | 'collectible'
  | 'property'
  | 'currency'
  | 'crypto'
  | 'other';

export type AssetCondition = 'new' | 'likeNew' | 'good' | 'fair' | 'poor';

export type MeasurementUnit = 'piece' | 'gram' | 'carat' | 'set';

/** Varlığın nasıl edinildiği — maliyet bilinmeyebilir, bu bir hata değildir. */
export type AcquisitionSource = 'purchase' | 'gift' | 'inheritance' | 'unknown';

/** Değerlemenin hangi senaryoda okunduğu. Normal = ana metrik. */
export type ValuationScenario = 'fast' | 'normal' | 'patient';

/** Değer hangi veriden türetildi — sahte kesinlik yok, kaynak her zaman görünür. */
export type ValuationSourceKind =
  | 'metal-price'
  | 'user-declared'
  | 'user-three-prices'
  | 'acquisition-fallback'
  | 'unavailable';

export interface ValuationSource {
  kind: ValuationSourceKind;
  /** Kullanıcıya gösterilecek kaynak etiketi. */
  label: string;
  /** ISO-8601. Kullanıcıya "ne kadar taze" bilgisini vermek zorunludur. */
  timestamp: string;
}

/** Bir varlığı oluşturan alt parça (ör. gövde + lens + çanta). */
export interface AssetComponent {
  id: string;
  assetId: string;
  name: string;
  category: AssetCategory;
  quantity: number;
  unit: MeasurementUnit;
  condition: AssetCondition;
  /** CatalogService referansı; serbest metin girişte boş kalır. */
  catalogRef?: string;
  notes?: string;
}

/** Edinim partisi — aynı varlık farklı tarih/maliyetlerde alınmış olabilir. */
export interface AcquisitionLot {
  id: string;
  assetId: string;
  /** ISO-8601 tarih. */
  acquiredAt: string;
  quantity: number;
  /** Birim maliyet. null = maliyet bilinmiyor (hediye/miras/unutulmuş). */
  unitCost: number | null;
  currency: Currency;
  source: AcquisitionSource;
  note?: string;
}

/** Kullanıcının üç senaryo için kendi girdiği fiyatlar. */
export interface ManualPrices {
  fast: number;
  normal: number;
  patient: number;
}

export interface Asset {
  id: string;
  name: string;
  /** Katalogdaki tür tanımı (`AssetTypeDef.id`). Fiyatlama ve sorular buradan gelir. */
  typeId: string;
  category: AssetCategory;
  condition: AssetCondition;
  quantity: number;
  unit: MeasurementUnit;
  /** Türe özel cevaplar: gram, ayar, m², oda sayısı… */
  attributes: Record<string, string>;
  components: AssetComponent[];
  lots: AcquisitionLot[];
  /**
   * Kullanıcının girdiği güncel satış değeri (pırlanta, ev, arsa gibi
   * piyasa fiyatı otomatik çekilemeyen kalemler için).
   */
  declaredSaleValue?: number | null;
  /** `manual3` fiyatlamada kullanıcının girdiği üç senaryo. */
  manualPrices?: ManualPrices | null;
  /** Elle güncellenen değerin en son ne zaman tazelendiği. */
  valueUpdatedAt?: string | null;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  isArchived: boolean;
}

/** Tek bir varlığın belirli bir andaki 3 senaryolu değerlemesi. */
export interface ValuationSnapshot {
  id: string;
  assetId: string;
  currency: Currency;
  /** Hızlı satış — likiditeye öncelik, en düşük değer. */
  fastValue: number;
  /** Normal satış — ANA METRİK. Sıralama ve toplamlar bunu kullanır. */
  normalValue: number;
  /** Tok satıcı — sabırlı satış, en yüksek değer. */
  patientValue: number;
  /** 0..1 arası. Sahte kesinlik yasak; düşük veri = düşük skor. */
  confidenceScore: number;
  source: ValuationSource;
  /** ISO-8601. source.timestamp ile aynı olabilir, ayrı alan zorunlu. */
  sourceTimestamp: string;
  /** Bilinen toplam edinim maliyeti; bilinmiyorsa null. */
  acquisitionCost: number | null;
  /** normalValue - acquisitionCost; maliyet bilinmiyorsa null. */
  unrealizedGain: number | null;
  /** Skorun neden o seviyede olduğunu açıklayan kısa notlar. */
  confidenceFactors: string[];
  computedAt: string;
}

export interface CategoryBreakdown {
  category: AssetCategory;
  normalValue: number;
  assetCount: number;
  /** 0..1 arası portföy payı. */
  share: number;
}

/** Tüm portföyün tek andaki özeti. */
export interface PortfolioSnapshot {
  id: string;
  createdAt: string;
  currency: Currency;
  totals: Record<ValuationScenario, number>;
  assetCount: number;
  /** Maliyeti bilinen kısmın toplamı. */
  knownAcquisitionCost: number;
  /** Maliyeti bilinmeyen varlık sayısı — şeffaflık için gösterilir. */
  unknownCostAssetCount: number;
  unrealizedGain: number | null;
  averageConfidence: number;
  byCategory: CategoryBreakdown[];
}

export type RankCohort = 'starter' | 'builder' | 'established' | 'advanced';

/** Sıralama katılımı ayrı ve açık rızaya bağlıdır. */
export interface RankConsent {
  granted: boolean;
  grantedAt: string | null;
  revokedAt: string | null;
  /** Kimliksiz, cihazda üretilen takma kimlik. Kişisel veri içermez. */
  pseudonymId: string | null;
  cohort: RankCohort | null;
  /** Sadece Normal Satış değeri paylaşılır — değişmez kural. */
  shareNormalValueOnly: true;
}

export type PremiumFeature =
  | 'detailed-rank'
  | 'valuation-history'
  | 'unlimited-assets'
  | 'ad-free'
  | 'export-report';

export interface SubscriptionEntitlement {
  tier: 'free' | 'premium';
  active: boolean;
  productId: string | null;
  /** ISO-8601 veya null (ücretsiz kademe). */
  renewsAt: string | null;
  source: 'mock-store';
  features: PremiumFeature[];
}

/** Sıralama sonucu — asla kullanıcı listesi içermez. */
export interface RankResult {
  cohort: RankCohort;
  /** Maskelenmiş yüzdelik dilim, ör. "üst %25". */
  maskedPercentile: string;
  /** Kaba kohort büyüklüğü; kesin sayı vermeyiz. */
  cohortSizeBucket: string;
  /** Premium olmayan kullanıcıda kilitli detay olduğunu belirtir. */
  detailLocked: boolean;
  computedAt: string;
}


/* ------------------------------------------------------------------ */
/* Maden fiyatı                                                        */
/* ------------------------------------------------------------------ */

export type MetalKind = 'gold' | 'silver';

/** Bir madenin gram cinsinden saf fiyatı. */
export interface MetalQuote {
  metal: MetalKind;
  /** 1 gram saf madenin TL karşılığı. */
  pricePerGram: number;
  currency: Currency;
  source: ValuationSource;
  /** Veri gerçek bir sağlayıcıdan mı geldi, yoksa demo tablosundan mı. */
  isLive: boolean;
}

/* ------------------------------------------------------------------ */
/* Hesap ve hatırlatma                                                 */
/* ------------------------------------------------------------------ */

/**
 * Kayıt profili.
 * E-posta sorulmuyor: doğrulama için sunucu gerekir, tutmadığımız veriyi
 * istemek de gereksiz. Yaş kontrolü için yalnızca doğum yılı yeterli.
 */
export interface UserProfile {
  firstName: string;
  /** Yalnızca yıl — 13 yaş kontrolü için bu kadarı yetiyor. */
  birthYear: number;
  /** Meslek listesinden seçilen kimlik. */
  professionId: string;
  createdAt: string;
}

/** Elle güncellenen değerler için hatırlatma sıklığı. */
export type ReminderFrequency = 'weekly' | 'biweekly' | 'monthly' | 'quarterly';

export interface ReminderSettings {
  /** Hatırlatma her zaman açık; kullanıcı yalnızca sıklığını değiştirir. */
  frequency: ReminderFrequency;
  lastPromptedAt: string | null;
}
