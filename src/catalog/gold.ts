import { AssetTypeDef, KARAT_OPTIONS, MINT_DATE_OPTIONS } from './types';

/**
 * Altın kataloğu — Kapalıçarşı'da fiyatı oluşan ürünler.
 *
 * Ağırlıklar sektör standardıdır: ziynet altınlarında tam altın 7,216 g / 22 ayar
 * (≈6,608 g saf) kabul edilir; çeyrek bunun 1/4'ü, yarım 1/2'sidir. Ata (Cumhuriyet)
 * altını aynı seride ama darphane primi biraz farklıdır.
 *
 * `marketFactor`:
 *  - sikkelerde 1'in üzerindedir (darphane/işçilik primi piyasada fiyata yansır)
 *  - işçilikli takıda 1'in altındadır (satarken işçiliğin tamamı geri alınmaz)
 */

const ZIYNET_QUARTER_PURE = 1.652; // g saf altın (çeyrek)

function coin(
  id: string,
  label: string,
  pureGram: number,
  marketFactor: number,
  keywords: string[],
): AssetTypeDef {
  return {
    id,
    label,
    category: 'gold',
    emoji: '🪙',
    keywords: ['altın', 'ziynet', 'sikke', ...keywords],
    unit: 'piece',
    pricing: 'metal',
    metal: {
      metal: 'gold',
      weightMode: 'fixed',
      fixedPureGram: pureGram,
      marketFactor,
      multiplierFields: ['tarih'],
    },
    fields: [
      { key: 'adet', label: 'Kaç tane?', type: 'number', suffix: 'adet', required: true, defaultValue: '1' },
      { key: 'tarih', label: 'Eski tarih mi, yeni tarih mi?', type: 'select', options: MINT_DATE_OPTIONS, required: true },
    ],
  };
}

/** İşçilikli takı — ayar ve gram sorulur, işçilik geri dönüş oranı uygulanır. */
function jewelry(
  id: string,
  label: string,
  emoji: string,
  marketFactor: number,
  keywords: string[],
): AssetTypeDef {
  return {
    id,
    label,
    category: 'gold',
    emoji,
    keywords: ['altın', 'işçilikli', 'takı', ...keywords],
    unit: 'gram',
    pricing: 'metal',
    metal: {
      metal: 'gold',
      weightMode: 'byGram',
      marketFactor,
      purityField: 'ayar',
      gramField: 'gram',
    },
    fields: [
      { key: 'gram', label: 'Kaç gram geldi?', type: 'number', suffix: 'gram', required: true, hint: 'Kuyumcunun tarttığı gram.' },
      { key: 'ayar', label: 'Kaç ayar?', type: 'select', options: KARAT_OPTIONS, required: true },
      { key: 'adet', label: 'Kaç tane?', type: 'number', suffix: 'adet', defaultValue: '1' },
    ],
    hint: 'Ayarını ve gramını sorar, işçilik payını düşer.',
  };
}

export const GOLD_TYPES: AssetTypeDef[] = [
  // --- Gram / külçe ---
  {
    id: 'gold_gram',
    label: 'Gram Altın',
    category: 'gold',
    emoji: '🟨',
    keywords: ['altın', 'gram', 'has', 'külçe', '24', '22'],
    unit: 'gram',
    pricing: 'metal',
    metal: {
      metal: 'gold',
      weightMode: 'byGram',
      marketFactor: 1,
      purityField: 'ayar',
      gramField: 'gram',
    },
    fields: [
      { key: 'gram', label: 'Kaç gram?', type: 'number', suffix: 'gram', required: true, defaultValue: '1' },
      { key: 'ayar', label: 'Kaç ayar?', type: 'select', options: KARAT_OPTIONS, required: true },
    ],
    hint: 'Gramını ve ayarını sorar.',
  },
  {
    id: 'gold_ingot',
    label: 'Külçe Altın (sertifikalı)',
    category: 'gold',
    emoji: '🧱',
    keywords: ['altın', 'külçe', 'bar', 'ingot', 'sertifika'],
    unit: 'gram',
    pricing: 'metal',
    metal: {
      metal: 'gold',
      weightMode: 'byGram',
      // Sertifikalı külçe piyasada gram altının biraz üstünde işlem görür.
      marketFactor: 1.01,
      purityField: 'ayar',
      gramField: 'gram',
    },
    fields: [
      {
        key: 'gram',
        label: 'Kaç gramlık külçe?',
        type: 'select',
        required: true,
        options: [
          { value: '1', label: '1 gram' },
          { value: '2.5', label: '2,5 gram' },
          { value: '5', label: '5 gram' },
          { value: '10', label: '10 gram' },
          { value: '20', label: '20 gram' },
          { value: '50', label: '50 gram' },
          { value: '100', label: '100 gram' },
          { value: '250', label: '250 gram' },
          { value: '500', label: '500 gram' },
          { value: '1000', label: '1 kilo' },
        ],
      },
      { key: 'ayar', label: 'Ayarı', type: 'select', options: KARAT_OPTIONS, required: true },
      { key: 'adet', label: 'Kaç tane?', type: 'number', suffix: 'adet', defaultValue: '1' },
    ],
  },

  // --- Ziynet (sikke) altınları ---
  coin('gold_ceyrek', 'Çeyrek Altın', ZIYNET_QUARTER_PURE, 1.06, ['çeyrek']),
  coin('gold_yarim', 'Yarım Altın', ZIYNET_QUARTER_PURE * 2, 1.05, ['yarım']),
  coin('gold_tam', 'Tam Altın', ZIYNET_QUARTER_PURE * 4, 1.04, ['tam', 'birlik']),
  coin('gold_ata', 'Ata Altın (Cumhuriyet)', 6.608, 1.05, ['ata', 'cumhuriyet']),
  coin('gold_ata5', 'Beşli Ata Altın', 6.608 * 5, 1.045, ['ata', 'beşli', 'beşibirlik']),
  coin('gold_resat', 'Reşat Altın', 6.608, 1.12, ['reşat', 'hamit']),
  coin('gold_gremse', 'Gremse Altın', 6.608 * 2.5, 1.05, ['gremse']),
  coin('gold_ikibucuk', 'İkibuçuk Altın', ZIYNET_QUARTER_PURE * 10, 1.045, ['ikibuçuk', '2.5']),

  // --- İşçilikli takı ---
  jewelry('gold_bilezik', 'Altın Bilezik', '💫', 0.95, ['bilezik', 'burma', 'ajda', 'hasır']),
  jewelry('gold_kunye', 'Altın Künye', '🔗', 0.94, ['künye']),
  jewelry('gold_kolye', 'Altın Kolye', '📿', 0.93, ['kolye', 'zincir']),
  jewelry('gold_kupe', 'Altın Küpe', '💠', 0.92, ['küpe']),
  jewelry('gold_yuzuk', 'Altın Yüzük', '💍', 0.92, ['yüzük', 'alyans']),
  jewelry('gold_alyans', 'Alyans (çift)', '💑', 0.93, ['alyans', 'nişan', 'evlilik']),
  jewelry('gold_set', 'Altın Set (takım)', '👑', 0.93, ['set', 'takım', 'gelin']),
  jewelry('gold_bileklik', 'Altın Bileklik', '⛓️', 0.93, ['bileklik']),
  jewelry('gold_hali', 'Altın Halhal', '🦶', 0.92, ['halhal']),
  jewelry('gold_sarma', 'Sarma / Trabzon Hasırı', '🌀', 0.94, ['sarma', 'trabzon', 'hasır']),
];
