import { localStore, STORAGE_KEYS } from '@/data/storage';
import { UserProfile } from '@/types';
import { nowIso } from '@/utils/id';

/**
 * AuthService — kayıt.
 *
 * Bilinçli olarak minimum veri: ad, doğum yılı, meslek. E-posta sorulmuyor
 * çünkü doğrulaması sunucu ister ve doğrulayamayacağımız bir veriyi
 * toplamanın anlamı yok. Yaş kontrolü için yıl yeterli.
 *
 * İnsan doğrulaması da en basit hâliyle: iki basamaklı bir toplama sorusu.
 * Bot caydırıcıdır, kullanıcıyı yormaz, üçüncü tarafa veri göndermez.
 */

export const MIN_AGE = 13;

export interface RegistrationInput {
  firstName: string;
  birthYear: string;
  professionId: string;
}

/** Basit insan doğrulaması sorusu. */
export interface HumanCheck {
  a: number;
  b: number;
  question: string;
}

export interface IAuthService {
  getProfile(): Promise<UserProfile | null>;
  register(input: RegistrationInput): Promise<UserProfile>;
  signOut(): Promise<void>;
  validate(input: RegistrationInput): Record<string, string>;
  createHumanCheck(): HumanCheck;
  verifyHumanCheck(check: HumanCheck, answer: string): boolean;
}

const simulate = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

class LocalAuthService implements IAuthService {
  async getProfile(): Promise<UserProfile | null> {
    return localStore.read<UserProfile | null>(STORAGE_KEYS.profile, null);
  }

  createHumanCheck(): HumanCheck {
    const a = 2 + Math.floor(Math.random() * 8);
    const b = 2 + Math.floor(Math.random() * 8);
    return { a, b, question: `${a} + ${b} kaç eder?` };
  }

  verifyHumanCheck(check: HumanCheck, answer: string): boolean {
    const parsed = Number(answer.trim());
    return Number.isFinite(parsed) && parsed === check.a + check.b;
  }

  validate(input: RegistrationInput): Record<string, string> {
    const errors: Record<string, string> = {};

    if (input.firstName.trim().length < 2) errors.firstName = 'Adını yazar mısın?';

    const year = Number(input.birthYear);
    const thisYear = new Date().getFullYear();
    if (!/^\d{4}$/.test(input.birthYear.trim()) || !Number.isFinite(year)) {
      errors.birthYear = 'Doğum yılını 4 haneli yaz (1990 gibi).';
    } else if (year > thisYear) {
      errors.birthYear = 'Gelecekten mi geldin?';
    } else if (thisYear - year < MIN_AGE) {
      errors.birthYear = `Uygulama ${MIN_AGE} yaş ve üzeri için.`;
    } else if (thisYear - year > 120) {
      errors.birthYear = 'Bu yıl biraz iddialı olmuş.';
    }

    if (!input.professionId) errors.professionId = 'Listeden bir meslek seç.';
    return errors;
  }

  async register(input: RegistrationInput): Promise<UserProfile> {
    const errors = this.validate(input);
    const first = Object.values(errors)[0];
    if (first) throw new Error(first);

    await simulate(500);

    const profile: UserProfile = {
      firstName: input.firstName.trim(),
      birthYear: Number(input.birthYear),
      professionId: input.professionId,
      createdAt: nowIso(),
    };

    await localStore.write(STORAGE_KEYS.profile, profile);
    return profile;
  }

  async signOut(): Promise<void> {
    await localStore.remove(STORAGE_KEYS.profile);
  }
}

export const authService: IAuthService = new LocalAuthService();
