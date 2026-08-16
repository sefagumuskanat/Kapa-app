/**
 * KAPAMETRE renk paleti — dark-first.
 * Ürün kuralı: premium, finansal ama "bankacı" değil.
 */
export const colors = {
  background: '#0B1220',
  card: '#141C2B',
  cardElevated: '#1B2536',
  green: '#29D391',
  gold: '#F4C766',
  red: '#FF6B6B',
  text: '#F7F9FC',

  // Türetilmiş tonlar (paletten çıkarıldı, yeni ana renk eklenmedi)
  textMuted: 'rgba(247, 249, 252, 0.62)',
  textFaint: 'rgba(247, 249, 252, 0.38)',
  border: 'rgba(247, 249, 252, 0.08)',
  borderStrong: 'rgba(247, 249, 252, 0.16)',
  overlay: 'rgba(11, 18, 32, 0.82)',
  skeleton: 'rgba(247, 249, 252, 0.06)',

  greenSoft: 'rgba(41, 211, 145, 0.14)',
  goldSoft: 'rgba(244, 199, 102, 0.14)',
  redSoft: 'rgba(255, 107, 107, 0.14)',
} as const;

/** Üç değerleme senaryosunun sabit renk kodlaması. */
export const scenarioColors = {
  fast: colors.red,
  normal: colors.green,
  patient: colors.gold,
} as const;

export type ColorName = keyof typeof colors;
