import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Screen, Text, Card, EmptyState } from '../src/components';
import { useTheme } from '../src/theme/ThemeContext';
import { spacing } from '../src/theme/spacing';
import { useAuth } from '../src/auth/AuthContext';
import { useQuery } from '../src/hooks/useQuery';
import { api } from '../src/api/services';

type Rx = {
  id: string;
  item_name: string;
  price?: number | null;
  notes?: string | null;
  created_at: string;
};

export default function Prescriptions() {
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const { data, loading, error, refetch } = useQuery(
    () => (isAuthenticated ? (api.getPrescriptions() as Promise<Rx[]>) : Promise.resolve([] as Rx[])),
    [isAuthenticated],
  );
  const items = data ?? [];
  const { colors } = useTheme();

  return (
    <Screen scroll padded edges={['top']} refreshing={loading} onRefresh={refetch}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={10}>
          <Ionicons name="chevron-back" size={24} color={colors.textPrimary} />
        </Pressable>
        <Text variant="h2">Prescriptions</Text>
        <View style={{ width: 24 }} />
      </View>

      {!isAuthenticated ? (
        <EmptyState icon="lock-closed-outline" title="Log in to view prescriptions" />
      ) : loading && !data ? (
        <ActivityIndicator color={colors.gold} style={{ marginTop: spacing.huge }} />
      ) : error ? (
        <EmptyState icon="cloud-offline-outline" title="Couldn't load prescriptions" subtitle="Pull down to retry." />
      ) : items.length === 0 ? (
        <EmptyState icon="medkit-outline" title="No prescriptions yet" subtitle="Products & services from your doctor will appear here." />
      ) : (
        items.map((rx) => (
          <Card key={rx.id} style={styles.card} padded>
            <View style={styles.row}>
              <View style={styles.flex}>
                <Text variant="title">{rx.item_name}</Text>
                {rx.notes ? <Text variant="bodySmall" style={styles.notes}>{rx.notes}</Text> : null}
                <Text variant="caption" style={styles.time}>{new Date(rx.created_at).toLocaleDateString()}</Text>
              </View>
              {rx.price != null ? (
                <Text variant="h3" color={colors.gold}>Rs {rx.price}</Text>
              ) : null}
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
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  flex: { flex: 1 },
  notes: { marginTop: 2 },
  time: { marginTop: spacing.sm },
});
