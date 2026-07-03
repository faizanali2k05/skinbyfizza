import { StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Text } from './Text';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';

type Props = {
  icon?: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle?: string;
};

export function EmptyState({ icon = 'sparkles-outline', title, subtitle }: Props) {
  return (
    <View style={styles.wrap}>
      <View style={styles.iconWrap}>
        <Ionicons name={icon} size={28} color={colors.gold} />
      </View>
      <Text variant="h3" center style={styles.title}>
        {title}
      </Text>
      {subtitle ? (
        <Text variant="body" center>
          {subtitle}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', justifyContent: 'center', paddingVertical: 64 },
  iconWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  title: { marginBottom: spacing.sm },
});
