import { TextStyle } from 'react-native';
import { colors } from './colors';

/**
 * Font family keys map to fonts loaded in app/_layout.tsx via useFonts.
 * Display = Playfair Display (elegant serif, Ounass-style headers).
 * Body/UI = Poppins.
 */
export const fonts = {
  // Display / headings — Outfit (premium geometric, Garet-like)
  displayRegular: 'Outfit_400Regular',
  displayMedium: 'Outfit_500Medium',
  displaySemiBold: 'Outfit_600SemiBold',
  displayBold: 'Outfit_700Bold',

  // Body / UI — Plus Jakarta Sans (modern SaaS)
  regular: 'PlusJakartaSans_400Regular',
  medium: 'PlusJakartaSans_500Medium',
  semiBold: 'PlusJakartaSans_600SemiBold',
  bold: 'PlusJakartaSans_700Bold',
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
  // Premium geometric display (Outfit) with tight tracking
  display: {
    fontFamily: fonts.displayBold,
    fontSize: 32,
    lineHeight: 38,
    letterSpacing: -0.8,
    color: colors.textPrimary,
  },
  h1: {
    fontFamily: fonts.displaySemiBold,
    fontSize: 27,
    lineHeight: 33,
    letterSpacing: -0.6,
    color: colors.textPrimary,
  },
  h2: {
    fontFamily: fonts.displaySemiBold,
    fontSize: 22,
    lineHeight: 28,
    letterSpacing: -0.4,
    color: colors.textPrimary,
  },
  h3: {
    fontFamily: fonts.displaySemiBold,
    fontSize: 18,
    lineHeight: 24,
    letterSpacing: -0.2,
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
