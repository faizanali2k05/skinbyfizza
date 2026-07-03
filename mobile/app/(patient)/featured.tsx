import { ActivityIndicator, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Screen, Text, SectionHeader, EmptyState } from '../../src/components';
import { colors } from '../../src/theme/colors';
import { radius, spacing, screenPadding } from '../../src/theme/spacing';
import { useI18n } from '../../src/i18n';
import { useQuery } from '../../src/hooks/useQuery';
import { api } from '../../src/api/services';
import { featuredImage, procedurePlaceholder } from '../../src/data/decor';

export default function Featured() {
  const { t } = useI18n();
  const router = useRouter();
  const { data: procedures, loading, refetch } = useQuery(api.getProcedures);
  const list = procedures ?? [];
  const hero = list[0];

  return (
    <Screen scroll padded refreshing={loading} onRefresh={refetch}>
      <View style={styles.titleRow}>
        <Text variant="h1">{t('nav.featured')}</Text>
        <Ionicons name="search" size={20} color={colors.textPrimary} />
      </View>

      <Pressable style={styles.banner} onPress={() => router.push('/(patient)/categories')}>
        <View style={styles.flex}>
          <Text variant="title">Browse all treatments</Text>
          <Text variant="caption">Facials, Injectables, Laser & more</Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
      </Pressable>

      {loading && !procedures ? (
        <ActivityIndicator color={colors.gold} style={styles.loader} />
      ) : list.length === 0 ? (
        <EmptyState title="Nothing featured yet" subtitle="Featured treatments will appear here." />
      ) : (
        <>
          <Pressable
            style={styles.hero}
            onPress={() =>
              hero && router.push({ pathname: '/(patient)/procedure/[id]', params: { id: hero.id } })
            }
          >
            <Image source={hero?.image_url || featuredImage} style={styles.fill} contentFit="cover" />
            <View style={styles.heroOverlay} />
            <View style={styles.heroContent}>
              <Text variant="overline" color={colors.goldLight}>
                Featured
              </Text>
              <Text variant="h1" style={styles.heroTitle}>
                {hero?.title ?? 'Signature care'}
              </Text>
            </View>
          </Pressable>

          <SectionHeader title={t('home.trending')} />
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.row}>
            {list.map((item) => (
              <Pressable
                key={item.id}
                style={styles.card}
                onPress={() => router.push({ pathname: '/(patient)/procedure/[id]', params: { id: item.id } })}
              >
                <Image source={item.image_url || procedurePlaceholder} style={styles.cardImg} contentFit="cover" />
                <Text variant="overline" center>
                  {item.title}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  titleRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginTop: spacing.sm, marginBottom: spacing.xl,
  },
  banner: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface,
    borderRadius: radius.md, borderWidth: StyleSheet.hairlineWidth, borderColor: colors.border, padding: spacing.lg,
  },
  loader: { marginTop: spacing.huge },
  hero: { height: 240, borderRadius: radius.lg, overflow: 'hidden', justifyContent: 'flex-end', marginTop: spacing.lg },
  fill: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  heroOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(11,11,13,0.35)' },
  heroContent: { padding: spacing.xl },
  heroTitle: { marginTop: 2 },
  row: { marginHorizontal: -screenPadding, paddingHorizontal: screenPadding },
  card: { width: 120, marginRight: spacing.md },
  cardImg: { width: 120, height: 150, borderRadius: radius.md, marginBottom: spacing.sm },
});
