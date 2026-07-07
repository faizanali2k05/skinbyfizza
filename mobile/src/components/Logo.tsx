import { StyleSheet, View, ViewStyle } from 'react-native';
import { Text } from './Text';
import { useTheme } from '../theme/ThemeContext';
import { fonts } from '../theme/typography';
import { spacing } from '../theme/spacing';

type Props = {
  size?: 'small' | 'large';
  /** Force light (white) lockup — for use over photos/dark heroes. */
  light?: boolean;
  style?: ViewStyle;
};

/**
 * Brand lockup — matches the official wordmark:
 * a fine rectangular frame around "Skin by Dr. Fizza G" with the
 * "SKIN SCIENCE · AESTHETIC COUTURE" strapline beneath.
 */
export function Logo({ size = 'small', light, style }: Props) {
  const { colors } = useTheme();
  const ink = light ? '#F5F2EC' : colors.textPrimary;
  const big = size === 'large';

  return (
    <View style={[styles.frame, { borderColor: ink }, big ? styles.frameLg : styles.frameSm, style]}>
      <Text
        style={{
          fontFamily: fonts.displayMedium,
          fontSize: big ? 26 : 18,
          letterSpacing: 0.3,
          color: ink,
        }}
      >
        Skin by Dr. Fizza G
      </Text>
      <Text
        style={{
          fontFamily: fonts.regular,
          fontSize: big ? 10.5 : 8,
          letterSpacing: big ? 2.6 : 1.8,
          textTransform: 'uppercase',
          color: ink,
          marginTop: 4,
          opacity: 0.85,
        }}
      >
        Skin Science · Aesthetic Couture
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  frame: {
    alignSelf: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
  },
  frameSm: { paddingHorizontal: spacing.lg, paddingVertical: spacing.md },
  frameLg: { paddingHorizontal: spacing.xxl, paddingVertical: spacing.lg },
});
