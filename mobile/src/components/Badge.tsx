import { StyleSheet, View, ViewStyle } from 'react-native';
import { Text } from './Text';
import { colors } from '../theme/colors';
import { radius } from '../theme/spacing';
import { fonts } from '../theme/typography';

type Props = {
  label: string;
  tone?: 'gold' | 'rose' | 'sage' | 'neutral' | 'warning';
  style?: ViewStyle;
};

/** Small status pill — e.g. "VIP", "WhatsApp only", "Confirmed". */
export function Badge({ label, tone = 'gold', style }: Props) {
  const t = TONES[tone];
  return (
    <View style={[styles.badge, { backgroundColor: t.bg }, style]}>
      <Text style={[styles.text, { color: t.fg }]}>{label}</Text>
    </View>
  );
}

const TONES = {
  gold: { bg: 'rgba(201,162,75,0.16)', fg: colors.goldLight },
  rose: { bg: 'rgba(228,139,161,0.16)', fg: colors.rose },
  sage: { bg: 'rgba(111,183,160,0.16)', fg: colors.sage },
  neutral: { bg: colors.surfaceHigh, fg: colors.textSecondary },
  warning: { bg: 'rgba(224,160,44,0.16)', fg: colors.warning },
} as const;

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
