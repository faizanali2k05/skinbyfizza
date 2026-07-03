import { Text as RNText, TextProps as RNTextProps, TextStyle } from 'react-native';
import { typography } from '../theme/typography';
import { colors } from '../theme/colors';

type Variant = keyof typeof typography;

export type AppTextProps = RNTextProps & {
  variant?: Variant;
  color?: string;
  center?: boolean;
  style?: TextStyle | TextStyle[];
};

/** Themed Text. Defaults to the `body` variant. */
export function Text({
  variant = 'body',
  color,
  center,
  style,
  ...rest
}: AppTextProps) {
  return (
    <RNText
      {...rest}
      style={[
        typography[variant],
        color ? { color } : null,
        center ? { textAlign: 'center' } : null,
        style as TextStyle,
      ]}
    />
  );
}

export { colors };
