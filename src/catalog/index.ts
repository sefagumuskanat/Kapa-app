import { GOLD_TYPES } from './gold';
import { CRYPTO_TYPES, FX_TYPES } from './money';
import { GEM_TYPES, MANUAL_TYPES, PROPERTY_TYPES, SILVER_TYPES } from './others';
import { AssetTypeDef } from './types';
import { AssetCategory } from '@/types';

export * from './types';

/** Uygulamadaki tüm varlık türleri. */
export const ASSET_TYPES: AssetTypeDef[] = [
  ...GOLD_TYPES,
  ...SILVER_TYPES,
  ...GEM_TYPES,
  ...FX_TYPES,
  ...CRYPTO_TYPES,
  ...PROPERTY_TYPES,
  ...MANUAL_TYPES,
];

/**
 * "Ne ekliyoruz?" ekranında gösterilen üst düzey seçenekler.
 *
 * Kullanıcı önce "Altın ekle" der, sonra hangi altın olduğunu açılır listeden
 * seçer. Böylece ilk ekran 44 satırlık altın listesiyle dolmaz.
 */
export interface AddGroup {
  id: string;
  label: string;
  emoji: string;
  category: AssetCategory;
  /** Kullanıcıya ne bekleyeceğini söyleyen tek satır. */
  hint: string;
}

export const ADD_GROUPS: AddGroup[] = [
  { id: 'gold', label: 'Altın', emoji: '🪙', category: 'gold', hint: 'Gram, çeyrek, bilezik…' },
  { id: 'silver', label: 'Gümüş', emoji: '🥈', category: 'silver', hint: 'Gram, külçe, takı' },
  { id: 'jewelry', label: 'Mücevher', emoji: '💎', category: 'jewelry', hint: 'Pırlanta ve değerli taş' },
  { id: 'currency', label: 'Döviz', emoji: '💵', category: 'currency', hint: 'Dolar, euro, sterlin…' },
  { id: 'crypto', label: 'Kripto', emoji: '₿', category: 'crypto', hint: 'Bitcoin, Ethereum…' },
  { id: 'property', label: 'Gayrimenkul', emoji: '🏠', category: 'property', hint: 'Ev, arsa, dükkân' },
  { id: 'vehicle', label: 'Araç', emoji: '🚗', category: 'vehicle', hint: 'Araba, motor' },
  { id: 'electronics', label: 'Elektronik', emoji: '📱', category: 'electronics', hint: 'Telefon, bilgisayar' },
  { id: 'photography', label: 'Fotoğraf', emoji: '📷', category: 'photography', hint: 'Kamera, lens' },
  { id: 'watch', label: 'Saat', emoji: '⌚', category: 'watch', hint: 'Kol saati' },
  { id: 'bicycle', label: 'Bisiklet', emoji: '🚲', category: 'bicycle', hint: 'Bisiklet, scooter' },
  { id: 'furniture', label: 'Mobilya', emoji: '🛋️', category: 'furniture', hint: 'Mobilya, beyaz eşya' },
  { id: 'collectible', label: 'Koleksiyon', emoji: '🏆', category: 'collectible', hint: 'Plak, pul, antika' },
  { id: 'other', label: 'Diğer', emoji: '📦', category: 'other', hint: 'Ne olursa' },
];

const BY_ID = new Map(ASSET_TYPES.map((t) => [t.id, t]));

export function getAssetType(id: string | undefined): AssetTypeDef | null {
  if (!id) return null;
  return BY_ID.get(id) ?? null;
}

/** Türkçe arama için normalizasyon (ı/İ, ğ, ş, ö, ç, ü). */
export function normalizeTr(input: string): string {
  return input
    .toLocaleLowerCase('tr-TR')
    .replace(/ı/g, 'i')
    .replace(/ğ/g, 'g')
    .replace(/ü/g, 'u')
    .replace(/ş/g, 's')
    .replace(/ö/g, 'o')
    .replace(/ç/g, 'c')
    .trim();
}

/**
 * Yazarken arama. Kullanıcı "çey" yazınca Çeyrek Altın çıkmalı, daha önce
 * hiç eklememiş olsa bile.
 */
export function searchAssetTypes(query: string, category?: AssetCategory): AssetTypeDef[] {
  const q = normalizeTr(query);
  return ASSET_TYPES.filter((type) => {
    if (category && type.category !== category) return false;
    if (!q) return true;
    const haystack = normalizeTr([type.label, ...type.keywords].join(' '));
    return haystack.includes(q);
  });
}

/** Kategori sekmelerinde gösterilecek sıra. */
export const CATEGORY_ORDER: AssetCategory[] = [
  'gold',
  'silver',
  'jewelry',
  'currency',
  'crypto',
  'property',
  'vehicle',
  'electronics',
  'photography',
  'watch',
  'bicycle',
  'furniture',
  'collectible',
  'other',
];

export function typesByCategory(category: AssetCategory): AssetTypeDef[] {
  return ASSET_TYPES.filter((t) => t.category === category);
}

/** Katalogda en az bir türü olan kategoriler. */
export const AVAILABLE_CATEGORIES: AssetCategory[] = CATEGORY_ORDER.filter(
  (c) => ASSET_TYPES.some((t) => t.category === c),
);
