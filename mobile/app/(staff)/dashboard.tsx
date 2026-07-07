import { useEffect } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Screen, Text } from '../../src/components';
import { useTheme, useThemedStyles } from '../../src/theme/ThemeContext';
import { AppColors } from '../../src/theme/palettes';
import { radius, spacing } from '../../src/theme/spacing';
import { useI18n } from '../../src/i18n';
import { AppLocale } from '../../src/i18n/translations';
import { useAuth } from '../../src/auth/AuthContext';
import { confirm } from '../../src/utils/confirm';

type Tile = {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  sub: string;
  tone: string;
  onPress: () => void;
};

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

  // Doctor gets treatment management; manager only triages people & bookings.
  const tiles: Tile[] = [
    { icon: 'chatbubbles-outline', title: 'Chats', sub: isManager ? 'Triage & tag to doctor' : 'Primary & VIP threads', tone: colors.info, onPress: () => router.push('/(staff)/chats') },
    { icon: 'people-outline', title: 'Users', sub: isManager ? 'Rate, VIP & register leads' : 'Manage patients', tone: colors.gold, onPress: () => router.push('/(staff)/users') },
    { icon: 'calendar-outline', title: 'Appointments', sub: 'Confirm & manage', tone: colors.sage, onPress: () => router.push('/(staff)/appointments') },
    { icon: 'sparkles-outline', title: 'Treatments', sub: 'Add, edit & remove', tone: colors.rose, onPress: () => router.push('/(staff)/procedures') },
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

      <View style={styles.grid}>
        {tiles.map((tile) => (
          <Pressable key={tile.title} style={styles.tile} onPress={tile.onPress}>
            <View style={[styles.tileIcon, { backgroundColor: tile.tone + '22' }]}>
              <Ionicons name={tile.icon} size={22} color={tile.tone} />
            </View>
            <Text variant="title">{tile.title}</Text>
            <Text variant="caption">{tile.sub}</Text>
          </Pressable>
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
    grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
    tile: {
      width: '47%', flexGrow: 1, backgroundColor: c.surface, borderRadius: radius.lg,
      borderWidth: StyleSheet.hairlineWidth, borderColor: c.border, padding: spacing.lg, gap: 4,
    },
    tileIcon: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.sm },
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
