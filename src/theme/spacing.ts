/** 8px tabanlı boşluk sistemi. */
export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 40,
  xxxl: 48,
} as const;

/** Köşe yarıçapları — kart ve buton dili 16-20 arası. */
export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  pill: 999,
} as const;

/** Erişilebilir minimum dokunma alanı. */
export const TOUCH_TARGET = 44;

export const layout = {
  screenPadding: spacing.md,
  cardPadding: spacing.md,
  tabBarHeight: 64,
} as const;
