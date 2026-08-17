/** Bağımlılıksız, cihaz-yerel kimlik üretimi. Kişisel veri içermez. */
const ALPHABET = 'abcdefghijklmnopqrstuvwxyz0123456789';

export function createId(prefix = 'id'): string {
  let out = '';
  for (let i = 0; i < 12; i += 1) {
    out += ALPHABET[Math.floor(Math.random() * ALPHABET.length)];
  }
  return `${prefix}_${out}`;
}

/**
 * Sıralama için takma kimlik. Hesap veya cihaz kimliğiyle ilişkilendirilmez;
 * yalnızca cihazda saklanır.
 */
export function createPseudonymId(): string {
  return createId('anon');
}

export function nowIso(): string {
  return new Date().toISOString();
}
