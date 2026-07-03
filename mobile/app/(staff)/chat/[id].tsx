import { Pressable, StyleSheet, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Screen, Text, ChatThread } from '../../../src/components';
import { useTheme, useThemedStyles } from '../../../src/theme/ThemeContext';
import { AppColors } from '../../../src/theme/palettes';
import { spacing } from '../../../src/theme/spacing';

export default function StaffChatThread() {
  const { id, name } = useLocalSearchParams<{ id: string; name?: string }>();
  const router = useRouter();
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);

  return (
    <Screen padded={false} edges={['top']}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={10}>
          <Ionicons name="chevron-back" size={24} color={colors.textPrimary} />
        </Pressable>
        <Text variant="h3">{name ?? 'Conversation'}</Text>
        <View style={{ width: 24 }} />
      </View>
      <ChatThread conversationId={id} emptyHint="No messages in this thread yet." />
    </Screen>
  );
}

const makeStyles = (colors: AppColors) => StyleSheet.create({
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: spacing.xl, paddingVertical: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.divider,
  },
});
