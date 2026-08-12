import { useEffect } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Screen, Text } from '../../src/components';
import { useTheme, useThemedStyles } from '../../src/theme/ThemeContext';
import { AppColors } from '../../src/theme/palettes';
import { radius, spacing } from '../../src/theme/spacing';
import { useI18n } from '../../src/i18n';
import { useAuth } from '../../src/auth/AuthContext';
import { AppLocale } from '../../src/i18n/translations';
import { confirm } from '../../src/utils/confirm';

type Row = {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  sub: string;
  onPress?: () => void;
};

/** Settings & help — account info lives on the Profile tab now. */
export default function More() {
  const { t, locale, setLocale, isRTL } = useI18n();
  const { isAuthenticated, signOut, refreshUser } = useAuth();
  const { colors, isDark, toggle } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const router = useRouter();

  useEffect(() => {
    if (isAuthenticated) refreshUser().catch(() => {});
  }, [isAuthenticated, refreshUser]);

  const rows: Row[] = [
    { icon: 'help-circle-outline', title: t('more.helpSupport'), sub: t('more.helpSupportSub'), onPress: () => router.push('/about') },
    { icon: 'information-circle-outline', title: t('more.aboutClinic'), sub: t('more.aboutClinicSub'), onPress: () => router.push('/about') },
  ];

  const cycleLocale = () => {
    const order: AppLocale[] = ['en', 'ur', 'ar'];
    setLocale(order[(order.indexOf(locale) + 1) % order.length]);
  };

  const chevron = isRTL ? 'chevron-back' : 'chevron-forward';

  return (
    <Screen scroll padded>
      <Text variant="h1" style={styles.title}>{t('more.title')}</Text>

      <View style={styles.menu}>
        {rows.map((r, i) => (
          <Pressable key={r.title} onPress={r.onPress} style={[styles.row, i < rows.length - 1 && styles.rowDivider]}>
            <Ionicons name={r.icon} size={20} color={colors.textSecondary} />
            <View style={styles.flex}>
              <Text variant="label">{r.title}</Text>
              <Text variant="caption">{r.sub}</Text>
            </View>
            <Ionicons name={chevron} size={18} color={colors.textMuted} />
          </Pressable>
        ))}
      </View>

      {/* Appearance */}
      <Pressable style={styles.settingRow} onPress={toggle}>
        <Ionicons name={isDark ? 'moon-outline' : 'sunny-outline'} size={20} color={colors.gold} />
        <Text variant="label" style={styles.flex}>Appearance</Text>
        <Text variant="overline" color={colors.gold}>{isDark ? 'DARK' : 'LIGHT'}</Text>
      </Pressable>

      {/* Language */}
      <Pressable style={styles.settingRow} onPress={cycleLocale}>
        <Ionicons name="language-outline" size={20} color={colors.gold} />
        <Text variant="label" style={styles.flex}>{t('more.language')}</Text>
        <Text variant="overline" color={colors.gold}>{locale.toUpperCase()}</Text>
      </Pressable>

      {isAuthenticated ? (
        <Pressable
          style={styles.logout}
          onPress={() =>
            confirm({
              title: t('more.logout'),
              confirmLabel: t('more.logout'),
              cancelLabel: t('common.cancel'),
              destructive: true,
              onConfirm: async () => {
                await signOut();
                router.replace('/(auth)/welcome');
              },
            })
          }
        >
          <Ionicons name="log-out-outline" size={20} color={colors.error} />
          <Text variant="label" color={colors.error}>{t('more.logout')}</Text>
        </Pressable>
      ) : null}
    </Screen>
  );
}

const makeStyles = (c: AppColors) =>
  StyleSheet.create({
    flex: { flex: 1 },
    title: { marginTop: spacing.sm, marginBottom: spacing.xl },
    menu: {
      backgroundColor: c.surface, borderRadius: radius.xl,
      borderWidth: StyleSheet.hairlineWidth, borderColor: c.glassBorder, overflow: 'hidden',
    },
    row: { flexDirection: 'row', alignItems: 'center', gap: spacing.lg, paddingHorizontal: spacing.lg, paddingVertical: spacing.lg },
    rowDivider: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: c.divider },
    settingRow: {
      flexDirection: 'row', alignItems: 'center', gap: spacing.lg, paddingVertical: spacing.lg,
      borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: c.divider,
    },
    logout: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm, paddingVertical: spacing.xl, marginTop: spacing.lg },
  });
