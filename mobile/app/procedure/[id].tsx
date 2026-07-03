import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Screen, Text, Button, Badge, EmptyState } from '../../src/components';
import { colors } from '../../src/theme/colors';
import { radius, spacing } from '../../src/theme/spacing';
import { useI18n } from '../../src/i18n';
import { useAuth } from '../../src/auth/AuthContext';
import { useQuery } from '../../src/hooks/useQuery';
import { api } from '../../src/api/services';
import { procedurePlaceholder } from '../../src/data/decor';

function Meta({ icon, label, value }: { icon: keyof typeof Ionicons.glyphMap; label: string; value: string }) {
  return (
    <View style={styles.meta}>
      <Ionicons name={icon} size={18} color={colors.gold} />
      <Text variant="caption" style={styles.metaLabel}>{label}</Text>
      <Text variant="label">{value}</Text>
    </View>
  );
}

export default function ProcedureDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { t } = useI18n();
  const { isAuthenticated } = useAuth();
  const { data, loading } = useQuery(api.getProcedures);

  const p = (data ?? []).find((x) => x.id === id);

  if (loading && !data) {
    return (
      <Screen padded><ActivityIndicator color={colors.gold} style={{ marginTop: spacing.huge }} /></Screen>
    );
  }
  if (!p) {
    return (
      <Screen padded>
        <BackBar />
        <EmptyState title="Treatment not found" />
      </Screen>
    );
  }

  return (
    <Screen scroll padded={false} edges={[]}>
      <View style={styles.hero}>
        <Image source={p.image_url || procedurePlaceholder} style={styles.heroImg} contentFit="cover" />
        <View style={styles.heroOverlay} />
        <Pressable style={styles.back} onPress={() => router.back()} hitSlop={10}>
          <Ionicons name="chevron-back" size={24} color={colors.white} />
        </Pressable>
        <View style={styles.heroText}>
          {p.category ? <Badge label={p.category} tone="gold" /> : null}
          <Text variant="h1" style={styles.title}>{p.title}</Text>
        </View>
      </View>

      <View style={styles.body}>
        {p.description ? <Text variant="body" style={styles.desc}>{p.description}</Text> : null}

        <View style={styles.metaGrid}>
          {p.duration ? <Meta icon="time-outline" label="Duration" value={p.duration} /> : null}
          {p.sessions ? <Meta icon="repeat-outline" label="Sessions" value={String(p.sessions)} /> : null}
          {p.session_gap ? <Meta icon="calendar-outline" label="Gap" value={p.session_gap} /> : null}
        </View>

        {p.key_features && p.key_features.length > 0 ? (
          <>
            <Text variant="h3" style={styles.section}>Highlights</Text>
            {p.key_features.map((f) => (
              <View key={f} style={styles.feature}>
                <Ionicons name="checkmark-circle" size={18} color={colors.sage} />
                <Text variant="body" color={colors.textPrimary}>{f}</Text>
              </View>
            ))}
          </>
        ) : null}
      </View>

      <View style={styles.cta}>
        <Button
          title={isAuthenticated ? t('common.shopNow') : 'Log in to book'}
          onPress={() =>
            isAuthenticated
              ? router.push({ pathname: '/book/[id]', params: { id: p.id } })
              : router.push('/(auth)/sign-in')
          }
        />
      </View>
    </Screen>
  );
}

function BackBar() {
  const router = useRouter();
  return (
    <Pressable onPress={() => router.back()} hitSlop={10} style={{ marginTop: spacing.lg }}>
      <Ionicons name="chevron-back" size={24} color={colors.textPrimary} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  hero: { height: 320, justifyContent: 'flex-end' },
  heroImg: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  heroOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(11,11,13,0.4)' },
  back: {
    position: 'absolute', top: 48, left: spacing.lg, width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.4)', alignItems: 'center', justifyContent: 'center',
  },
  heroText: { padding: spacing.xl, gap: spacing.sm },
  title: { marginTop: 2 },
  body: { padding: spacing.xl },
  desc: { marginBottom: spacing.lg },
  metaGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.lg },
  meta: {
    minWidth: 90, gap: 2, backgroundColor: colors.surface, borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth, borderColor: colors.border, padding: spacing.md,
  },
  metaLabel: { marginTop: 2 },
  section: { marginTop: spacing.xxl, marginBottom: spacing.md },
  feature: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.sm },
  cta: { padding: spacing.xl, paddingTop: 0 },
});
