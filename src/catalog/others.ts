import { AssetTypeDef, CONDITION_FIELD, SILVER_PURITY_OPTIONS } from './types';

/* ------------------------------------------------------------------ */
/* GÜMÜŞ — altınla aynı mantık: gram mı, işçilikli mi                  */
/* ------------------------------------------------------------------ */

export const SILVER_TYPES: AssetTypeDef[] = [
  {
    id: 'silver_gram',
    label: 'Gram Gümüş',
    category: 'silver',
    emoji: '⬜',
    keywords: ['gümüş', 'gram', 'külçe', '999'],
    unit: 'gram',
    pricing: 'metal',
    metal: {
      metal: 'silver',
      weightMode: 'byGram',
      marketFactor: 1,
      purityField: 'saflik',
      gramField: 'gram',
    },
    fields: [
      { key: 'gram', label: 'Kaç gram?', type: 'number', suffix: 'gram', required: true, defaultValue: '1' },
      { key: 'saflik', label: 'Saflık', type: 'select', options: SILVER_PURITY_OPTIONS, required: true },
    ],
  },
  {
    id: 'silver_ingot',
    label: 'Gümüş Külçe',
    category: 'silver',
    emoji: '🧊',
    keywords: ['gümüş', 'külçe', 'bar'],
    unit: 'gram',
    pricing: 'metal',
    metal: { metal: 'silver', weightMode: 'byGram', marketFactor: 1.02, purityField: 'saflik', gramField: 'gram' },
    fields: [
      {
        key: 'gram',
        label: 'Külçe ağırlığı',
        type: 'select',
        required: true,
        options: [
          { value: '100', label: '100 gram' },
          { value: '250', label: '250 gram' },
          { value: '500', label: '500 gram' },
          { value: '1000', label: '1 kilo' },
        ],
      },
      { key: 'saflik', label: 'Saflık', type: 'select', options: SILVER_PURITY_OPTIONS, required: true },
      { key: 'adet', label: 'Kaç tane?', type: 'number', suffix: 'adet', defaultValue: '1' },
    ],
  },
];

/** İşçilikli gümüş — gram fiyatı toplama dahil edilir, işçilik payı düşülür. */
function silverJewelry(id: string, label: string, emoji: string, keywords: string[]): AssetTypeDef {
  return {
    id,
    label,
    category: 'silver',
    emoji,
    keywords: ['gümüş', 'işçilikli', ...keywords],
    unit: 'gram',
    pricing: 'metal',
    metal: {
      metal: 'silver',
      weightMode: 'byGram',
      // Gümüşte işçilik geri dönüşü altından daha düşüktür.
      marketFactor: 0.8,
      purityField: 'saflik',
      gramField: 'gram',
    },
    fields: [
      { key: 'gram', label: 'Kaç gram geldi?', type: 'number', suffix: 'gram', required: true },
      { key: 'saflik', label: 'Saflık', type: 'select', options: SILVER_PURITY_OPTIONS, required: true },
      { key: 'adet', label: 'Kaç tane?', type: 'number', suffix: 'adet', defaultValue: '1' },
    ],
    hint: 'Gram değeri toplama katılır, işçilik payı düşülür.',
  };
}

SILVER_TYPES.push(
  silverJewelry('silver_yuzuk', 'Gümüş Yüzük', '💍', ['yüzük']),
  silverJewelry('silver_kolye', 'Gümüş Kolye', '📿', ['kolye']),
  silverJewelry('silver_bileklik', 'Gümüş Bileklik', '⛓️', ['bileklik']),
  silverJewelry('silver_set', 'Gümüş Takım', '✨', ['set', 'takım']),
  silverJewelry('silver_tepsi', 'Gümüş Tepsi / Servis', '🍽️', ['tepsi', 'servis', 'sofra']),
);

/* ------------------------------------------------------------------ */
/* PIRLANTA / DEĞERLİ TAŞ — alış ve güncel satış değeri elle girilir   */
/* ------------------------------------------------------------------ */

const GEM_FIELDS = [
  { key: 'karat', label: 'Kaç karat?', type: 'number' as const, suffix: 'karat', required: true },
  {
    key: 'sertifika',
    label: 'Sertifikası var mı?',
    type: 'select' as const,
    options: [
      { value: 'var', label: '📄 Var' },
      { value: 'yok', label: '❌ Yok' },
    ],
    required: true,
  },
  CONDITION_FIELD,
];

