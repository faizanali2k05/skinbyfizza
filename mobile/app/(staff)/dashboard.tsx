import { useEffect } from 'react';
import { Alert, Pressable, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Screen, Text, Badge } from '../../src/components';
import { colors } from '../../src/theme/colors';
import { radius, spacing } from '../../src/theme/spacing';
import { useAuth } from '../../src/auth/AuthContext';

type Tile = {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  sub: string;
  tone: string;
  onPress?: () => void;
  soon?: boolean;
};

export default function StaffDashboard() {
  const { user, signOut, refreshUser } = useAuth();
  const router = useRouter();
  const isManager = user?.role === 'manager';

  useEffect(() => {
    refreshUser().catch(() => {});
  }, [refreshUser]);

  const soon = (label: string) =>
    Alert.alert(label, 'This console section activates once its n8n workflow is live.');

  const tiles: Tile[] = [
    { icon: 'chatbubbles-outline', title: 'Chats', sub: isManager ? 'Triage & tag to doctor' : 'Primary & VIP threads', tone: colors.info, onPress: () => soon('Chats'), soon: true },
    { icon: 'calendar-outline', title: 'Appointments', sub: 'Confirm, assign & reschedule', tone: colors.sage, onPress: () => soon('Appointments'), soon: true },
    { icon: 'people-outline', title: 'Users', sub: isManager ? 'View & register leads' : 'Manage patients', tone: colors.gold, onPress: () => soon('Users'), soon: true },
    { icon: 'sparkles-outline', title: 'Procedures', sub: 'Add & edit treatments', tone: colors.rose, onPress: () => soon('Procedures'), soon: true },
    { icon: 'medkit-outline', title: 'Prescriptions', sub: 'Products & services', tone: colors.gold, onPress: () => soon('Prescriptions'), soon: true },
    { icon: 'information-circle-outline', title: 'About the clinic', sub: 'Info & locations', tone: colors.info, onPress: () => soon('About'), soon: true },
  ];

  return (
    <Screen scroll padded>
      <View style={styles.header}>
        <View style={styles.flex}>
          <Text variant="overline" color={colors.goldLight}>
            {isManager ? 'Manager console' : 'Doctor console'}
          </Text>
          <Text variant="display">{user?.full_name ?? 'Clinic'}</Text>
        </View>
        <Pressable
          style={styles.logout}
          onPress={() =>
            Alert.alert('Log out', '', [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Log out', style: 'destructive', onPress: () => signOut() },
            ])
          }
        >
          <Ionicons name="log-out-outline" size={20} color={colors.error} />
        </Pressable>
      </View>

      <View style={styles.grid}>
        {tiles.map((tabItem) => (
          <Pressable key={tabItem.title} style={styles.tile} onPress={tabItem.onPress}>
            <View style={[styles.tileIcon, { backgroundColor: tabItem.tone + '22' }]}>
              <Ionicons name={tabItem.icon} size={22} color={tabItem.tone} />
            </View>
            <View style={styles.tileTitleRow}>
              <Text variant="title">{tabItem.title}</Text>
              {tabItem.soon ? <Badge label="soon" tone="neutral" /> : null}
            </View>
            <Text variant="caption">{tabItem.sub}</Text>
          </Pressable>
        ))}
      </View>

      <Pressable style={styles.switchBtn} onPress={() => router.push('/(patient)/discover')}>
        <Ionicons name="phone-portrait-outline" size={18} color={colors.textSecondary} />
        <Text variant="label" color={colors.textSecondary}>Switch to patient view</Text>
      </Pressable>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'flex-start', marginTop: spacing.sm, marginBottom: spacing.xl },
  logout: {
    width: 42, height: 42, borderRadius: 21, backgroundColor: colors.surface,
    borderWidth: StyleSheet.hairlineWidth, borderColor: colors.border, alignItems: 'center', justifyContent: 'center',
  },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  tile: {
    width: '47%', flexGrow: 1, backgroundColor: colors.surface, borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth, borderColor: colors.border, padding: spacing.lg, gap: 4,
  },
  tileIcon: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.sm },
  tileTitleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  switchBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm,
    paddingVertical: spacing.xl, marginTop: spacing.lg,
  },
});
