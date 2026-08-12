import { useEffect } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Screen, Text, Card } from '../../src/components';
import { useTheme, useThemedStyles } from '../../src/theme/ThemeContext';
import { AppColors } from '../../src/theme/palettes';
import { spacing } from '../../src/theme/spacing';
import { useI18n } from '../../src/i18n';
import { AppLocale } from '../../src/i18n/translations';
import { useAuth } from '../../src/auth/AuthContext';
import { confirm } from '../../src/utils/confirm';
import { useQuery } from '../../src/hooks/useQuery';
import { api } from '../../src/api/services';

function isToday(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  return d.toDateString() === now.toDateString();
}

/** Staff Home tab — greeting, at-a-glance stats, settings. Chats / Users /
 * Appointments / Treatments now live as their own tabs on the bar below. */
export default function StaffDashboard() {
  const { user, signOut, refreshUser } = useAuth();
  const { colors, isDark, toggle } = useTheme();
  const { locale, setLocale } = useI18n();
  const styles = useThemedStyles(makeStyles);
  const router = useRouter();
  const isManager = user?.role === 'manager';

  useEffect(() => {
    refreshUser().catch(() => {});
  }, [refreshUser]);

  const { data: threads } = useQuery(api.getThreads, [], { refetchOnFocus: true });
  const { data: appointments } = useQuery(() => api.getAppointments(), [], { refetchOnFocus: true });
  const { data: users } = useQuery(() => api.getUsers(), [], { refetchOnFocus: true });

  // "Awaiting a staff reply" = the last message in the thread came from the
  // patient. Same rule the backend reminder sweep uses. (unread_count is not
  // usable here: only WhatsApp inbound bumps it and nothing ever clears it.)
  const needsReply = (threads ?? []).filter((t) => t.last_sender_id === t.user_id).length;
  const todaysVisits = (appointments ?? []).filter((a) => isToday(a.scheduled_at) && a.status !== 'cancelled').length;
  const patients = (users ?? []).filter((u) => u.role === 'user').length;

  const stats = [
    { icon: 'chatbubbles-outline' as const, value: needsReply, label: 'Need a reply', tone: colors.info, onPress: () => router.push('/(staff)/chats') },
    { icon: 'calendar-outline' as const, value: todaysVisits, label: "Today's visits", tone: colors.sage, onPress: () => router.push('/(staff)/appointments') },
    { icon: 'people-outline' as const, value: patients, label: 'Patients', tone: colors.gold, onPress: () => router.push('/(staff)/users') },
  ];

  const cycleLocale = () => {
    const order: AppLocale[] = ['en', 'ur', 'ar'];
    setLocale(order[(order.indexOf(locale) + 1) % order.length]);
  };

  const logout = () =>
    confirm({
      title: 'Log out',
      message: 'Are you sure you want to log out?',
      confirmLabel: 'Log out',
      cancelLabel: 'Cancel',
      destructive: true,
      onConfirm: async () => {
        await signOut();
        router.replace('/(auth)/welcome');
      },
    });

  return (
    <Screen scroll padded>
      <View style={styles.header}>
        <View style={styles.flex}>
          <Text variant="overline" color={colors.goldLight}>
            {isManager ? 'Manager portal' : 'Doctor portal'}
          </Text>
          <Text variant="display">{user?.full_name ?? 'Clinic'}</Text>
        </View>
      </View>

      <View style={styles.statsRow}>
        {stats.map((s) => (
          <Card key={s.label} style={styles.statCard} padded onPress={s.onPress}>
            <View style={[styles.statIcon, { backgroundColor: s.tone + '22' }]}>
              <Ionicons name={s.icon} size={18} color={s.tone} />
            </View>
            <Text variant="h2" style={styles.statValue}>{s.value}</Text>
            <Text variant="caption">{s.label}</Text>
          </Card>
        ))}
      </View>

      {/* Settings — kept inside the portal so staff never need the patient app */}
      <Text variant="overline" style={styles.settingsLabel}>Settings</Text>

      <Pressable style={styles.settingRow} onPress={toggle}>
        <Ionicons name={isDark ? 'moon-outline' : 'sunny-outline'} size={20} color={colors.gold} />
        <Text variant="label" style={styles.flex}>Appearance</Text>
        <Text variant="overline" color={colors.gold}>{isDark ? 'DARK' : 'LIGHT'}</Text>
      </Pressable>

      <Pressable style={styles.settingRow} onPress={cycleLocale}>
        <Ionicons name="language-outline" size={20} color={colors.gold} />
        <Text variant="label" style={styles.flex}>Language</Text>
        <Text variant="overline" color={colors.gold}>{locale.toUpperCase()}</Text>
      </Pressable>

      <Pressable style={styles.logout} onPress={logout}>
        <Ionicons name="log-out-outline" size={20} color={colors.error} />
        <Text variant="label" color={colors.error}>Log out</Text>
      </Pressable>
    </Screen>
  );
}

const makeStyles = (c: AppColors) =>
  StyleSheet.create({
    flex: { flex: 1 },
    header: { flexDirection: 'row', alignItems: 'flex-start', marginTop: spacing.sm, marginBottom: spacing.xl },
    statsRow: { flexDirection: 'row', gap: spacing.md },
    statCard: { flex: 1, gap: 2 },
    statIcon: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.sm },
    statValue: { marginTop: 2 },
    settingsLabel: { marginTop: spacing.xxl, marginBottom: spacing.sm },
    settingRow: {
      flexDirection: 'row', alignItems: 'center', gap: spacing.lg, paddingVertical: spacing.lg,
      borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: c.divider,
    },
    logout: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm,
      paddingVertical: spacing.xl, marginTop: spacing.lg,
    },
  });
