import { AssetCategory, MeasurementUnit } from '@/types';

/**
 * Varlık türü tanımı.
 *
 * Uygulamanın "listeden seç" tarafı buradan beslenir. Eski katalog yalnızca
 * kullanıcının daha önce eklediklerine benzer birkaç satır içeriyordu; artık
 * her tür kendi sorularını ve fiyatlama modelini kendi taşıyor.
 */

export type FieldType = 'number' | 'text' | 'select';

export interface FieldOption {
  value: string;
  label: string;
  /** Fiyat modelinde kullanılan sayısal karşılık (ör. ayar milyemi). */
  factor?: number;
}

export interface FieldDef {
  key: string;
  label: string;
  type: FieldType;
  options?: FieldOption[];
  suffix?: string;
  placeholder?: string;
  hint?: string;
  required?: boolean;
  /** Sayısal alanlar için varsayılan. */
  defaultValue?: string;
}

/**
 * Fiyatlama modeli:
 *  - `metal`     : canlı maden fiyatından hesaplanır (altın, gümüş)
 *  - `manualSale`: kullanıcı tek bir güncel satış değeri girer, 3 senaryo türetilir
 *  - `manual3`   : kullanıcı üç senaryoyu da kendi girer
 */
export type PricingMode = 'metal' | 'manualSale' | 'manual3';

export type MetalKind = 'gold' | 'silver';

export interface MetalPricing {
  metal: MetalKind;
  /**
   * Saf maden ağırlığı nasıl bulunur:
   *  - `byGram`  : kullanıcının girdiği gram × ayar milyemi
   *  - `fixed`   : sabit ağırlıklı sikke (çeyrek, tam vb.)
   */
  weightMode: 'byGram' | 'fixed';
  /** `fixed` için gram cinsinden saf maden ağırlığı. */
  fixedPureGram?: number;
  /**
   * Piyasa çarpanı. Sikkelerde darphane primi (>1), işçilikli üründe
   * satarken işçiliğin tamamı geri alınamadığı için geri dönüş oranı (<1).
   */
  marketFactor: number;
  /** Hangi alan ayar/milyem taşıyor (byGram için). */
  purityField?: string;
  /** Hangi alan gram taşıyor (byGram için). */
  gramField?: string;
  /** Seçilen opsiyonun `factor` değeriyle çarpılacak alanlar (ör. eski/yeni tarih). */
  multiplierFields?: string[];
}

export interface AssetTypeDef {
  id: string;
  label: string;
  category: AssetCategory;
  emoji: string;
  /** Arama için ek anahtar kelimeler. */
  keywords: string[];
  unit: MeasurementUnit;
  pricing: PricingMode;
  metal?: MetalPricing;
  /** Türe özel sorular. */
  fields: FieldDef[];
  /** Listede kısa açıklama. */
  hint?: string;
}

/** Ayar → milyem (saflık) karşılıkları. Kapalıçarşı'da kullanılan standart. */
export const KARAT_OPTIONS: FieldOption[] = [
  { value: '24', label: '24 ayar (has)', factor: 0.995 },
  { value: '22', label: '22 ayar', factor: 0.916 },
  { value: '18', label: '18 ayar', factor: 0.75 },
  { value: '14', label: '14 ayar', factor: 0.585 },
  { value: '8', label: '8 ayar', factor: 0.333 },
];

export const SILVER_PURITY_OPTIONS: FieldOption[] = [
  { value: '999', label: '999 (saf)', factor: 0.999 },
  { value: '925', label: '925 (sterling)', factor: 0.925 },
  { value: '900', label: '900', factor: 0.9 },
];

/** Sikkelerde eski tarih biraz daha ağır basar. */
export const MINT_DATE_OPTIONS: FieldOption[] = [
  { value: 'yeni', label: 'Yeni tarih', factor: 1 },
  { value: 'eski', label: 'Eski tarih', factor: 1.02 },
];

export const CONDITION_FIELD: FieldDef = {
  key: 'durum',
  label: 'Durumu',
  type: 'select',
  required: true,
  options: [
    { value: 'new', label: '✨ Sıfır' },
    { value: 'likeNew', label: '🌟 Sıfır ayarında' },
    { value: 'good', label: '👍 İyi durumda' },
    { value: 'fair', label: '🤷 İdare eder' },
    { value: 'poor', label: '🩹 Epey yıpranmış' },
  ],
};
