import { useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, TextInput, View } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { Screen, Text, EmptyState, useProcedureSheet } from '../../src/components';
import { useTheme, useThemedStyles } from '../../src/theme/ThemeContext';
import { AppColors } from '../../src/theme/palettes';
import { radius, spacing } from '../../src/theme/spacing';
import { fonts } from '../../src/theme/typography';
import { useI18n } from '../../src/i18n';
import { useQuery } from '../../src/hooks/useQuery';
import { api } from '../../src/api/services';
import { categoryTiles, procedurePlaceholder } from '../../src/data/decor';

export default function Categories() {
  const { t } = useI18n();
  const { open } = useProcedureSheet();
  const { data: procedures, loading, refetch } = useQuery(api.getProcedures);
  const [active, setActive] = useState<string | null>(null);
  const [searching, setSearching] = useState(false);
  const [q, setQ] = useState('');
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);

  // Real categories derived from the treatments catalogue.
  const categories = useMemo(() => {
    const set = new Set<string>();
    (procedures ?? []).forEach((p) => p.category && set.add(p.category));
    return Array.from(set);
  }, [procedures]);

  const tileFor = (cat: string) =>
    categoryTiles.find((c) => c.key === cat)?.image ?? procedurePlaceholder;

  const needle = q.trim().toLowerCase();
  const filtered = (procedures ?? []).filter(
    (p) =>
      (!active || p.category === active) &&
      (!needle ||
        p.title.toLowerCase().includes(needle) ||
        (p.description ?? '').toLowerCase().includes(needle)),
  );

  return (
    <Screen scroll padded refreshing={loading} onRefresh={refetch}>
      <View style={styles.titleRow}>
        <Text variant="h1">{t('nav.categories')}</Text>
        <Pressable
          hitSlop={8}
          onPress={() => {
            setSearching((s) => !s);
            setQ('');
          }}
        >
          <Ionicons name={searching ? 'close' : 'search'} size={20} color={colors.textPrimary} />
        </Pressable>
      </View>

      {searching && (
        <View style={styles.searchBar}>
          <Ionicons name="search" size={16} color={colors.textMuted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search treatments…"
            placeholderTextColor={colors.textMuted}
            value={q}
            onChangeText={setQ}
            autoFocus
          />
        </View>
      )}

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
              onPress={() => open(p)}
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
  const styles = useThemedStyles(makeStyles);
  return (
    <Pressable onPress={onPress} style={[styles.chip, active && styles.chipActive]}>
      <Text style={[styles.chipText, active && styles.chipTextActive]}>{label}</Text>
    </Pressable>
  );
}

const makeStyles = (colors: AppColors) => StyleSheet.create({
  titleRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginTop: spacing.sm, marginBottom: spacing.xl,
  },
  searchBar: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    backgroundColor: colors.glassTint, borderColor: colors.glassBorder,
    borderWidth: StyleSheet.hairlineWidth, borderRadius: radius.lg,
    paddingHorizontal: spacing.lg, height: 48, marginBottom: spacing.md,
  },
  searchInput: { flex: 1, color: colors.textPrimary, fontFamily: fonts.regular, fontSize: 15, height: '100%' },
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
