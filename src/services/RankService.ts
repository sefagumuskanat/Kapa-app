import { localStore, STORAGE_KEYS } from '@/data/storage';
import { RankCohort, RankConsent, RankResult } from '@/types';
import { createPseudonymId, nowIso } from '@/utils/id';

/**
 * RankService (MOCK, opt-in).
 *
 * Değişmez kurallar:
 *  - Katılım varsayılan olarak KAPALI; ayrı ve açık rıza gerekir.
 *  - Yalnızca Normal Satış toplamı paylaşılır. Varlık listesi, kategori
 *    kırılımı, isim, konum veya hesap bilgisi ASLA paylaşılmaz.
 *  - Kullanıcı listesi, profil, takip, mesajlaşma YOKTUR.
 *  - Sonuç kohort bazlı ve maskelenmiştir; kesin sıra numarası verilmez.
 */

const DEFAULT_CONSENT: RankConsent = {
  granted: false,
  grantedAt: null,
  revokedAt: null,
  pseudonymId: null,
  cohort: null,
  shareNormalValueOnly: true,
};

/** Kohort eşikleri (TRY, mock). */
const COHORT_THRESHOLDS: Array<{ cohort: RankCohort; min: number; label: string }> = [
  { cohort: 'starter', min: 0, label: 'Başlangıç' },
  { cohort: 'builder', min: 250_000, label: 'Biriktiren' },
  { cohort: 'established', min: 1_500_000, label: 'Yerleşik' },
  { cohort: 'advanced', min: 5_000_000, label: 'İleri' },
];

export const COHORT_LABEL: Record<RankCohort, string> = {
  starter: 'Başlangıç',
  builder: 'Biriktiren',
  established: 'Yerleşik',
  advanced: 'İleri',
};

export interface IRankService {
  getConsent(): Promise<RankConsent>;
  grantConsent(): Promise<RankConsent>;
  revokeConsent(): Promise<RankConsent>;
  /** Yalnızca normalValue alır — imza bilinçli olarak dar tutulmuştur. */
  getRank(normalValue: number, isPremium: boolean): Promise<RankResult | null>;
  resolveCohort(normalValue: number): RankCohort;
  describeOutboundPayload(normalValue: number, consent: RankConsent): Record<string, string>;
}

const simulateLatency = (ms = 320) => new Promise((resolve) => setTimeout(resolve, ms));

class MockRankService implements IRankService {
  async getConsent(): Promise<RankConsent> {
    return localStore.read<RankConsent>(STORAGE_KEYS.rankConsent, DEFAULT_CONSENT);
  }

  async grantConsent(): Promise<RankConsent> {
    const current = await this.getConsent();
    const next: RankConsent = {
      ...current,
      granted: true,
      grantedAt: nowIso(),
      revokedAt: null,
      // Takma kimlik yalnızca rıza anında üretilir.
      pseudonymId: current.pseudonymId ?? createPseudonymId(),
      shareNormalValueOnly: true,
    };
    await localStore.write(STORAGE_KEYS.rankConsent, next);
    return next;
  }

  async revokeConsent(): Promise<RankConsent> {
    // Rıza geri alındığında takma kimlik de silinir.
    const next: RankConsent = {
      ...DEFAULT_CONSENT,
      revokedAt: nowIso(),
    };
    await localStore.write(STORAGE_KEYS.rankConsent, next);
    return next;
  }

  resolveCohort(normalValue: number): RankCohort {
    let cohort: RankCohort = 'starter';
    for (const threshold of COHORT_THRESHOLDS) {
      if (normalValue >= threshold.min) cohort = threshold.cohort;
    }
    return cohort;
  }

  async getRank(normalValue: number, isPremium: boolean): Promise<RankResult | null> {
    const consent = await this.getConsent();
    if (!consent.granted) return null;

    await simulateLatency();
    const cohort = this.resolveCohort(normalValue);
    return {
      cohort,
      maskedPercentile: maskPercentile(normalValue, cohort),
      cohortSizeBucket: cohortSizeBucket(cohort),
      detailLocked: !isPremium,
      computedAt: nowIso(),
    };
  }

  describeOutboundPayload(normalValue: number, consent: RankConsent): Record<string, string> {
    // Sunucuya giden her şeyin tamamı budur.
    return {
      pseudonymId: consent.pseudonymId ?? '—',
      normalValueBucket: bucketValue(normalValue),
      cohort: this.resolveCohort(normalValue),
    };
  }
}

/** Kesin yüzdelik vermeyiz; 5'lik dilimlere yuvarlanmış maske döneriz. */
function maskPercentile(normalValue: number, cohort: RankCohort): string {
  const index = COHORT_THRESHOLDS.findIndex((t) => t.cohort === cohort);
  const floor = COHORT_THRESHOLDS[index]?.min ?? 0;
  const ceil = COHORT_THRESHOLDS[index + 1]?.min ?? floor * 3 + 1_000_000;
  const span = Math.max(1, ceil - floor);
  const position = Math.min(1, Math.max(0, (normalValue - floor) / span));
  const topPercent = Math.max(5, Math.min(95, Math.round((1 - position) * 100 / 5) * 5));
  return `üst %${topPercent}`;
}

/** Kohort büyüklüğü kaba kova olarak verilir; kesin sayı sızdırmayız. */
function cohortSizeBucket(cohort: RankCohort): string {
  switch (cohort) {
    case 'starter':
      return '10.000+ katılımcı';
    case 'builder':
      return '5.000+ katılımcı';
    case 'established':
      return '1.000+ katılımcı';
    case 'advanced':
      return '250+ katılımcı';
    default:
      return '—';
  }
}

/** Değer bile ham gönderilmez; kova etiketine indirgenir. */
function bucketValue(normalValue: number): string {
  if (normalValue < 250_000) return '0-250K';
  if (normalValue < 1_500_000) return '250K-1.5M';
  if (normalValue < 5_000_000) return '1.5M-5M';
  return '5M+';
}

export const rankService: IRankService = new MockRankService();
export { DEFAULT_CONSENT as DEFAULT_RANK_CONSENT };
