import { ActivityIndicator, Alert, Pressable, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Screen, Text, Card, Badge, EmptyState } from '../../src/components';
import { useTheme, useThemedStyles } from '../../src/theme/ThemeContext';
import { AppColors } from '../../src/theme/palettes';
import { spacing } from '../../src/theme/spacing';
import { fonts } from '../../src/theme/typography';
import { useQuery } from '../../src/hooks/useQuery';
import { api } from '../../src/api/services';
import { AppointmentStatus } from '../../src/api/types';

const STATUS_TONE: Record<AppointmentStatus, 'sage' | 'gold' | 'rose' | 'neutral'> = {
  confirmed: 'sage', pending: 'gold', completed: 'neutral', cancelled: 'rose',
};
const NEXT: Record<string, { label: string; status: AppointmentStatus }[]> = {
  pending: [{ label: 'Confirm', status: 'confirmed' }, { label: 'Cancel', status: 'cancelled' }],
  confirmed: [{ label: 'Complete', status: 'completed' }, { label: 'Cancel', status: 'cancelled' }],
  completed: [],
  cancelled: [{ label: 'Reopen', status: 'pending' }],
};

function fmt(dt: string) {
  try {
    return new Date(dt).toLocaleString(undefined, { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
  } catch {
    return dt;
  }
}

export default function StaffAppointments() {
  const router = useRouter();
  const { data, loading, refetch, setData } = useQuery(() => api.getAppointments());
  const items = data ?? [];
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);

  const setStatus = (id: string, status: AppointmentStatus) => {
    // optimistic: reflect the new status immediately, revert on failure
    setData((list) => (list ?? []).map((a) => (a.id === id ? { ...a, status } : a)));
    api.setAppointmentStatus(id, status).catch(() => {
      Alert.alert('Could not update status');
      refetch();
    });
  };

  return (
    <Screen scroll padded refreshing={loading} onRefresh={refetch}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={10}>
          <Ionicons name="chevron-back" size={24} color={colors.textPrimary} />
        </Pressable>
        <Text variant="h2">Appointments</Text>
        <View style={{ width: 24 }} />
      </View>

      {loading && !data ? (
        <ActivityIndicator color={colors.gold} style={{ marginTop: spacing.huge }} />
      ) : items.length === 0 ? (
        <EmptyState icon="calendar-outline" title="No appointments" />
      ) : (
        items.map((a) => (
          <Card key={a.id} style={styles.card} padded>
            <View style={styles.cardHead}>
              <View style={styles.flex}>
                <Text variant="h3">{a.procedure_title ?? 'Treatment'}</Text>
                <Text variant="caption">{(a as { full_name?: string }).full_name ?? ''}{a.city ? ` · ${a.city}` : ''}</Text>
              </View>
              <Badge label={a.status} tone={STATUS_TONE[a.status] ?? 'neutral'} />
            </View>
            <View style={styles.metaRow}>
              <Ionicons name="time-outline" size={16} color={colors.textMuted} />
              <Text variant="bodySmall">{fmt(a.scheduled_at)}</Text>
            </View>
            {NEXT[a.status]?.length ? (
              <View style={styles.actions}>
                {NEXT[a.status].map((n) => (
                  <Pressable key={n.status} style={styles.action} onPress={() => setStatus(a.id, n.status)}>
                    <Text style={styles.actionText}>{n.label}</Text>
                  </Pressable>
                ))}
              </View>
            ) : null}
          </Card>
        ))
      )}
    </Screen>
  );
}

const makeStyles = (colors: AppColors) => StyleSheet.create({
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginTop: spacing.sm, marginBottom: spacing.xl,
  },
  card: { marginBottom: spacing.md },
  cardHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.sm },
  flex: { flex: 1 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  actions: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.md },
  action: {
    paddingHorizontal: spacing.lg, paddingVertical: spacing.sm, borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth, borderColor: colors.border, backgroundColor: colors.surface,
  },
  actionText: { fontFamily: fonts.medium, fontSize: 13, color: colors.textPrimary },
});
