/**
 * `colors` = the dark palette (the app's default / fallback). Themed components
 * should read the ACTIVE palette from `useTheme()` instead of importing this.
 * Kept for gradients and any static (theme-independent) usage.
 */
export { darkColors as colors, lightColors } from './palettes';
export type { AppColors } from './palettes';

/** Gradients (decorative; image overlays stay dark in both themes). */
export const gradients = {
  gold: ['#E4C77A', '#C9A24B', '#9A7A2D'] as const,
  rose: ['#E48BA1', '#B7536F'] as const,
  fadeUp: ['transparent', 'rgba(11,11,13,0.55)', '#0B0B0D'] as const,
};
