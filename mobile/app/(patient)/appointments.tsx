import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Screen, Text, Badge, Card, Button, EmptyState } from '../../src/components';
import { useTheme } from '../../src/theme/ThemeContext';
import { spacing } from '../../src/theme/spacing';
import { useI18n } from '../../src/i18n';
import { useAuth } from '../../src/auth/AuthContext';
import { useQuery } from '../../src/hooks/useQuery';
import { api } from '../../src/api/services';
import { AppointmentStatus } from '../../src/api/types';

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

export default function Appointments() {
  const { t } = useI18n();
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const { data, loading, error, refetch } = useQuery(
    () => (isAuthenticated ? api.getAppointments() : Promise.resolve([])),
    [isAuthenticated],
  );
  const items = data ?? [];
  const { colors } = useTheme();

  return (
    <Screen scroll padded refreshing={loading} onRefresh={refetch}>
      <Text variant="h1" style={styles.title}>
        {t('nav.appointments')}
      </Text>

      {!isAuthenticated ? (
        <EmptyState
          icon="lock-closed-outline"
          title="Log in to view appointments"
          subtitle="Sign in to book and track your visits."
        />
      ) : loading && !data ? (
        <ActivityIndicator color={colors.gold} style={{ marginTop: spacing.huge }} />
      ) : error ? (
        <EmptyState icon="cloud-offline-outline" title="Couldn't load appointments" subtitle="Pull down to retry." />
      ) : items.length === 0 ? (
        <EmptyState icon="calendar-outline" title="No appointments yet" subtitle="Book a treatment and it shows up here." />
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

      <Button
        title="Book a treatment"
        style={styles.book}
        onPress={() => router.push('/(patient)/categories')}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { marginTop: spacing.sm, marginBottom: spacing.xl },
  card: { marginBottom: spacing.lg },
  cardHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.md },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.xs },
  book: { marginTop: spacing.lg },
});
