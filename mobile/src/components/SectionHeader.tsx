import { Pressable, StyleSheet, View } from 'react-native';
import { Text } from './Text';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';
import { useI18n } from '../i18n';

type Props = {
  title: string;
  onSeeAll?: () => void;
  serif?: boolean;
};

export function SectionHeader({ title, onSeeAll, serif = true }: Props) {
  const { t } = useI18n();
  return (
    <View style={styles.row}>
      <Text variant={serif ? 'h2' : 'title'}>{title}</Text>
      {onSeeAll ? (
        <Pressable onPress={onSeeAll} hitSlop={8}>
          <Text variant="overline" color={colors.gold}>
            {t('common.seeAll')}
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
    marginTop: spacing.xxl,
  },
});
