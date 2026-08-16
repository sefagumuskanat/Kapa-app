/**
 * KAPAMETRE renk paleti — sıcak, oyuncu, "hazine sandığı" hissi.
 *
 * Hedef kitle ciddi yatırımcı değil; uygulamayı eğlence olsun diye açan
 * bireysel kullanıcı. Bu yüzden soğuk lacivert-bankacı paleti yerine
 * sıcak mor/üzüm zemin + canlı vurgu renkleri kullanılır.
 */
export const colors = {
  background: '#160E27',
  card: '#241838',
  cardElevated: '#33244D',

  /** Para yeşili — ana metrik ve olumlu her şey. */
  green: '#37E39B',
  /** Sikke sarısı — ödül, yıldız, sıralama. */
  gold: '#FFC63C',
  /** Mercan — hızlı satış ve uyarılar. */
  red: '#FF6B81',
  /** Mor pop — eğlenceli vurgular, premium. */
  purple: '#B36BFF',
  /** Turkuaz pop — bilgi ve grafik çeşitliliği. */
  cyan: '#4EC5FF',

  /** Sıcak beyaz — buz gibi #FFF değil. */
  text: '#FFF6EC',

  textMuted: 'rgba(255, 246, 236, 0.66)',
  textFaint: 'rgba(255, 246, 236, 0.42)',
  border: 'rgba(255, 246, 236, 0.10)',
  borderStrong: 'rgba(255, 246, 236, 0.20)',
  overlay: 'rgba(22, 14, 39, 0.88)',
  skeleton: 'rgba(255, 246, 236, 0.07)',

  greenSoft: 'rgba(55, 227, 155, 0.16)',
  goldSoft: 'rgba(255, 198, 60, 0.16)',
  redSoft: 'rgba(255, 107, 129, 0.16)',
  purpleSoft: 'rgba(179, 107, 255, 0.16)',
  cyanSoft: 'rgba(78, 197, 255, 0.16)',
} as const;

/** Üç değerleme senaryosunun sabit renk kodlaması. */
export const scenarioColors = {
  fast: colors.red,
  normal: colors.green,
  patient: colors.gold,
} as const;

/**
 * Grafik dilimleri için ayırt edilebilir renk sırası.
 * Eski palette iki yeşil yan yana düşüyordu; artık her dilim farklı bir ton.
 */
export const chartPalette = [
  colors.green,
  colors.gold,
  colors.purple,
  colors.cyan,
  colors.red,
  'rgba(55, 227, 155, 0.5)',
  'rgba(255, 198, 60, 0.5)',
  'rgba(179, 107, 255, 0.5)',
] as const;

export type ColorName = keyof typeof colors;
