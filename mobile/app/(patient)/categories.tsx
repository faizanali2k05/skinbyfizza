import { useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Screen, Text, EmptyState } from '../../src/components';
import { colors } from '../../src/theme/colors';
import { radius, spacing } from '../../src/theme/spacing';
import { fonts } from '../../src/theme/typography';
import { useI18n } from '../../src/i18n';
import { useQuery } from '../../src/hooks/useQuery';
import { api } from '../../src/api/services';
import { categoryTiles, procedurePlaceholder } from '../../src/data/decor';

export default function Categories() {
  const { t } = useI18n();
  const router = useRouter();
  const { data: procedures, loading, refetch } = useQuery(api.getProcedures);
  const [active, setActive] = useState<string | null>(null);

  // Real categories derived from the treatments catalogue.
  const categories = useMemo(() => {
    const set = new Set<string>();
    (procedures ?? []).forEach((p) => p.category && set.add(p.category));
    return Array.from(set);
  }, [procedures]);

  const tileFor = (cat: string) =>
    categoryTiles.find((c) => c.key === cat)?.image ?? procedurePlaceholder;

  const filtered = (procedures ?? []).filter((p) => !active || p.category === active);

  return (
    <Screen scroll padded refreshing={loading} onRefresh={refetch}>
      <View style={styles.titleRow}>
        <Text variant="h1">{t('nav.categories')}</Text>
        <Ionicons name="search" size={20} color={colors.textPrimary} />
      </View>

      {/* Category chips */}
      {categories.length > 0 && (
        <View style={styles.chips}>
          <Chip label="All" active={!active} onPress={() => setActive(null)} />
          {categories.map((c) => (
            <Chip key={c} label={c} active={active === c} onPress={() => setActive(c)} />
          ))}
        </View>
      )}

      {loading && !procedures ? (
        <ActivityIndicator color={colors.gold} style={styles.loader} />
      ) : filtered.length === 0 ? (
        <EmptyState title="No treatments yet" subtitle="The clinic hasn't added treatments in this category." />
      ) : (
        <View style={styles.list}>
          {filtered.map((p) => (
            <Pressable
              key={p.id}
              style={styles.row}
              onPress={() => router.push({ pathname: '/(patient)/procedure/[id]', params: { id: p.id } })}
            >
              <View style={styles.rowLeft}>
                <Text variant="h3" style={styles.rowTitle}>
                  {p.title}
                </Text>
                <Text variant="caption">{p.category}</Text>
              </View>
              <Image source={p.image_url || tileFor(p.category)} style={styles.thumb} contentFit="cover" />
            </Pressable>
          ))}
        </View>
      )}
    </Screen>
  );
}

function Chip({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={[styles.chip, active && styles.chipActive]}>
      <Text style={[styles.chipText, active && styles.chipTextActive]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  titleRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginTop: spacing.sm, marginBottom: spacing.xl,
  },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.sm },
  chip: {
    paddingHorizontal: spacing.lg, paddingVertical: spacing.sm, borderRadius: radius.pill,
    borderWidth: StyleSheet.hairlineWidth, borderColor: colors.border, backgroundColor: colors.surface,
  },
  chipActive: { backgroundColor: colors.gold, borderColor: colors.gold },
  chipText: { fontFamily: fonts.medium, fontSize: 13, color: colors.textSecondary },
  chipTextActive: { color: colors.textInverse },
  loader: { marginTop: spacing.huge },
  list: { marginTop: spacing.sm },
  row: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    height: 96, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.divider,
  },
  rowLeft: { flex: 1, gap: 2 },
  rowTitle: { fontFamily: fonts.displayMedium },
  thumb: { width: 110, height: 72, borderRadius: radius.sm },
});
