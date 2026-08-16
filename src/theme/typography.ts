import { TextStyle } from 'react-native';

/**
 * Yazı tipi ailesi — yuvarlak ve samimi.
 *
 * Başlıklar: Baloo 2 (tombul, oyuncu, "eğlenceli" hissi taşıyan ana ses)
 * Gövde:     Nunito (yuvarlak uçlu, uzun metinde rahat okunur)
 *
 * İkisi de Türkçe karakterleri (ı ğ ş ç ö ü İ) tam destekler.
 */
export const fonts = {
  displayBold: 'Baloo2_800ExtraBold',
  display: 'Baloo2_700Bold',
  headingSemi: 'Baloo2_600SemiBold',
  body: 'Nunito_400Regular',
  bodySemi: 'Nunito_600SemiBold',
  bodyBold: 'Nunito_700Bold',
} as const;

type Variant =
  | 'display'
  | 'title'
  | 'heading'
  | 'subheading'
  | 'body'
  | 'bodyStrong'
  | 'caption'
  | 'label'
  | 'mono'
  | 'shout';

export const typography: Record<Variant, TextStyle> = {
  /** Ekranın en büyük sesi — toplam varlık gibi. */
  display: { fontFamily: fonts.displayBold, fontSize: 38, lineHeight: 46, letterSpacing: -0.5 },
  title: { fontFamily: fonts.display, fontSize: 28, lineHeight: 36, letterSpacing: -0.3 },
  heading: { fontFamily: fonts.display, fontSize: 22, lineHeight: 29 },
  subheading: { fontFamily: fonts.headingSemi, fontSize: 18, lineHeight: 24 },
  body: { fontFamily: fonts.body, fontSize: 15, lineHeight: 22 },
  bodyStrong: { fontFamily: fonts.bodySemi, fontSize: 15, lineHeight: 22 },
  caption: { fontFamily: fonts.body, fontSize: 13, lineHeight: 19 },
  label: { fontFamily: fonts.bodyBold, fontSize: 11, lineHeight: 15, letterSpacing: 0.6 },
  mono: { fontFamily: fonts.body, fontSize: 13, lineHeight: 18 },
  /** Kutlama ekranındaki bağırtı. */
  shout: { fontFamily: fonts.displayBold, fontSize: 30, lineHeight: 38, letterSpacing: -0.4 },
};

/** App.tsx içinde useFonts'a verilecek harita. */
export { Baloo2_600SemiBold, Baloo2_700Bold, Baloo2_800ExtraBold } from '@expo-google-fonts/baloo-2';
export { Nunito_400Regular, Nunito_600SemiBold, Nunito_700Bold } from '@expo-google-fonts/nunito';
