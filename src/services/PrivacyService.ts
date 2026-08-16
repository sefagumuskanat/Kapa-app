import { localStore, STORAGE_KEYS } from '@/data/storage';

/**
 * PrivacyService (yerel şifreleme stub'ı + gizlilik merkezi mantığı).
 *
 * Mimari taahhütler:
 *  - Varlık verisi cihazda kalır.
 *  - Sunucuya yalnızca kategori/birim düzeyinde minimal fiyat sorgusu gider.
 *  - Analitik ve reklam katmanları varlık verisine erişemez.
 */

export interface PrivacyPreferences {
  /** Sıralamaya katılım ayrı rıza ile yönetilir (bkz. RankService). */
  adsEnabled: boolean;
  biometricLockEnabled: boolean;
  /** Ürün analitiği — asla varlık verisi içermez. */
  anonymousDiagnosticsEnabled: boolean;
  ageGatePassed: boolean;
  currency: 'TRY';
}

export const DEFAULT_PREFERENCES: PrivacyPreferences = {
  adsEnabled: true,
  biometricLockEnabled: false,
  anonymousDiagnosticsEnabled: false,
  ageGatePassed: false,
  currency: 'TRY',
};

export interface DataInventoryEntry {
  key: string;
  label: string;
  location: 'device' | 'server';
  description: string;
}

export interface IPrivacyService {
  getPreferences(): Promise<PrivacyPreferences>;
  updatePreferences(patch: Partial<PrivacyPreferences>): Promise<PrivacyPreferences>;
  /** Cihazdaki tüm KAPAMETRE verisini siler. Geri alınamaz. */
  deleteAllLocalData(): Promise<{ removedKeys: number }>;
  /** Biyometrik kilit stub'ı — gerçek üründe LocalAuthentication'a bağlanır. */
  authenticateWithBiometrics(): Promise<{ success: boolean; reason: string }>;
  /** Şifreleme durumunu UI'da göstermek için. */
  getEncryptionStatus(): { algorithm: string; keyLocation: string; isStub: boolean };
  getDataInventory(): DataInventoryEntry[];
}

class LocalPrivacyService implements IPrivacyService {
  async getPreferences(): Promise<PrivacyPreferences> {
    return localStore.read<PrivacyPreferences>(STORAGE_KEYS.preferences, DEFAULT_PREFERENCES);
  }

  async updatePreferences(patch: Partial<PrivacyPreferences>): Promise<PrivacyPreferences> {
    const current = await this.getPreferences();
    const next = { ...current, ...patch };
    await localStore.write(STORAGE_KEYS.preferences, next);
    return next;
  }

  async deleteAllLocalData(): Promise<{ removedKeys: number }> {
    const removedKeys = await localStore.wipeAll();
    return { removedKeys };
  }

  async authenticateWithBiometrics(): Promise<{ success: boolean; reason: string }> {
    await new Promise((resolve) => setTimeout(resolve, 600));
    // Stub: gerçek üründe expo-local-authentication çağrılır.
    return { success: true, reason: 'Demo modunda biyometrik doğrulama simüle edildi.' };
  }

  getEncryptionStatus() {
    return {
      algorithm: 'AES-GCM (yer tutucu)',
      keyLocation: 'Cihaz keystore (stub)',
      // Dürüstlük kuralı: stub olduğunu kullanıcıdan gizlemeyiz.
      isStub: true,
    };
  }

  getDataInventory(): DataInventoryEntry[] {
    return [
      {
        key: 'assets',
        label: 'Varlıklar ve edinim partileri',
        location: 'device',
        description: 'Şifreli yerel depoda tutulur, hiçbir zaman gönderilmez.',
      },
      {
        key: 'documents',
        label: 'Belgeler ve OCR alanları',
        location: 'device',
        description: 'Yalnızca cihazda işlenir; görüntü yüklenmez.',
      },
      {
        key: 'priceQuery',
        label: 'Fiyat sorgusu',
        location: 'server',
        description: 'Yalnızca kategori, birim ve para birimi gönderilir.',
      },
      {
        key: 'rank',
        label: 'Sıralama katılımı',
        location: 'server',
        description: 'Rıza verilirse takma kimlik + Normal Satış kovası gönderilir.',
      },
      {
        key: 'ads',
        label: 'Reklam',
        location: 'server',
        description: 'Bağlam dışı; varlık verisiyle hedefleme yapılmaz.',
      },
    ];
  }
}

export const privacyService: IPrivacyService = new LocalPrivacyService();
