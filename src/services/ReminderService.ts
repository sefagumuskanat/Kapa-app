import { getAssetType } from '@/catalog';
import { localStore, STORAGE_KEYS } from '@/data/storage';
import { Asset, ReminderFrequency, ReminderSettings } from '@/types';
import { nowIso } from '@/utils/id';

/**
 * ReminderService — elle güncellenen değerler için hatırlatma.
 *
 * Altın/gümüş piyasadan otomatik güncellenir; pırlanta, ev, arsa ve elle üç
 * fiyat girilen kalemler bayatlar. Hatırlatma bu yüzden HER ZAMAN açıktır,
 * kullanıcı yalnızca sıklığını seçer.
 *
 * Bildirim: expo-notifications varsa yerel bildirim planlanır. Expo Go veya
 * web gibi izin/altyapı olmayan ortamlarda sessizce devre dışı kalır ve
 * uygulama içi hatırlatma şeridi devreye girer — yani hatırlatma hiçbir
 * koşulda tamamen kaybolmaz.
 */

export const FREQUENCY_DAYS: Record<ReminderFrequency, number> = {
  weekly: 7,
  biweekly: 14,
  monthly: 30,
  quarterly: 90,
};

export const FREQUENCY_LABEL: Record<ReminderFrequency, string> = {
  weekly: 'Haftada bir',
  biweekly: 'İki haftada bir',
  monthly: 'Ayda bir',
  quarterly: 'Üç ayda bir',
};

export const DEFAULT_REMINDER: ReminderSettings = {
  frequency: 'monthly',
  lastPromptedAt: null,
};

/** Samimi dille hatırlatma metinleri. */
const NUDGES = [
  { title: 'Hey, bir bakıver 👀', body: 'Elle girdiğin fiyatlar bayatladı. Güncelle de karnen doğru çıksın.' },
  { title: 'Fiyatlar eskidi 🕰️', body: 'Bazı eşyaların değerini epeydir güncellemedin. Bir dakikanı alır.' },
  { title: 'Karnen yanlış olabilir 📋', body: 'Güncellenmeyi bekleyen kalemler var. Şöyle bir göz at.' },
  { title: 'Malın kaç para etti? 🤔', body: 'Elle takip ettiğin kalemlerin fiyatını tazelemenin vakti geldi.' },
];

export function pickNudge() {
  return NUDGES[Math.floor(Math.random() * NUDGES.length)];
}

export interface IReminderService {
  getSettings(): Promise<ReminderSettings>;
  setFrequency(frequency: ReminderFrequency): Promise<ReminderSettings>;
  markPrompted(): Promise<ReminderSettings>;
  /** Elle güncellenmesi gereken ve süresi geçmiş varlıklar. */
  findStaleAssets(assets: Asset[], settings: ReminderSettings): Asset[];
  /** Bir varlık elle mi fiyatlanıyor (yani bayatlar mı)? */
  isManuallyPriced(asset: Asset): boolean;
  /** Yerel bildirimi planlar. Ortam desteklemiyorsa sessizce false döner. */
  schedule(settings: ReminderSettings): Promise<boolean>;
  cancelAll(): Promise<void>;
}

class ReminderServiceImpl implements IReminderService {
  async getSettings(): Promise<ReminderSettings> {
    return localStore.read<ReminderSettings>(STORAGE_KEYS.reminders, DEFAULT_REMINDER);
  }

  async setFrequency(frequency: ReminderFrequency): Promise<ReminderSettings> {
    const current = await this.getSettings();
    const next = { ...current, frequency };
    await localStore.write(STORAGE_KEYS.reminders, next);
    await this.schedule(next);
    return next;
  }

  async markPrompted(): Promise<ReminderSettings> {
    const current = await this.getSettings();
    const next = { ...current, lastPromptedAt: nowIso() };
    await localStore.write(STORAGE_KEYS.reminders, next);
    return next;
  }

  isManuallyPriced(asset: Asset): boolean {
    const type = getAssetType(asset.typeId);
    return type != null && type.pricing !== 'metal';
  }

  findStaleAssets(assets: Asset[], settings: ReminderSettings): Asset[] {
    const limitMs = FREQUENCY_DAYS[settings.frequency] * 86_400_000;
    const now = Date.now();
    return assets.filter((asset) => {
      if (!this.isManuallyPriced(asset)) return false;
      const ref = asset.valueUpdatedAt ?? asset.updatedAt;
      const then = new Date(ref).getTime();
      if (Number.isNaN(then)) return false;
      return now - then >= limitMs;
    });
  }

  async schedule(settings: ReminderSettings): Promise<boolean> {
    const notifications = await loadNotifications();
    if (!notifications) return false;

    try {
      const permission = await notifications.getPermissionsAsync();
      let granted = permission.granted;
      if (!granted) {
        const asked = await notifications.requestPermissionsAsync();
        granted = asked.granted;
      }
      if (!granted) return false;

      await notifications.cancelAllScheduledNotificationsAsync();
      const nudge = pickNudge();
      await notifications.scheduleNotificationAsync({
        content: { title: nudge.title, body: nudge.body },
        trigger: {
          type: 'timeInterval',
          seconds: FREQUENCY_DAYS[settings.frequency] * 86_400,
          repeats: true,
        },
      });
      return true;
    } catch {
      // Bildirim kurulamadıysa uygulama çalışmaya devam eder.
      return false;
    }
  }

  async cancelAll(): Promise<void> {
    const notifications = await loadNotifications();
    if (!notifications) return;
    try {
      await notifications.cancelAllScheduledNotificationsAsync();
    } catch {
      /* yoksay */
    }
  }
}

/**
 * expo-notifications'ı isteğe bağlı yükler. Web'de ve modülün bulunmadığı
 * ortamlarda uygulamayı çökertmemek için dinamik import kullanılıyor.
 */
async function loadNotifications(): Promise<any | null> {
  try {
    const mod = await import('expo-notifications');
    if (!mod?.scheduleNotificationAsync) return null;
    return mod;
  } catch {
    return null;
  }
}

export const reminderService: IReminderService = new ReminderServiceImpl();
