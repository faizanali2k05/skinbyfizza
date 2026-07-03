import { Text as RNText, TextProps as RNTextProps, TextStyle } from 'react-native';
import { typography } from '../theme/typography';
import { useTheme } from '../theme/ThemeContext';

type Variant = keyof typeof typography;

/** Which themed colour each variant defaults to (overridden by the `color` prop). */
const ROLE: Record<Variant, 'textPrimary' | 'textSecondary' | 'textMuted'> = {
  display: 'textPrimary',
  h1: 'textPrimary',
  h2: 'textPrimary',
  h3: 'textPrimary',
  title: 'textPrimary',
  label: 'textPrimary',
  body: 'textSecondary',
  bodySmall: 'textSecondary',
  overline: 'textSecondary',
  caption: 'textMuted',
};

export type AppTextProps = RNTextProps & {
  variant?: Variant;
  color?: string;
  center?: boolean;
  style?: TextStyle | TextStyle[];
};

/** Themed Text. Colour follows the active theme unless `color` is passed. */
export function Text({ variant = 'body', color, center, style, ...rest }: AppTextProps) {
  const { colors } = useTheme();
  return (
    <RNText
      {...rest}
      style={[
        typography[variant],
        { color: color ?? colors[ROLE[variant]] },
        center ? { textAlign: 'center' } : null,
        style as TextStyle,
      ]}
    />
  );
}
