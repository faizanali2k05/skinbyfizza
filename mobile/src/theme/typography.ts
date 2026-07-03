import { TextStyle } from 'react-native';
import { colors } from './colors';

/**
 * Font family keys map to fonts loaded in app/_layout.tsx via useFonts.
 * Display = Playfair Display (elegant serif, Ounass-style headers).
 * Body/UI = Poppins.
 */
export const fonts = {
  displayRegular: 'PlayfairDisplay_400Regular',
  displayMedium: 'PlayfairDisplay_500Medium',
  displaySemiBold: 'PlayfairDisplay_600SemiBold',
  displayBold: 'PlayfairDisplay_700Bold',

  regular: 'Poppins_400Regular',
  medium: 'Poppins_500Medium',
  semiBold: 'Poppins_600SemiBold',
  bold: 'Poppins_700Bold',
} as const;

type Variant =
  | 'display'
  | 'h1'
  | 'h2'
  | 'h3'
  | 'title'
  | 'body'
  | 'bodySmall'
  | 'label'
  | 'caption'
  | 'overline';

export const typography: Record<Variant, TextStyle> = {
  // Big serif hero ("Good morning, Dmitry!", "Exclusive: Jimmy Choo")
  display: {
    fontFamily: fonts.displayMedium,
    fontSize: 30,
    lineHeight: 38,
    color: colors.textPrimary,
  },
  h1: {
    fontFamily: fonts.displayMedium,
    fontSize: 26,
    lineHeight: 34,
    color: colors.textPrimary,
  },
  h2: {
    fontFamily: fonts.displayMedium,
    fontSize: 22,
    lineHeight: 29,
    color: colors.textPrimary,
  },
  h3: {
    fontFamily: fonts.semiBold,
    fontSize: 18,
    lineHeight: 24,
    color: colors.textPrimary,
  },
  title: {
    fontFamily: fonts.semiBold,
    fontSize: 16,
    lineHeight: 22,
    color: colors.textPrimary,
  },
  body: {
    fontFamily: fonts.regular,
    fontSize: 15,
    lineHeight: 22,
    color: colors.textSecondary,
  },
  bodySmall: {
    fontFamily: fonts.regular,
    fontSize: 13,
    lineHeight: 19,
    color: colors.textSecondary,
  },
  label: {
    fontFamily: fonts.medium,
    fontSize: 14,
    lineHeight: 18,
    color: colors.textPrimary,
  },
  caption: {
    fontFamily: fonts.regular,
    fontSize: 12,
    lineHeight: 16,
    color: colors.textMuted,
  },
  // Spaced uppercase nav/eyebrow labels — Ounass uses these heavily
  overline: {
    fontFamily: fonts.medium,
    fontSize: 11,
    lineHeight: 14,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    color: colors.textSecondary,
  },
};
