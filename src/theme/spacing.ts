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

/**
 * Köşe yarıçapları — eğlenceli ton için belirgin şekilde yuvarlak.
 * Kartlar baloncuk gibi dursun, form gibi değil.
 */
export const radius = {
  sm: 10,
  md: 14,
  lg: 20,
  xl: 26,
  xxl: 32,
  pill: 999,
} as const;

/** Erişilebilir minimum dokunma alanı. */
export const TOUCH_TARGET = 44;

export const layout = {
  screenPadding: spacing.md,
  cardPadding: spacing.md,
  tabBarHeight: 64,
} as const;