export const GEM_TYPES: AssetTypeDef[] = [
  {
    id: 'gem_solitaire',
    label: 'Pırlanta Tektaş',
    category: 'jewelry',
    emoji: '💎',
    keywords: ['pırlanta', 'tektaş', 'elmas', 'yüzük'],
    unit: 'piece',
    pricing: 'manualSale',
    fields: GEM_FIELDS,
    hint: 'Güncel satış değerini sen girersin, hatırlatırız.',
  },
  {
    id: 'gem_ring',
    label: 'Pırlanta Yüzük (çoklu taş)',
    category: 'jewelry',
    emoji: '💍',
    keywords: ['pırlanta', 'yüzük', 'beştaş'],
    unit: 'piece',
    pricing: 'manualSale',
    fields: GEM_FIELDS,
  },
  {
    id: 'gem_necklace',
    label: 'Pırlanta Kolye',
    category: 'jewelry',
    emoji: '📿',
    keywords: ['pırlanta', 'kolye'],
    unit: 'piece',
    pricing: 'manualSale',
    fields: GEM_FIELDS,
  },
  {
    id: 'gem_earring',
    label: 'Pırlanta Küpe',
    category: 'jewelry',
    emoji: '💠',
    keywords: ['pırlanta', 'küpe'],
    unit: 'piece',
    pricing: 'manualSale',
    fields: GEM_FIELDS,
  },
  {
    id: 'gem_other',
    label: 'Diğer Değerli Taş',
    category: 'jewelry',
    emoji: '🔷',
    keywords: ['zümrüt', 'yakut', 'safir', 'taş'],
    unit: 'piece',
    pricing: 'manualSale',
    fields: GEM_FIELDS,
  },
];

/* ------------------------------------------------------------------ */
/* GAYRİMENKUL — ev ve arsa                                            */
/* ------------------------------------------------------------------ */

const CITY_FIELD = {
  key: 'sehir',
  label: 'Hangi şehirde?',
  type: 'text' as const,
  placeholder: 'İstanbul, Ankara…',
  required: true,
};

export const PROPERTY_TYPES: AssetTypeDef[] = [
  {
    id: 'property_house',
    label: 'Ev / Daire',
    category: 'property',
    emoji: '🏠',
    keywords: ['ev', 'daire', 'konut', 'gayrimenkul'],
    unit: 'piece',
    pricing: 'manualSale',
    fields: [
      CITY_FIELD,
      { key: 'ilce', label: 'İlçe / semt', type: 'text', placeholder: 'Kadıköy…' },
      { key: 'm2', label: 'Kaç m²?', type: 'number', suffix: 'm²', required: true },
      {
        key: 'oda',
        label: 'Oda sayısı',
        type: 'select',
        required: true,
        options: [
          { value: '1+0', label: '1+0' },
          { value: '1+1', label: '1+1' },
          { value: '2+1', label: '2+1' },
          { value: '3+1', label: '3+1' },
          { value: '4+1', label: '4+1' },
          { value: '5+', label: '5+1 ve üzeri' },
        ],
      },
      { key: 'banyo', label: 'Kaç banyo?', type: 'number', suffix: 'adet', defaultValue: '1' },
      { key: 'yas', label: 'Bina yaşı', type: 'number', suffix: 'yıl' },
      {
        key: 'isitma',
        label: 'Isıtma',
        type: 'select',
        options: [
          { value: 'dogalgaz', label: 'Doğalgaz' },
          { value: 'merkezi', label: 'Merkezi' },
          { value: 'soba', label: 'Soba' },
          { value: 'yok', label: 'Yok' },
        ],
      },
    ],
    hint: 'Değerini sen belirlersin; piyasa fiyatı iddia etmeyiz.',
  },
  {
    id: 'property_land',
    label: 'Arsa / Tarla',
    category: 'property',
    emoji: '🌾',
    keywords: ['arsa', 'tarla', 'arazi', 'gayrimenkul', 'dönüm'],
    unit: 'piece',
    pricing: 'manualSale',
    fields: [
      CITY_FIELD,
      { key: 'ilce', label: 'İlçe / köy', type: 'text' },
      { key: 'donum', label: 'Kaç dönüm?', type: 'number', suffix: 'dönüm', required: true },
      {
        key: 'imar',
        label: 'İmar durumu',
        type: 'select',
        required: true,
        options: [
          { value: 'imarli', label: '🏗️ İmarlı' },
          { value: 'tarla', label: '🌾 Tarla vasfında' },
          { value: 'hisseli', label: '🧩 Hisseli' },
          { value: 'bilinmiyor', label: '🤷 Bilmiyorum' },
        ],
      },
      {
        key: 'tapu',
        label: 'Tapu durumu',
        type: 'select',
        options: [
          { value: 'mustakil', label: 'Müstakil tapu' },
          { value: 'hisseli', label: 'Hisseli tapu' },
        ],
      },
    ],
  },
  {
    id: 'property_shop',
    label: 'Dükkân / İşyeri',
    category: 'property',
    emoji: '🏪',
    keywords: ['dükkan', 'işyeri', 'ofis', 'mağaza'],
    unit: 'piece',
    pricing: 'manualSale',
    fields: [
      CITY_FIELD,
      { key: 'ilce', label: 'İlçe / semt', type: 'text' },
      { key: 'm2', label: 'Kaç m²?', type: 'number', suffix: 'm²', required: true },
      {
        key: 'kat',
        label: 'Konumu',
        type: 'select',
        options: [
          { value: 'cadde', label: 'Cadde üstü' },
          { value: 'ara', label: 'Ara sokak' },
          { value: 'avm', label: 'AVM içi' },
          { value: 'plaza', label: 'Plaza / ofis katı' },
        ],
      },
    ],
  },
];

