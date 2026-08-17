import { localStore, STORAGE_KEYS } from '@/data/storage';
import { UserProfile } from '@/types';
import { nowIso } from '@/utils/id';

/**
 * AuthService — kayıt ve e-posta doğrulama.
 *
 * DÜRÜSTLÜK NOTU
 * Gerçek e-posta doğrulaması sunucu gerektirir; bu demoda sunucu yok.
 * Bu yüzden doğrulama kodu cihazda üretilir ve kullanıcıya ekranda gösterilir.
 * Uygulama bunu "e-posta gönderdik" diye yutturmaz — ekranda demo olduğu yazar.
 *
 * Gerçek uçlar bağlanacağı zaman değişmesi gereken tek yer bu dosyadır:
 * `register` → POST /auth/register, `verify` → POST /auth/verify.
 */

export interface RegistrationInput {
  firstName: string;
  lastName: string;
  birthDate: string;
  email: string;
  professionId: string;
}

export interface IAuthService {
  getProfile(): Promise<UserProfile | null>;
  /**
   * Bekleyen demo doğrulama kodu.
   * Sunucu olmadığı için kod cihazda tutuluyor ve ekranda gösteriliyor;
   * doğrulama ekranı bunu navigasyon parametresi yerine buradan okur
   * (koşullu navigasyonda parametre kaybolabiliyor).
   */
  peekDemoCode(): Promise<string | null>;
  register(input: RegistrationInput): Promise<{ profile: UserProfile; demoCode: string }>;
  verifyEmail(code: string): Promise<{ ok: boolean; message: string }>;
  resendCode(): Promise<string>;
  signOut(): Promise<void>;
  validate(input: RegistrationInput): Record<string, string>;
}

const CODE_KEY = 'auth-demo-code';
const simulate = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

function generateCode(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}

class MockAuthService implements IAuthService {
  async getProfile(): Promise<UserProfile | null> {
    return localStore.read<UserProfile | null>(STORAGE_KEYS.profile, null);
  }

  async peekDemoCode(): Promise<string | null> {
    return localStore.read<string | null>(CODE_KEY, null);
  }

  validate(input: RegistrationInput): Record<string, string> {
    const errors: Record<string, string> = {};
    if (input.firstName.trim().length < 2) errors.firstName = 'Adını yazar mısın?';
    if (input.lastName.trim().length < 2) errors.lastName = 'Soyadını da yazalım.';

    if (!/^\S+@\S+\.\S+$/.test(input.email.trim())) {
      errors.email = 'Bu e-posta doğru görünmüyor.';
    }

    const birth = new Date(input.birthDate);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(input.birthDate) || Number.isNaN(birth.getTime())) {
      errors.birthDate = 'Tarihi YYYY-AA-GG şeklinde yaz.';
    } else {
      const age = (Date.now() - birth.getTime()) / (365.25 * 86_400_000);
      if (age < 13) errors.birthDate = 'Uygulama 13 yaş ve üzeri için.';
      if (age > 120) errors.birthDate = 'Bu tarih biraz iddialı olmuş.';
    }

    if (!input.professionId) errors.professionId = 'Listeden bir meslek seç.';
    return errors;
  }

  async register(input: RegistrationInput) {
    const errors = this.validate(input);
    const first = Object.values(errors)[0];
    if (first) throw new Error(first);

    await simulate(700);

    const profile: UserProfile = {
      firstName: input.firstName.trim(),
      lastName: input.lastName.trim(),
      birthDate: input.birthDate,
      email: input.email.trim().toLocaleLowerCase('tr-TR'),
      professionId: input.professionId,
      emailVerified: false,
      createdAt: nowIso(),
    };

    const demoCode = generateCode();
    await localStore.write(STORAGE_KEYS.profile, profile);
    await localStore.write(CODE_KEY, demoCode);
    return { profile, demoCode };
  }

  async verifyEmail(code: string) {
    await simulate(600);
    const expected = await localStore.read<string | null>(CODE_KEY, null);
    if (!expected) return { ok: false, message: 'Doğrulama kodu bulunamadı, yeniden gönder.' };
    if (code.trim() !== expected) return { ok: false, message: 'Kod tutmadı, bir daha bak.' };

    const profile = await this.getProfile();
    if (!profile) return { ok: false, message: 'Kayıt bulunamadı.' };

    await localStore.write(STORAGE_KEYS.profile, { ...profile, emailVerified: true });
    await localStore.remove(CODE_KEY);
    return { ok: true, message: 'Doğrulandı.' };
  }

  async resendCode(): Promise<string> {
    await simulate(500);
    const code = generateCode();
    await localStore.write(CODE_KEY, code);
    return code;
  }

  async signOut(): Promise<void> {
    await localStore.remove(STORAGE_KEYS.profile);
    await localStore.remove(CODE_KEY);
  }
}

export const authService: IAuthService = new MockAuthService();
