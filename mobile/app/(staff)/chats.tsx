import { Alert, Pressable, StyleSheet, View } from 'react-native';
import { ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Screen, Text, Card, Badge, EmptyState } from '../../src/components';
import { useTheme, useThemedStyles } from '../../src/theme/ThemeContext';
import { AppColors } from '../../src/theme/palettes';
import { spacing } from '../../src/theme/spacing';
import { useAuth } from '../../src/auth/AuthContext';
import { useQuery } from '../../src/hooks/useQuery';
import { api } from '../../src/api/services';

export default function StaffChats() {
  const router = useRouter();
  const { user } = useAuth();
  const isManager = user?.role === 'manager';
  const { data, loading, refetch } = useQuery(api.getThreads, [], { refetchOnFocus: true });
  const threads = data ?? [];
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);

  const promote = async (id: string) => {
    try {
      await api.setPrimary(id);
      refetch();
    } catch {
      Alert.alert('Could not promote thread');
    }
  };

  return (
    <Screen scroll padded refreshing={loading} onRefresh={refetch}>
      <Text variant="h1" style={styles.title}>Chats</Text>

      {loading && !data ? (
        <ActivityIndicator color={colors.gold} style={{ marginTop: spacing.huge }} />
      ) : threads.length === 0 ? (
        <EmptyState icon="chatbubbles-outline" title="No conversations yet" />
      ) : (
        threads.map((t) => (
          <Card
            key={t.id}
            style={styles.card}
            onPress={() =>
              router.push({ pathname: '/staff-chat/[id]', params: { id: t.id, name: t.full_name, platform: t.platform } })
            }
            padded
          >
            <View style={styles.row}>
              <View style={styles.avatar}>
                <Ionicons name="person" size={18} color={colors.gold} />
              </View>
              <View style={styles.flex}>
                <View style={styles.nameRow}>
                  <Text variant="title">{t.full_name}</Text>
                  {t.customer_type === 'vip' ? <Badge label="VIP" tone="gold" /> : null}
                  {t.triage === 'primary' ? <Badge label="Primary" tone="sage" /> : null}
                  {t.platform === 'whatsapp' ? <Badge label="WhatsApp" tone="warning" /> : null}
                </View>
                <Text variant="bodySmall" numberOfLines={1}>
                  {t.last_message ?? 'No messages yet'}
                </Text>
              </View>
            </View>
            {isManager && t.triage !== 'primary' ? (
              <Pressable style={styles.promote} onPress={() => promote(t.id)}>
                <Ionicons name="arrow-up-circle-outline" size={16} color={colors.gold} />
                <Text variant="overline" color={colors.gold}>Make primary (send to doctor)</Text>
              </Pressable>
            ) : null}
          </Card>
        ))
      )}
    </Screen>
  );
}

const makeStyles = (colors: AppColors) => StyleSheet.create({
  title: { marginTop: spacing.sm, marginBottom: spacing.xl },
  card: { marginBottom: spacing.md },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  avatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.surfaceMuted, alignItems: 'center', justifyContent: 'center' },
  flex: { flex: 1 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, flexWrap: 'wrap' },
  promote: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: spacing.md,
    paddingTop: spacing.md, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.divider,
  },
});
