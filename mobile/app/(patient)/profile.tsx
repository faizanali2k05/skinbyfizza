import { useEffect } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Screen, Text, Badge, Card } from '../../src/components';
import { useTheme, useThemedStyles } from '../../src/theme/ThemeContext';
import { AppColors } from '../../src/theme/palettes';
import { radius, spacing } from '../../src/theme/spacing';
import { useAuth } from '../../src/auth/AuthContext';

type Row = {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  sub: string;
  onPress: () => void;
};

export default function Profile() {
  const { user, isAuthenticated, refreshUser } = useAuth();
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const router = useRouter();
  const isStaff = user?.role === 'doctor' || user?.role === 'manager';

  useEffect(() => {
    if (isAuthenticated) refreshUser().catch(() => {});
  }, [isAuthenticated, refreshUser]);

  const rows: Row[] = [
    { icon: 'calendar-outline', title: 'My appointments', sub: 'Visits booked for you by the clinic', onPress: () => router.push('/my-appointments') },
    { icon: 'medkit-outline', title: 'Prescriptions', sub: 'Products & services from your doctor', onPress: () => router.push('/prescriptions') },
    { icon: 'notifications-outline', title: 'Notifications', sub: 'Updates from the clinic', onPress: () => router.push('/notifications') },
  ];

  return (
    <Screen scroll padded>
      <Text variant="h1" style={styles.title}>Profile</Text>

      <Card style={styles.account} padded elevated>
        <Pressable
          style={styles.accountRow}
          onPress={() => router.push(isAuthenticated ? '/profile-edit' : '/(auth)/sign-in')}
        >
          <View style={styles.avatar}>
            <Ionicons name="person-outline" size={26} color={colors.gold} />
          </View>
          <View style={styles.flex}>
            {isAuthenticated ? (
              <>
                <View style={styles.nameRow}>
                  <Text variant="title">{user?.full_name}</Text>
                  {user?.customer_type === 'vip' ? <Badge label="VIP" tone="gold" /> : null}
                </View>
                <Text variant="caption">{user?.email ?? user?.phone_e164}</Text>
              </>
            ) : (
              <>
                <Text variant="title">Sign in / Register</Text>
                <Text variant="caption">For faster checkout & saved history</Text>
              </>
            )}
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
        </Pressable>
      </Card>

      {isStaff ? (
        <Pressable style={styles.staffBtn} onPress={() => router.push('/(staff)/dashboard')}>
          <Ionicons name="briefcase-outline" size={18} color={colors.textInverse} />
          <Text variant="label" color={colors.textInverse}>Open staff console</Text>
        </Pressable>
      ) : null}

      <View style={styles.menu}>
        {rows.map((r, i) => (
          <Pressable key={r.title} onPress={r.onPress} style={[styles.row, i < rows.length - 1 && styles.rowDivider]}>
            <View style={styles.rowIcon}>
              <Ionicons name={r.icon} size={19} color={colors.gold} />
            </View>
            <View style={styles.flex}>
              <Text variant="label">{r.title}</Text>
              <Text variant="caption">{r.sub}</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
          </Pressable>
        ))}
      </View>
    </Screen>
  );
}

const makeStyles = (c: AppColors) =>
  StyleSheet.create({
    flex: { flex: 1 },
    title: { marginTop: spacing.sm, marginBottom: spacing.xl },
    account: { marginBottom: spacing.lg },
    accountRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
    avatar: {
      width: 48, height: 48, borderRadius: 24, backgroundColor: c.surfaceMuted,
      alignItems: 'center', justifyContent: 'center',
      borderWidth: StyleSheet.hairlineWidth, borderColor: c.glassBorder,
    },
    nameRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
    staffBtn: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm,
      backgroundColor: c.gold, borderRadius: radius.md, paddingVertical: spacing.md, marginBottom: spacing.lg,
    },
    menu: {
      backgroundColor: c.surface, borderRadius: radius.xl,
      borderWidth: StyleSheet.hairlineWidth, borderColor: c.glassBorder, overflow: 'hidden',
    },
    row: { flexDirection: 'row', alignItems: 'center', gap: spacing.lg, paddingHorizontal: spacing.lg, paddingVertical: spacing.lg },
    rowDivider: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: c.divider },
    rowIcon: {
      width: 36, height: 36, borderRadius: 18, backgroundColor: c.glassTint,
      alignItems: 'center', justifyContent: 'center',
    },
  });
