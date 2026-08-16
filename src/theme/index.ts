import { colors, scenarioColors } from './colors';
import { layout, radius, spacing, TOUCH_TARGET } from './spacing';
import { typography } from './typography';

export const theme = {
  colors,
  scenarioColors,
  spacing,
  radius,
  layout,
  typography,
  touchTarget: TOUCH_TARGET,
} as const;

export type Theme = typeof theme;

export { colors, scenarioColors, spacing, radius, layout, typography, TOUCH_TARGET };
