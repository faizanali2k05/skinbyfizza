import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Screen, Text, ChatThread } from '../src/components';
import { useTheme, useThemedStyles } from '../src/theme/ThemeContext';
import { AppColors } from '../src/theme/palettes';
import { spacing } from '../src/theme/spacing';
import { api } from '../src/api/services';

export default function ClinicChat() {
  const router = useRouter();
  const [convId, setConvId] = useState<string | undefined>(undefined);
  const [ready, setReady] = useState(false);
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);

  useEffect(() => {
    api
      .getThreads()
      .then((threads) => setConvId(threads[0]?.id))
      .catch(() => {})
      .finally(() => setReady(true));
  }, []);

  return (
    <Screen padded={false} edges={['top']}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={10}>
          <Ionicons name="chevron-back" size={24} color={colors.textPrimary} />
        </Pressable>
        <View style={styles.center}>
          <View style={styles.dot} />
          <Text variant="h3">Message the clinic</Text>
        </View>
        <View style={{ width: 24 }} />
      </View>
      {ready ? (
        <ChatThread
          conversationId={convId}
          onConversationCreated={setConvId}
          emptyHint="Send a message and the clinic team will reply here."
        />
      ) : null}
    </Screen>
  );
}

const makeStyles = (colors: AppColors) => StyleSheet.create({
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: spacing.xl, paddingVertical: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.divider,
  },
  center: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.gold },
});
