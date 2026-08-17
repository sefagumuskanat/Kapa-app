import { GOLD_TYPES } from './gold';
import { GEM_TYPES, MANUAL_TYPES, PROPERTY_TYPES, SILVER_TYPES } from './others';
import { AssetTypeDef } from './types';
import { AssetCategory } from '@/types';

export * from './types';

/** Uygulamadaki tüm varlık türleri. */
export const ASSET_TYPES: AssetTypeDef[] = [
  ...GOLD_TYPES,
  ...SILVER_TYPES,
  ...GEM_TYPES,
  ...PROPERTY_TYPES,
  ...MANUAL_TYPES,
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
