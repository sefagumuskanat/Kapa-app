import { confidenceVibe, SCENARIO_VIBE } from '@/content/vibes';
import { AssetCategory, AssetCondition, Currency, MeasurementUnit, ValuationScenario } from '@/types';

const CURRENCY_SYMBOL: Record<Currency, string> = {
  TRY: '₺',
  USD: '$',
  EUR: '€',
};

/** Türkçe biçim: 1.234.567 ₺ */
export function formatCurrency(value: number, currency: Currency = 'TRY', compact = false): string {
  const symbol = CURRENCY_SYMBOL[currency];
  if (compact && Math.abs(value) >= 1_000_000) {
    return `${trimZero(value / 1_000_000)} Mn ${symbol}`;
  }
  if (compact && Math.abs(value) >= 10_000) {
    return `${trimZero(value / 1000)} B ${symbol}`;
  }
  return `${groupDigits(Math.round(value))} ${symbol}`;
}

function trimZero(n: number): string {
  const fixed = n.toFixed(1);
  return fixed.endsWith('.0') ? fixed.slice(0, -2).replace('.', ',') : fixed.replace('.', ',');
}

function groupDigits(value: number): string {
  const negative = value < 0;
  const digits = Math.abs(value).toString();
  let out = '';
  for (let i = 0; i < digits.length; i += 1) {
    const fromEnd = digits.length - i;
    out += digits[i];
    if (fromEnd > 1 && fromEnd % 3 === 1) out += '.';
  }
  return negative ? `-${out}` : out;
}

export function formatSignedCurrency(value: number, currency: Currency = 'TRY'): string {
  const sign = value > 0 ? '+' : '';
  return `${sign}${formatCurrency(value, currency)}`;
}

export function formatPercent(ratio: number, digits = 0): string {
  return `%${(ratio * 100).toFixed(digits).replace('.', ',')}`;
}

export function formatDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${pad(d.getDate())}.${pad(d.getMonth() + 1)}.${d.getFullYear()}`;
}

export function formatRelativeTime(iso: string): string {
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return '—';
  const diffMin = Math.max(0, Math.round((Date.now() - then) / 60000));
  if (diffMin < 1) return 'az önce';
  if (diffMin < 60) return `${diffMin} dk önce`;
  const diffHour = Math.round(diffMin / 60);
  if (diffHour < 24) return `${diffHour} sa önce`;
  const diffDay = Math.round(diffHour / 24);
  if (diffDay < 30) return `${diffDay} gün önce`;
  return formatDate(iso);
}

/** Emoji + isim — liste ve filtrelerde birlikte kullanılır. */
export const CATEGORY_LABEL: Record<AssetCategory, string> = {
  gold: 'Altın',
  silver: 'Gümüş',
  jewelry: 'Mücevher',
  watch: 'Saat',
  electronics: 'Elektronik',
  photography: 'Fotoğraf',
  vehicle: 'Araç',
  bicycle: 'Bisiklet',
  furniture: 'Mobilya',
  collectible: 'Koleksiyon',
  property: 'Gayrimenkul',
  other: 'Diğer',
};

export const CONDITION_LABEL: Record<AssetCondition, string> = {
  new: 'Sıfır',
  likeNew: 'Sıfır ayarında',
  good: 'İyi durumda',
  fair: 'İdare eder',
  poor: 'Epey yıpranmış',
};

export const UNIT_LABEL: Record<MeasurementUnit, string> = {
  piece: 'adet',
  gram: 'gram',
  carat: 'karat',
  set: 'set',
};

export const SCENARIO_LABEL: Record<ValuationScenario, string> = {
  fast: 'Hızlı Satış',
  normal: 'Normal Satış',
  patient: 'Tok Satıcı',
};

export const SCENARIO_HINT: Record<ValuationScenario, string> = {
  fast: SCENARIO_VIBE.fast.hint,
  normal: SCENARIO_VIBE.normal.hint,
  patient: SCENARIO_VIBE.patient.hint,
};

/** Güven skorunun mahalle ağzıyla karşılığı. */
export function confidenceLabel(score: number): string {
  return confidenceVibe(score).label;
}
