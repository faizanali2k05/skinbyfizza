import { useState } from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Screen, Text, Card, Badge, EmptyState } from '../../src/components';
import { useTheme, useThemedStyles } from '../../src/theme/ThemeContext';
import { AppColors } from '../../src/theme/palettes';
import { radius, spacing } from '../../src/theme/spacing';
import { fonts } from '../../src/theme/typography';
import { useAuth } from '../../src/auth/AuthContext';
import { useQuery } from '../../src/hooks/useQuery';
import { api } from '../../src/api/services';
import { User } from '../../src/api/types';

export default function StaffUsers() {
  const router = useRouter();
  const { user } = useAuth();
  const isDoctor = user?.role === 'doctor';
  const [q, setQ] = useState('');
  const { data, loading, refetch, setData } = useQuery(() => api.getUsers(q.trim() || undefined), [q], { refetchOnFocus: true });
  const users = data ?? [];
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);

  // Optimistic: patch the list immediately, revert (refetch) if the call fails.
  const run = (patch: (list: User[]) => User[], call: () => Promise<unknown>) => {
    setData((list) => patch(list ?? []));
    call().catch(() => {
      Alert.alert('Action failed', 'Please try again.');
      refetch();
    });
  };

  return (
    <Screen scroll padded refreshing={loading} onRefresh={refetch}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={10}>
          <Ionicons name="chevron-back" size={24} color={colors.textPrimary} />
        </Pressable>
        <Text variant="h2">Users</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.search}>
        <Ionicons name="search" size={18} color={colors.textMuted} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search name or number"
          placeholderTextColor={colors.textMuted}
          value={q}
          onChangeText={setQ}
          autoCapitalize="none"
        />
      </View>

      {loading && !data ? (
        <ActivityIndicator color={colors.gold} style={{ marginTop: spacing.huge }} />
      ) : users.length === 0 ? (
        <EmptyState icon="people-outline" title="No users found" />
      ) : (
        users.map((u) => <UserCard key={u.id} u={u} isDoctor={isDoctor} run={run} />)
      )}
    </Screen>
  );
}

function UserCard({
  u,
  isDoctor,
  run,
}: {
  u: User;
  isDoctor: boolean;
  run: (patch: (list: User[]) => User[], call: () => Promise<unknown>) => void;
}) {
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const router = useRouter();
  return (
    <Card style={styles.card} padded>
      <View style={styles.cardHead}>
        <View style={styles.flex}>
          <View style={styles.nameRow}>
            <Text variant="title">{u.full_name}</Text>
            {u.customer_type === 'vip' ? <Badge label="VIP" tone="gold" /> : null}
            <Badge label={u.role} tone="neutral" />
            {u.status === 'inactive' ? <Badge label="inactive" tone="rose" /> : null}
          </View>
          <Text variant="caption">{u.phone_e164}{u.email ? ` · ${u.email}` : ''}</Text>
        </View>
      </View>

      {/* Interest rating (doctor + manager) */}
      <View style={styles.stars}>
        <Text variant="caption" style={styles.starsLabel}>Interest</Text>
        {[1, 2, 3, 4, 5].map((n) => (
          <Pressable
            key={n}
            onPress={() =>
              run(
                (l) => l.map((x) => (x.id === u.id ? { ...x, interest_rating: n } : x)),
                () => api.setUserRating(u.id, n),
              )
            }
            hitSlop={4}
          >
            <Ionicons
              name={u.interest_rating && u.interest_rating >= n ? 'star' : 'star-outline'}
              size={18}
              color={colors.gold}
            />
          </Pressable>
        ))}
      </View>

      <View style={styles.actions}>
        <Action
          icon={u.customer_type === 'vip' ? 'star' : 'star-outline'}
          label={u.customer_type === 'vip' ? 'Unset VIP' : 'Set VIP'}
          onPress={() =>
            run(
              (l) => l.map((x) => (x.id === u.id ? { ...x, customer_type: u.customer_type !== 'vip' ? 'vip' : 'regular' } : x)),
              () => api.setUserVip(u.id, u.customer_type !== 'vip'),
            )
          }
        />
        {isDoctor && (
          <Action
            icon={u.status === 'active' ? 'pause-circle-outline' : 'play-circle-outline'}
            label={u.status === 'active' ? 'Deactivate' : 'Activate'}
            onPress={() =>
              run(
                (l) => l.map((x) => (x.id === u.id ? { ...x, status: u.status === 'active' ? 'inactive' : 'active' } : x)),
                () => api.setUserStatus(u.id, u.status === 'active' ? 'inactive' : 'active'),
              )
            }
          />
        )}
        {isDoctor && u.role === 'user' && (
          <Action
            icon="ribbon-outline"
            label="Make manager"
            onPress={() =>
              run(
                (l) => l.map((x) => (x.id === u.id ? { ...x, role: 'manager' } : x)),
                () => api.setUserRole(u.id, 'manager'),
              )
            }
          />
        )}
        {isDoctor && (
          <Action
            icon="medkit-outline"
            label="Prescription"
            onPress={() =>
              router.push({ pathname: '/(staff)/prescription-form', params: { user_id: u.id, name: u.full_name } })
            }
          />
        )}
        {isDoctor && (
          <Action
            icon="trash-outline"
            label="Delete"
            danger
            onPress={() =>
              Alert.alert('Delete user?', u.full_name, [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Delete', style: 'destructive', onPress: () => run((l) => l.filter((x) => x.id !== u.id), () => api.deleteUser(u.id)) },
              ])
            }
          />
        )}
      </View>
    </Card>
  );
}

function Action({
  icon,
  label,
  onPress,
  danger,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
  danger?: boolean;
}) {
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const c = danger ? colors.error : colors.textSecondary;
  return (
    <Pressable style={styles.action} onPress={onPress}>
      <Ionicons name={icon} size={16} color={c} />
      <Text style={[styles.actionText, { color: c }]}>{label}</Text>
    </Pressable>
  );
}

const makeStyles = (colors: AppColors) => StyleSheet.create({
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginTop: spacing.sm, marginBottom: spacing.lg,
  },
  search: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.md, backgroundColor: colors.surface,
    borderRadius: radius.md, borderWidth: StyleSheet.hairlineWidth, borderColor: colors.border,
    height: 48, paddingHorizontal: spacing.lg, marginBottom: spacing.lg,
  },
  searchInput: { flex: 1, color: colors.textPrimary, fontFamily: fonts.regular, fontSize: 15, height: '100%' },
  card: { marginBottom: spacing.md },
  cardHead: { flexDirection: 'row', alignItems: 'center' },
  flex: { flex: 1 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, flexWrap: 'wrap' },
  stars: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, marginTop: spacing.md },
  starsLabel: { marginRight: spacing.sm },
  actions: {
    flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md, marginTop: spacing.md,
    paddingTop: spacing.md, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.divider,
  },
  action: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  actionText: { fontFamily: fonts.medium, fontSize: 12 },
});
