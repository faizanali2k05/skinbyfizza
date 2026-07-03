import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Screen, Text, Card, EmptyState } from '../src/components';
import { colors } from '../src/theme/colors';
import { spacing } from '../src/theme/spacing';
import { useAuth } from '../src/auth/AuthContext';
import { useQuery } from '../src/hooks/useQuery';
import { api } from '../src/api/services';

export default function Notifications() {
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const { data, loading, error, refetch } = useQuery(
    () => (isAuthenticated ? api.getNotifications() : Promise.resolve([])),
    [isAuthenticated],
  );
  const items = data ?? [];

  return (
    <Screen scroll padded edges={['top']} refreshing={loading} onRefresh={refetch}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={10}>
          <Ionicons name="chevron-back" size={24} color={colors.textPrimary} />
        </Pressable>
        <Text variant="h2">Notifications</Text>
        <View style={{ width: 24 }} />
      </View>

      {!isAuthenticated ? (
        <EmptyState icon="lock-closed-outline" title="Log in to see notifications" />
      ) : loading && !data ? (
        <ActivityIndicator color={colors.gold} style={{ marginTop: spacing.huge }} />
      ) : error ? (
        <EmptyState icon="cloud-offline-outline" title="Couldn't load notifications" subtitle="Pull down to retry." />
      ) : items.length === 0 ? (
        <EmptyState icon="notifications-outline" title="You're all caught up" subtitle="New updates will appear here." />
      ) : (
        items.map((n) => (
          <Card key={n.id} style={styles.card} padded>
            <View style={styles.row}>
              <View style={[styles.dot, { backgroundColor: n.is_read ? colors.textMuted : colors.gold }]} />
              <View style={styles.flex}>
                <Text variant="title">{n.title}</Text>
                {n.body ? (
                  <Text variant="bodySmall" style={styles.body}>
                    {n.body}
                  </Text>
                ) : null}
                <Text variant="caption" style={styles.time}>
                  {new Date(n.created_at).toLocaleString()}
                </Text>
              </View>
            </View>
          </Card>
        ))
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginTop: spacing.sm, marginBottom: spacing.xl,
  },
  card: { marginBottom: spacing.md },
  row: { flexDirection: 'row', gap: spacing.md },
  dot: { width: 8, height: 8, borderRadius: 4, marginTop: 6 },
  flex: { flex: 1 },
  body: { marginTop: 2 },
  time: { marginTop: spacing.sm },
});
