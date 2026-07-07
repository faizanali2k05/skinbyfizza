import { Linking, Pressable, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Screen, Text, Card, Logo } from '../src/components';
import { useTheme } from '../src/theme/ThemeContext';
import { spacing } from '../src/theme/spacing';
import { useQuery } from '../src/hooks/useQuery';
import { api } from '../src/api/services';

const SOCIAL = [
  { icon: 'logo-instagram' as const, label: 'Instagram', url: 'https://instagram.com' },
  { icon: 'logo-whatsapp' as const, label: 'WhatsApp', url: 'https://wa.me/923000000001' },
];

export default function About() {
  const router = useRouter();
  const { colors } = useTheme();
  const { data } = useQuery(api.getAbout);

  const description =
    data?.about?.description ??
    'Expert dermatology & aesthetic care — personalised treatments, delivered with a gentle, professional touch.';
  const locations = data?.locations ?? [];

  return (
    <Screen scroll padded edges={['top']}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={10}>
          <Ionicons name="chevron-back" size={24} color={colors.textPrimary} />
        </Pressable>
        <Text variant="h2">About</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.logoWrap}>
        <Logo size="large" />
      </View>
      <Text variant="body" center style={styles.tagline}>
        {description}
      </Text>

      {locations.map((loc) => (
        <Card key={loc.id} style={styles.card} padded>
          <View style={styles.row}>
            <Ionicons name="location-outline" size={20} color={colors.gold} />
            <View style={styles.flex}>
              <Text variant="overline">{loc.name}</Text>
              <Text variant="body" color={colors.textPrimary}>
                {[loc.address, loc.city].filter(Boolean).join(', ') || loc.city || '—'}
              </Text>
              {loc.phone ? <Text variant="caption">{loc.phone}</Text> : null}
            </View>
          </View>
        </Card>
      ))}

      <Card style={styles.card} padded>
        <View style={styles.row}>
          <Ionicons name="time-outline" size={20} color={colors.gold} />
          <View style={styles.flex}>
            <Text variant="overline">Hours</Text>
            <Text variant="body" color={colors.textPrimary}>Mon–Sat, 11:00 AM – 8:00 PM</Text>
          </View>
        </View>
      </Card>

      <Text variant="h3" style={styles.follow}>Follow us</Text>
      <View style={styles.social}>
        {SOCIAL.map((s) => (
          <Pressable
            key={s.label}
            style={[styles.socialBtn, { borderColor: colors.glassBorder, backgroundColor: colors.glassTint }]}
            onPress={() => Linking.openURL(s.url)}
          >
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
  logoWrap: { alignItems: 'center', marginBottom: spacing.lg },
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
