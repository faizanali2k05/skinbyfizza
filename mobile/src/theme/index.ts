export { colors, gradients } from './colors';
export type { AppColors } from './colors';
export { typography, fonts } from './typography';
export { spacing, radius, screenPadding } from './spacing';

import { colors } from './colors';
import { spacing, radius } from './spacing';

/** Elevation presets — premium, layered depth (skeuomorphic lift + gold glow). */
export const shadow = {
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.32,
    shadowRadius: 26,
    elevation: 12,
  },
  soft: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.22,
    shadowRadius: 14,
    elevation: 6,
  },
  // Gold glow used under primary (skeuomorphic) buttons.
  glow: {
    shadowColor: '#C9A24B',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.38,
    shadowRadius: 20,
    elevation: 10,
  },
} as const;

export const theme = { colors, spacing, radius, shadow } as const;
