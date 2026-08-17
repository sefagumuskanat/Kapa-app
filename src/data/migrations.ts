import { getAssetType } from '@/catalog';
import { Asset, AssetCategory } from '@/types';

/**
 * Kayıtlı verinin şema göçü.
 *
 * NEDEN VAR
 * Varlık modeli değişti: eski sürümlerde `catalogRef` vardı, artık `typeId` ve
 * `attributes` var. Göç yapılmazsa eski kullanıcının kayıtları tür tanımına
 * bağlanamıyor ve listede **0 ₺** olarak görünüyor — yani adamın malı yok
 * olmuş gibi duruyor. Bu, güncelleme yapan herkesi etkileyecek bir hataydı.
 *
 * NE YAPIYOR
 *  1. Eski `catalogRef` değerlerini yeni tür kimliklerine eşliyor.
 *  2. Eşleşme yoksa kategoriye göre en yakın "elle fiyatlanan" türe düşürüyor.
 *  3. Eski alanlardan (quantity/unit/condition) yeni `attributes` üretiyor.
 *  4. Hiçbir şekilde kurtarılamayanı atıyor ve kaç tane attığını bildiriyor —
 *     sessizce silmek yerine kullanıcıya söylüyoruz.
 */

/** v1 kataloğundaki referanslar → yeni tür kimlikleri. */
const LEGACY_CATALOG_MAP: Record<string, string> = {
  cat_gold_22k: 'gold_gram',
  cat_gold_24k: 'gold_gram',
  cat_silver_925: 'silver_gram',
  cat_diamond_solitaire: 'gem_solitaire',
  cat_sony_a7iv: 'manual_photo',
  cat_sony_2470gm: 'manual_photo',
  cat_camera_bag: 'manual_photo',
  cat_phone_flagship: 'manual_electronics',
  cat_laptop_pro: 'manual_electronics',
  cat_bike_city: 'manual_bicycle',
  cat_bike_mtb: 'manual_bicycle',
  cat_watch_mech: 'manual_watch',
  cat_sofa_set: 'manual_furniture',
  cat_vinyl_collection: 'manual_collectible',
};

/** Referans tanınmazsa kategoriye göre son çare. */
const CATEGORY_FALLBACK: Partial<Record<AssetCategory, string>> = {
  gold: 'gold_gram',
  silver: 'silver_gram',
  jewelry: 'gem_other',
  property: 'property_house',
  vehicle: 'manual_vehicle',
  electronics: 'manual_electronics',
  photography: 'manual_photo',
  watch: 'manual_watch',
  bicycle: 'manual_bicycle',
  furniture: 'manual_furniture',
  collectible: 'manual_collectible',
  currency: 'fx_usd',
  crypto: 'crypto_btc',
  other: 'manual_other',
};

/** Eski kayıtta bulunabilecek alanlar. */
interface LegacyAsset extends Partial<Asset> {
  catalogRef?: string;
  declaredUnitValue?: number | null;
}

export interface MigrationResult {
  assets: Asset[];
  /** Şeması güncellenen kayıt sayısı. */
  migrated: number;
  /** Kurtarılamayıp atılan kayıt sayısı. */
  dropped: number;
}

export function migrateAssets(raw: unknown): MigrationResult {
  if (!Array.isArray(raw)) return { assets: [], migrated: 0, dropped: 0 };

  const assets: Asset[] = [];
  let migrated = 0;
  let dropped = 0;

  for (const item of raw as LegacyAsset[]) {
    if (!item || typeof item !== 'object' || !item.id || !item.name) {
      dropped += 1;
      continue;
    }

    // Zaten geçerli bir türü varsa dokunma.
    if (item.typeId && getAssetType(item.typeId)) {
      assets.push(normalize(item as Asset));
      continue;
    }

    const resolved = resolveTypeId(item);
    if (!resolved) {
      dropped += 1;
      continue;
    }

    assets.push(normalize(buildFromLegacy(item, resolved)));
    migrated += 1;
  }

  return { assets, migrated, dropped };
}

function resolveTypeId(item: LegacyAsset): string | null {
  if (item.catalogRef && LEGACY_CATALOG_MAP[item.catalogRef]) {
    return LEGACY_CATALOG_MAP[item.catalogRef];
  }
  if (item.category && CATEGORY_FALLBACK[item.category]) {
    return CATEGORY_FALLBACK[item.category] ?? null;
  }
  return 'manual_other';
}

function buildFromLegacy(item: LegacyAsset, typeId: string): Asset {
  const type = getAssetType(typeId);
  const attributes: Record<string, string> = { ...(item.attributes ?? {}) };

  // Eski alanlardan yeni soruların cevaplarını üret.
  const quantity = item.quantity ?? 1;
  if (type?.pricing === 'metal') {
    if (type.metal?.weightMode === 'byGram') {
      attributes.gram = attributes.gram ?? String(quantity);
      if (type.metal.metal === 'gold') {
        // 22 ayar eski kataloğun en yaygın kaydıydı; 24 ayar referansı ayrıca eşlenir.
        attributes.ayar = attributes.ayar ?? (item.catalogRef === 'cat_gold_24k' ? '24' : '22');
      } else {
        attributes.saflik = attributes.saflik ?? '925';
      }
    } else {
      attributes.adet = attributes.adet ?? String(quantity);
      attributes.tarih = attributes.tarih ?? 'yeni';
    }
  } else {
    attributes.adet = attributes.adet ?? String(quantity);
    if (item.condition) attributes.durum = attributes.durum ?? item.condition;
  }

  // Eski "declaredUnitValue" bugünkü değer yerine geçebilir.
  const declaredSaleValue =
    item.declaredSaleValue ??
    (item.declaredUnitValue != null && item.declaredUnitValue > 0
      ? item.declaredUnitValue * quantity
      : null);

  return {
    id: item.id as string,
    name: item.name as string,
    typeId,
    category: type?.category ?? item.category ?? 'other',
    condition: item.condition ?? 'good',
    quantity,
    unit: type?.unit ?? item.unit ?? 'piece',
    attributes,
    components: [],
    lots: Array.isArray(item.lots) ? item.lots : [],
    declaredSaleValue,
    manualPrices: item.manualPrices ?? null,
    valueUpdatedAt: item.valueUpdatedAt ?? item.updatedAt ?? null,
    notes: item.notes,
    createdAt: item.createdAt ?? new Date().toISOString(),
    updatedAt: item.updatedAt ?? new Date().toISOString(),
    isArchived: item.isArchived ?? false,
  };
}

/** Eksik alanları güvenli varsayılanlarla doldurur. */
function normalize(asset: Asset): Asset {
  return {
    ...asset,
    attributes: asset.attributes ?? {},
    components: asset.components ?? [],
    lots: Array.isArray(asset.lots) ? asset.lots : [],
    manualPrices: asset.manualPrices ?? null,
    declaredSaleValue: asset.declaredSaleValue ?? null,
  };
}
