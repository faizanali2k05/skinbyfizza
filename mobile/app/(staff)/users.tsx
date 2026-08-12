import { useState } from 'react';
import { ActivityIndicator, Alert, Modal, Pressable, StyleSheet, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Screen, Text, Card, Badge, EmptyState, TextField, Button } from '../../src/components';
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
  const [registering, setRegistering] = useState<User | null>(null);
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
      <Text variant="h1" style={styles.title}>Users</Text>

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
        users.map((u) => (
          <UserCard key={u.id} u={u} isDoctor={isDoctor} run={run} onRegister={() => setRegistering(u)} />
        ))
      )}

      <RegisterLeadModal
        target={registering}
        onClose={() => setRegistering(null)}
        onDone={(updated) => {
          setData((list) => (list ?? []).map((x) => (x.id === updated.id ? updated : x)));
          setRegistering(null);
        }}
      />
    </Screen>
  );
}

/** Give a WhatsApp lead a real login (email + password) — staff action. */
function RegisterLeadModal({
  target,
  onClose,
  onDone,
}: {
  target: User | null;
  onClose: () => void;
  onDone: (u: User) => void;
}) {
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    if (!email.trim() || password.length < 6) {
      return Alert.alert('Enter an email and a password of at least 6 characters');
    }
    setSaving(true);
    try {
      const res = await api.registerUser(target!.id, email.trim(), password);
      onDone(res.user);
      setEmail('');
      setPassword('');
    } catch {
      Alert.alert('Could not register', 'That email may already be in use.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal visible={!!target} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.modalBackdrop} onPress={onClose}>
        <Pressable style={styles.modalCard} onPress={() => {}}>
          <Text variant="h3" style={styles.modalTitle}>Register {target?.full_name}</Text>
          <Text variant="caption" style={styles.modalSub}>
            Creates app login credentials for this WhatsApp lead ({target?.phone_e164}).
          </Text>
          <TextField label="Email" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" />
          <TextField label="Password" value={password} onChangeText={setPassword} secure />
          <Button title="Create login" loading={saving} onPress={submit} />
          <Pressable onPress={onClose} style={styles.modalCancel}>
            <Text variant="label" color={colors.textMuted}>Cancel</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function UserCard({
  u,
  isDoctor,
  run,
  onRegister,
}: {
  u: User;
  isDoctor: boolean;
  run: (patch: (list: User[]) => User[], call: () => Promise<unknown>) => void;
  onRegister: () => void;
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
        {!u.email && (
          <Action icon="key-outline" label="Register" onPress={onRegister} />
        )}
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
              router.push({ pathname: '/staff-prescription-form', params: { user_id: u.id, name: u.full_name } })
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
  title: { marginTop: spacing.sm, marginBottom: spacing.lg },
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
  modalBackdrop: {
    flex: 1, backgroundColor: colors.overlay, alignItems: 'center', justifyContent: 'center',
    padding: spacing.xl,
  },
  modalCard: {
    alignSelf: 'stretch', backgroundColor: colors.backgroundElevated, borderRadius: radius.xl,
    borderWidth: StyleSheet.hairlineWidth, borderColor: colors.glassBorder, padding: spacing.xl,
  },
  modalTitle: { marginBottom: spacing.xs },
  modalSub: { marginBottom: spacing.lg },
  modalCancel: { alignSelf: 'center', paddingVertical: spacing.md, marginTop: spacing.sm },
});
