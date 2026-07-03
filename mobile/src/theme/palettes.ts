/**
 * Dark + light palettes for the Skin By Dr. Fizza G app.
 * Both share the exact same shape so components can consume either via useTheme().
 * Dark = the signature luxury look; Light = warm off-white with the same gold.
 */
export const darkColors = {
  background: '#0B0B0D',
  backgroundElevated: '#121214',
  surface: '#18181B',
  surfaceMuted: '#202024',
  surfaceHigh: '#2A2A2F',

  gold: '#C9A24B',
  goldLight: '#E4C77A',
  goldDark: '#9A7A2D',

  rose: '#E48BA1',
  roseDark: '#B7536F',
  sage: '#6FB7A0',

  textPrimary: '#F5F2EC',
  textSecondary: '#B9B3A8',
  textMuted: '#7C766C',
  textInverse: '#0B0B0D',

  divider: '#2A2A2E',
  border: '#34343A',
  success: '#5BBF7B',
  error: '#E5604D',
  warning: '#E0A02C',
  info: '#5B9DE5',

  overlay: 'rgba(0,0,0,0.6)',
  scrim: 'rgba(11,11,13,0.85)',
  transparent: 'transparent',
  white: '#FFFFFF',
  black: '#000000',
};

export type AppColors = { [K in keyof typeof darkColors]: string };

export const lightColors: AppColors = {
  background: '#FAF7F2',
  backgroundElevated: '#FFFFFF',
  surface: '#FFFFFF',
  surfaceMuted: '#F3EFE7',
  surfaceHigh: '#EAE3D5',

  gold: '#C9A24B',
  goldLight: '#9A7A2D', // darker so gold accents stay readable on light surfaces
  goldDark: '#7C6222',

  rose: '#C56B84',
  roseDark: '#A24763',
  sage: '#4E9B84',

  textPrimary: '#1F1B16',
  textSecondary: '#6B6457',
  textMuted: '#A29A8B',
  textInverse: '#1F1B16', // dark text sits on gold/white buttons in both modes

  divider: '#EDE6D6',
  border: '#E3DBCB',
  success: '#3E9E5C',
  error: '#D64C3A',
  warning: '#C8871F',
  info: '#3E7ED0',

  overlay: 'rgba(0,0,0,0.45)',
  scrim: 'rgba(11,11,13,0.85)', // image overlays stay dark for legible hero text
  transparent: 'transparent',
  white: '#FFFFFF',
  black: '#000000',
};
