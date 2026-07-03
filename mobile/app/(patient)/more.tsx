import { useEffect } from 'react';
import { Alert, Pressable, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Screen, Text, Badge } from '../../src/components';
import { colors } from '../../src/theme/colors';
import { radius, spacing } from '../../src/theme/spacing';
import { useI18n } from '../../src/i18n';
import { useAuth } from '../../src/auth/AuthContext';
import { AppLocale } from '../../src/i18n/translations';

type Row = {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  sub: string;
  badge?: string;
  onPress?: () => void;
};

export default function More() {
  const { t, locale, setLocale, isRTL } = useI18n();
  const { user, isAuthenticated, signOut, refreshUser } = useAuth();
  const router = useRouter();

  // Keep the profile fresh from /me when signed in.
  useEffect(() => {
    if (isAuthenticated) refreshUser().catch(() => {});
  }, [isAuthenticated, refreshUser]);

  const rows: Row[] = [
    { icon: 'sparkles-outline', title: 'AI Skin Consultant', sub: 'Chat about treatments & routines', onPress: () => router.push('/chat') },
    { icon: 'notifications-outline', title: t('more.notifications'), sub: t('more.notificationsSub'), onPress: () => router.push('/notifications') },
    { icon: 'calendar-outline', title: t('more.myAppointments'), sub: t('more.myAppointmentsSub'), onPress: () => router.push('/(patient)/appointments') },
    { icon: 'medkit-outline', title: t('more.prescriptions'), sub: t('more.prescriptionsSub'), onPress: () => router.push('/prescriptions') },
    { icon: 'repeat-outline', title: t('more.followUp'), sub: t('more.myAppointmentsSub'), onPress: () => router.push('/(patient)/appointments') },
    { icon: 'settings-outline', title: t('more.settings'), sub: t('more.settingsSub') },
    { icon: 'help-circle-outline', title: t('more.helpSupport'), sub: t('more.helpSupportSub') },
    { icon: 'information-circle-outline', title: t('more.aboutClinic'), sub: t('more.aboutClinicSub') },
  ];

  const cycleLocale = () => {
    const order: AppLocale[] = ['en', 'ur', 'ar'];
    setLocale(order[(order.indexOf(locale) + 1) % order.length]);
  };

  const chevron = isRTL ? 'chevron-back' : 'chevron-forward';

  return (
    <Screen scroll padded>
      <Text variant="h1" style={styles.title}>{t('more.title')}</Text>

      <Pressable
        style={styles.account}
        onPress={() => (isAuthenticated ? undefined : router.push('/(auth)/sign-in'))}
      >
        <View style={styles.avatar}>
          <Ionicons name="person-outline" size={20} color={colors.gold} />
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
              <Text variant="title">{t('auth.signInRegister')}</Text>
              <Text variant="caption">{t('auth.forFasterCheckout')}</Text>
            </>
          )}
        </View>
        <Ionicons name={chevron} size={20} color={colors.textMuted} />
      </Pressable>

      {isAuthenticated && (user?.role === 'doctor' || user?.role === 'manager') ? (
        <Pressable style={styles.staffBtn} onPress={() => router.push('/(staff)/dashboard')}>
          <Ionicons name="briefcase-outline" size={18} color={colors.textInverse} />
          <Text variant="label" color={colors.textInverse}>Open staff console</Text>
        </Pressable>
      ) : null}

      <View style={styles.menu}>
        {rows.map((r, i) => (
          <Pressable key={r.title} onPress={r.onPress} style={[styles.row, i < rows.length - 1 && styles.rowDivider]}>
            <Ionicons name={r.icon} size={20} color={colors.textSecondary} />
            <View style={styles.flex}>
              <Text variant="label">{r.title}</Text>
              <Text variant="caption">{r.sub}</Text>
            </View>
            {r.badge ? <Badge label={r.badge} tone="rose" /> : null}
            <Ionicons name={chevron} size={18} color={colors.textMuted} />
          </Pressable>
        ))}
      </View>

      <Pressable style={styles.langRow} onPress={cycleLocale}>
        <Ionicons name="language-outline" size={20} color={colors.gold} />
        <Text variant="label" style={styles.flex}>{t('more.language')}</Text>
        <Text variant="overline" color={colors.gold}>{locale.toUpperCase()}</Text>
      </Pressable>

      {isAuthenticated ? (
        <Pressable
          style={styles.logout}
          onPress={() =>
            Alert.alert(t('more.logout'), '', [
              { text: t('common.cancel'), style: 'cancel' },
              { text: t('more.logout'), style: 'destructive', onPress: () => signOut() },
            ])
          }
        >
          <Ionicons name="log-out-outline" size={20} color={colors.error} />
          <Text variant="label" color={colors.error}>{t('more.logout')}</Text>
        </Pressable>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  title: { marginTop: spacing.sm, marginBottom: spacing.xl },
  account: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.md, backgroundColor: colors.surface,
    borderRadius: radius.lg, borderWidth: StyleSheet.hairlineWidth, borderColor: colors.border, padding: spacing.lg,
  },
  avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.surfaceMuted, alignItems: 'center', justifyContent: 'center' },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  staffBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm,
    backgroundColor: colors.gold, borderRadius: radius.md, paddingVertical: spacing.md, marginTop: spacing.lg,
  },
  menu: { marginTop: spacing.xl },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.lg, paddingVertical: spacing.lg },
  rowDivider: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.divider },
  langRow: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.lg, paddingVertical: spacing.lg,
    marginTop: spacing.sm, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.divider,
  },
  logout: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm, paddingVertical: spacing.xl, marginTop: spacing.lg },
});
