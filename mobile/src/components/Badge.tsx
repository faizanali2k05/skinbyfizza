import { StyleSheet, View, ViewStyle } from 'react-native';
import { Text } from './Text';
import { useTheme } from '../theme/ThemeContext';
import { AppColors } from '../theme/palettes';
import { radius } from '../theme/spacing';
import { fonts } from '../theme/typography';

type Tone = 'gold' | 'rose' | 'sage' | 'neutral' | 'warning';

type Props = {
  label: string;
  tone?: Tone;
  style?: ViewStyle;
};

/** Small status pill — e.g. "VIP", "WhatsApp only", "Confirmed". */
export function Badge({ label, tone = 'gold', style }: Props) {
  const { colors } = useTheme();
  const t = tones(colors)[tone];
  return (
    <View style={[styles.badge, { backgroundColor: t.bg }, style]}>
      <Text style={[styles.text, { color: t.fg }]}>{label}</Text>
    </View>
  );
}

const tones = (c: AppColors): Record<Tone, { bg: string; fg: string }> => ({
  gold: { bg: 'rgba(201,162,75,0.16)', fg: c.goldLight },
  rose: { bg: 'rgba(228,139,161,0.16)', fg: c.rose },
  sage: { bg: 'rgba(111,183,160,0.16)', fg: c.sage },
  neutral: { bg: c.surfaceHigh, fg: c.textSecondary },
  warning: { bg: 'rgba(224,160,44,0.16)', fg: c.warning },
});

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.pill,
  },
  text: {
    fontFamily: fonts.semiBold,
    fontSize: 10,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
});
