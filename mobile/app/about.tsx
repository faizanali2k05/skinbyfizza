import { Linking, Pressable, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Screen, Text, Card } from '../src/components';
import { useTheme } from '../src/theme/ThemeContext';
import { spacing } from '../src/theme/spacing';

const INFO = [
  { icon: 'location-outline' as const, label: 'Karachi Clinic', value: 'Karachi, Pakistan' },
  { icon: 'time-outline' as const, label: 'Hours', value: 'Mon–Sat, 11:00 AM – 8:00 PM' },
  { icon: 'sparkles-outline' as const, label: 'Services', value: 'Facials, Injectables, Laser, Skin Care & more' },
];

const SOCIAL = [
  { icon: 'logo-instagram' as const, label: 'Instagram', url: 'https://instagram.com' },
  { icon: 'logo-whatsapp' as const, label: 'WhatsApp', url: 'https://wa.me/923000000001' },
];

export default function About() {
  const router = useRouter();
  const { colors } = useTheme();

  return (
    <Screen scroll padded edges={['top']}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={10}>
          <Ionicons name="chevron-back" size={24} color={colors.textPrimary} />
        </Pressable>
        <Text variant="h2">About</Text>
        <View style={{ width: 24 }} />
      </View>

      <Text variant="display" style={styles.brand}>
        Skin By{'\n'}Dr. Fizza G
      </Text>
      <Text variant="body" style={styles.tagline}>
        Expert dermatology & aesthetic care — personalised treatments, delivered with a
        gentle, professional touch.
      </Text>

      {INFO.map((row) => (
        <Card key={row.label} style={styles.card} padded>
          <View style={styles.row}>
            <Ionicons name={row.icon} size={20} color={colors.gold} />
            <View style={styles.flex}>
              <Text variant="overline">{row.label}</Text>
              <Text variant="body" color={colors.textPrimary}>{row.value}</Text>
            </View>
          </View>
        </Card>
      ))}

      <Text variant="h3" style={styles.follow}>Follow us</Text>
      <View style={styles.social}>
        {SOCIAL.map((s) => (
          <Pressable key={s.label} style={[styles.socialBtn, { borderColor: colors.border, backgroundColor: colors.surface }]} onPress={() => Linking.openURL(s.url)}>
            <Ionicons name={s.icon} size={20} color={colors.gold} />
            <Text variant="label">{s.label}</Text>
          </Pressable>
        ))}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginTop: spacing.sm, marginBottom: spacing.xl,
  },
  brand: { marginBottom: spacing.md },
  tagline: { marginBottom: spacing.xl },
  card: { marginBottom: spacing.md },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.lg },
  flex: { flex: 1 },
  follow: { marginTop: spacing.xl, marginBottom: spacing.md },
  social: { flexDirection: 'row', gap: spacing.md },
  socialBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm,
    paddingVertical: spacing.lg, borderRadius: 12, borderWidth: StyleSheet.hairlineWidth,
  },
});
