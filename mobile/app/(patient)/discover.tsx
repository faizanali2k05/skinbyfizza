import { useMemo } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Screen, Text, SectionHeader, EmptyState } from '../../src/components';
import { colors } from '../../src/theme/colors';
import { radius, spacing, screenPadding } from '../../src/theme/spacing';
import { fonts } from '../../src/theme/typography';
import { useI18n } from '../../src/i18n';
import { useAuth } from '../../src/auth/AuthContext';
import { useQuery } from '../../src/hooks/useQuery';
import { api } from '../../src/api/services';
import { heroImage, procedurePlaceholder } from '../../src/data/decor';
import { Procedure } from '../../src/api/types';

export default function Discover() {
  const { t } = useI18n();
  const { user } = useAuth();
  const router = useRouter();
  const { data: procedures, loading, error, refetch } = useQuery(api.getProcedures);

  const greeting = useMemo(() => {
    const h = new Date().getHours();
    if (h < 12) return t('home.goodMorning');
    if (h < 18) return t('home.goodAfternoon');
    return t('home.goodEvening');
  }, [t]);

  const firstName = (user?.full_name ?? 'there').split(' ')[0];
  const list = procedures ?? [];
  const mostWanted = list.slice(0, 2);
  const trending = list.slice(2);

  const openProcedure = (p: Procedure) =>
    router.push({ pathname: '/(patient)/procedure/[id]', params: { id: p.id } });

  return (
    <Screen scroll padded refreshing={loading} onRefresh={refetch}>
      <View style={styles.header}>
        <View style={styles.flex}>
          <Text variant="display">
            {greeting}, {firstName}!
          </Text>
          <Text variant="overline" style={styles.shopLine}>
            Karachi Clinic  ▾
          </Text>
        </View>
        <Pressable
          style={styles.iconBtn}
          hitSlop={8}
          onPress={() => router.push('/(patient)/notifications')}
        >
          <Ionicons name="notifications-outline" size={20} color={colors.textPrimary} />
        </Pressable>
      </View>

      <View style={styles.banner}>
        <Ionicons name="sparkles-outline" size={16} color={colors.gold} />
        <Text variant="overline" color={colors.goldLight} style={styles.bannerText}>
          {t('home.freeConsult')}
        </Text>
      </View>

      {/* Hero */}
      <Pressable style={styles.hero} onPress={() => list[0] && openProcedure(list[0])}>
        <Image source={heroImage} style={styles.fill} contentFit="cover" />
        <View style={styles.heroOverlay} />
        <View style={styles.heroContent}>
          <Text variant="overline" color={colors.goldLight}>
            Skin By Dr. Fizza G
          </Text>
          <Text variant="h1" style={styles.heroTitle}>
            Reveal your glow
          </Text>
          <Text variant="bodySmall" color={colors.textSecondary}>
            Expert dermatology & aesthetic care
          </Text>
        </View>
      </Pressable>

      {/* States */}
      {loading && !procedures ? (
        <ActivityIndicator color={colors.gold} style={styles.loader} />
      ) : error ? (
        <EmptyState
          icon="cloud-offline-outline"
          title="Couldn't load treatments"
          subtitle="Pull down to retry once the backend is live."
        />
      ) : list.length === 0 ? (
        <EmptyState
          title="No treatments yet"
          subtitle="Treatments added by the clinic will appear here."
        />
      ) : (
        <>
          <SectionHeader title={t('home.mostWanted')} />
          <View style={styles.grid}>
            {mostWanted.map((item) => (
              <Pressable key={item.id} style={styles.gridCard} onPress={() => openProcedure(item)}>
                <Image
                  source={item.image_url || procedurePlaceholder}
                  style={styles.gridImg}
                  contentFit="cover"
                />
                <Text variant="title" style={styles.gridTitle}>
                  {item.title}
                </Text>
                <Text variant="caption">{item.category}</Text>
              </Pressable>
            ))}
          </View>

          {trending.length > 0 && (
            <>
              <SectionHeader title={t('home.trending')} />
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.trendRow}>
                {trending.map((item) => (
                  <Pressable key={item.id} style={styles.trendCard} onPress={() => openProcedure(item)}>
                    <Image
                      source={item.image_url || procedurePlaceholder}
                      style={styles.trendImg}
                      contentFit="cover"
                    />
                    <Text variant="label" style={styles.trendTitle}>
                      {item.title}
                    </Text>
                    <Text variant="caption">{item.category}</Text>
                  </Pressable>
                ))}
              </ScrollView>
            </>
          )}
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'flex-start', marginTop: spacing.sm, marginBottom: spacing.lg },
  shopLine: { marginTop: spacing.xs },
  iconBtn: {
    width: 42, height: 42, borderRadius: 21, backgroundColor: colors.surface,
    borderWidth: StyleSheet.hairlineWidth, borderColor: colors.border,
    alignItems: 'center', justifyContent: 'center',
  },
  banner: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    backgroundColor: colors.surfaceMuted, borderRadius: radius.md,
    paddingHorizontal: spacing.lg, paddingVertical: spacing.md,
  },
  bannerText: { letterSpacing: 1 },
  hero: { height: 340, borderRadius: radius.lg, overflow: 'hidden', justifyContent: 'flex-end', marginTop: spacing.xl },
  fill: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  heroOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(11,11,13,0.4)' },
  heroContent: { padding: spacing.xl, gap: 4 },
  heroTitle: { marginVertical: 2 },
  loader: { marginTop: spacing.huge },
  grid: { flexDirection: 'row', gap: spacing.md },
  gridCard: { flex: 1 },
  gridImg: { width: '100%', height: 200, borderRadius: radius.md, marginBottom: spacing.sm },
  gridTitle: { fontFamily: fonts.semiBold },
  trendRow: { marginHorizontal: -screenPadding, paddingHorizontal: screenPadding },
  trendCard: { width: 150, marginRight: spacing.md },
  trendImg: { width: 150, height: 190, borderRadius: radius.md, marginBottom: spacing.sm },
  trendTitle: { marginBottom: 2 },
});
