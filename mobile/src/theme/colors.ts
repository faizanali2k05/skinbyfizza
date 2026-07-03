/**
 * Dark luxury palette — inspired by the Ounass app (deep near-black surfaces,
 * warm off-white text, gold accents) fused with the clinic's rose-gold brand.
 */
export const colors = {
  // Surfaces (near-black, layered)
  background: '#0B0B0D',
  backgroundElevated: '#121214',
  surface: '#18181B',
  surfaceMuted: '#202024',
  surfaceHigh: '#2A2A2F',

  // Brand — warm gold
  gold: '#C9A24B',
  goldLight: '#E4C77A',
  goldDark: '#9A7A2D',

  // Accents
  rose: '#E48BA1',
  roseDark: '#B7536F',
  sage: '#6FB7A0',

  // Text (warm whites on dark)
  textPrimary: '#F5F2EC',
  textSecondary: '#B9B3A8',
  textMuted: '#7C766C',
  textInverse: '#0B0B0D',

  // Lines & states
  divider: '#2A2A2E',
  border: '#34343A',
  success: '#5BBF7B',
  error: '#E5604D',
  warning: '#E0A02C',
  info: '#5B9DE5',

  // Utility
  overlay: 'rgba(0,0,0,0.6)',
  scrim: 'rgba(11,11,13,0.85)',
  transparent: 'transparent',
  white: '#FFFFFF',
  black: '#000000',
} as const;

export type AppColors = typeof colors;

/** Gradients (consumed by expo-linear-gradient or as decorative arrays). */
export const gradients = {
  gold: ['#E4C77A', '#C9A24B', '#9A7A2D'] as const,
  rose: ['#E48BA1', '#B7536F'] as const,
  fadeUp: ['transparent', 'rgba(11,11,13,0.55)', '#0B0B0D'] as const,
};
