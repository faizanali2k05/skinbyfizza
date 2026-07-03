export { colors, gradients } from './colors';
export type { AppColors } from './colors';
export { typography, fonts } from './typography';
export { spacing, radius, screenPadding } from './spacing';

import { colors } from './colors';
import { spacing, radius } from './spacing';

/** Shared elevation/shadow presets (subtle on dark surfaces). */
export const shadow = {
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 8,
  },
  soft: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
} as const;

export const theme = { colors, spacing, radius, shadow } as const;