/* ------------------------------------------------------------------ */
/* GENEL — her şey için manuel giriş, üç fiyat sorulur                 */
/* ------------------------------------------------------------------ */

/**
 * Marka/model listesi hazırlamak ciddi bir veri işi (ve sermaye) gerektirdiği
 * için araç, elektronik, koleksiyon gibi kalemlerde "listeden seç" yok.
 * Bunun yerine kullanıcı üç senaryoyu kendisi giriyor — uydurma fiyat
 * göstermektense dürüst olan bu.
 */
const MANUAL_BASE: Array<Pick<AssetTypeDef, 'id' | 'label' | 'category' | 'emoji' | 'keywords'>> = [
  { id: 'manual_vehicle', label: 'Araç', category: 'vehicle', emoji: '🚗', keywords: ['araba', 'otomobil', 'motosiklet', 'araç'] },
  { id: 'manual_electronics', label: 'Elektronik', category: 'electronics', emoji: '📱', keywords: ['telefon', 'bilgisayar', 'laptop', 'tablet', 'konsol'] },
  { id: 'manual_photo', label: 'Fotoğraf / Kamera', category: 'photography', emoji: '📷', keywords: ['kamera', 'lens', 'objektif', 'fotoğraf'] },
  { id: 'manual_watch', label: 'Saat', category: 'watch', emoji: '⌚', keywords: ['saat', 'kol saati', 'rolex'] },
  { id: 'manual_bicycle', label: 'Bisiklet / Scooter', category: 'bicycle', emoji: '🚲', keywords: ['bisiklet', 'scooter', 'motor'] },
  { id: 'manual_furniture', label: 'Mobilya / Beyaz Eşya', category: 'furniture', emoji: '🛋️', keywords: ['mobilya', 'koltuk', 'buzdolabı', 'çamaşır'] },
  { id: 'manual_collectible', label: 'Koleksiyon', category: 'collectible', emoji: '🏆', keywords: ['koleksiyon', 'plak', 'pul', 'kart', 'antika'] },
  { id: 'manual_hobby', label: 'Hobi Ekipmanı', category: 'other', emoji: '🎯', keywords: ['airsoft', 'silah', 'olta', 'kamp', 'müzik', 'gitar', 'spor'] },
  { id: 'manual_other', label: 'Diğer (ne olursa)', category: 'other', emoji: '📦', keywords: ['diğer', 'başka'] },
];

export const MANUAL_TYPES: AssetTypeDef[] = MANUAL_BASE.map((base) => ({
  ...base,
  unit: 'piece' as const,
  pricing: 'manual3' as const,
  fields: [
    { key: 'aciklama', label: 'Nesi var, nasıl bir şey?', type: 'text' as const, placeholder: 'Marka, model, ne olduğu…' },
    { key: 'adet', label: 'Kaç tane?', type: 'number' as const, suffix: 'adet', defaultValue: '1' },
    CONDITION_FIELD,
  ],
  hint: 'Üç fiyatı sen belirlersin.',
}));
