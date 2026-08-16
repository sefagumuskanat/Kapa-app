import { Platform, TextStyle } from 'react-native';

const fontFamily = Platform.select({
  ios: 'System',
  android: 'sans-serif',
  default: 'System',
});

const fontFamilyMedium = Platform.select({
  ios: 'System',
  android: 'sans-serif-medium',
  default: 'System',
});

type Variant =
  | 'display'
  | 'title'
  | 'heading'
  | 'subheading'
  | 'body'
  | 'bodyStrong'
  | 'caption'
  | 'label'
  | 'mono';

export const typography: Record<Variant, TextStyle> = {
  display: { fontFamily: fontFamilyMedium, fontSize: 34, lineHeight: 40, fontWeight: '700', letterSpacing: -0.6 },
  title: { fontFamily: fontFamilyMedium, fontSize: 26, lineHeight: 32, fontWeight: '700', letterSpacing: -0.4 },
  heading: { fontFamily: fontFamilyMedium, fontSize: 20, lineHeight: 26, fontWeight: '600', letterSpacing: -0.2 },
  subheading: { fontFamily: fontFamilyMedium, fontSize: 17, lineHeight: 22, fontWeight: '600' },
  body: { fontFamily, fontSize: 15, lineHeight: 21, fontWeight: '400' },
  bodyStrong: { fontFamily: fontFamilyMedium, fontSize: 15, lineHeight: 21, fontWeight: '600' },
  caption: { fontFamily, fontSize: 13, lineHeight: 18, fontWeight: '400' },
  label: { fontFamily: fontFamilyMedium, fontSize: 11, lineHeight: 14, fontWeight: '700', letterSpacing: 0.8 },
  mono: {
    fontFamily: Platform.select({ ios: 'Menlo', android: 'monospace', default: 'monospace' }),
    fontSize: 13,
    lineHeight: 18,
  },
};
