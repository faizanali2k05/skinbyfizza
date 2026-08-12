import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Screen, Text, Badge, Card, EmptyState } from '../src/components';
import { useTheme } from '../src/theme/ThemeContext';
import { spacing } from '../src/theme/spacing';
import { useAuth } from '../src/auth/AuthContext';
import { useQuery } from '../src/hooks/useQuery';
import { api } from '../src/api/services';
import { AppointmentStatus } from '../src/api/types';

const STATUS_TONE: Record<AppointmentStatus, 'sage' | 'gold' | 'rose' | 'neutral'> = {
  confirmed: 'sage',
  pending: 'gold',
  completed: 'neutral',
  cancelled: 'rose',
};

function fmt(dt: string) {
  try {
    return new Date(dt).toLocaleString(undefined, {
      weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
    });
  } catch {
    return dt;
  }
}

/** Read-only: patients no longer self-book — visits are scheduled by the
 * clinic (via the AI consultant or staff) and simply show up here. */
export default function MyAppointments() {
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const { data, loading, error, refetch } = useQuery(
    () => (isAuthenticated ? api.getAppointments() : Promise.resolve([])),
    [isAuthenticated],
    { refetchOnFocus: true },
  );
  const items = data ?? [];
  const { colors } = useTheme();

  return (
    <Screen scroll padded edges={['top']} refreshing={loading} onRefresh={refetch}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={10}>
          <Ionicons name="chevron-back" size={24} color={colors.textPrimary} />
        </Pressable>
        <Text variant="h2">My appointments</Text>
        <View style={{ width: 24 }} />
      </View>

      {!isAuthenticated ? (
        <EmptyState
          icon="lock-closed-outline"
          title="Log in to view appointments"
          subtitle="Sign in to track your visits."
        />
      ) : loading && !data ? (
        <ActivityIndicator color={colors.gold} style={{ marginTop: spacing.huge }} />
      ) : error ? (
        <EmptyState icon="cloud-offline-outline" title="Couldn't load appointments" subtitle="Pull down to retry." />
      ) : items.length === 0 ? (
        <EmptyState
          icon="calendar-outline"
          title="No appointments yet"
          subtitle="Ask the AI consultant or message the clinic to schedule a visit."
        />
      ) : (
        items.map((a) => (
          <Card key={a.id} style={styles.card} elevated>
            <View style={styles.cardHead}>
              <Text variant="h3">{a.procedure_title ?? 'Treatment'}</Text>
              <Badge label={a.status} tone={STATUS_TONE[a.status] ?? 'neutral'} />
            </View>
            <View style={styles.metaRow}>
              <Ionicons name="time-outline" size={16} color={colors.textMuted} />
              <Text variant="bodySmall">{fmt(a.scheduled_at)}</Text>
            </View>
            {a.city ? (
              <View style={styles.metaRow}>
                <Ionicons name="location-outline" size={16} color={colors.textMuted} />
                <Text variant="bodySmall">{a.city}</Text>
              </View>
            ) : null}
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
  card: { marginBottom: spacing.lg },
  cardHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.md },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.xs },
});
