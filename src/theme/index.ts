import { chartPalette, colors, scenarioColors } from './colors';
import { layout, radius, spacing, TOUCH_TARGET } from './spacing';
import { fonts, typography } from './typography';

export const theme = {
  colors,
  scenarioColors,
  chartPalette,
  spacing,
  radius,
  layout,
  typography,
  fonts,
  touchTarget: TOUCH_TARGET,
} as const;

export type Theme = typeof theme;

export {
  colors,
  scenarioColors,
  chartPalette,
  spacing,
  radius,
  layout,
  typography,
  fonts,
  TOUCH_TARGET,
};
