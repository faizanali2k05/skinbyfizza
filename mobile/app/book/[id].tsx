import { useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Screen, Text, Button, Card } from '../../src/components';
import { colors } from '../../src/theme/colors';
import { radius, spacing } from '../../src/theme/spacing';
import { fonts } from '../../src/theme/typography';
import { useQuery } from '../../src/hooks/useQuery';
import { api } from '../../src/api/services';
import { ApiError } from '../../src/api/client';

const TIMES = ['11:00', '13:00', '15:00', '17:00'];
const CITIES = ['Karachi'];

function nextDays(n: number) {
  const out: Date[] = [];
  const base = new Date();
  for (let i = 1; i <= n; i++) {
    const d = new Date(base);
    d.setDate(base.getDate() + i);
    out.push(d);
  }
  return out;
}

export default function BookScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { data } = useQuery(api.getProcedures);
  const procedure = (data ?? []).find((p) => p.id === id);

  const days = useMemo(() => nextDays(7), []);
  const [day, setDay] = useState<Date>(days[0]);
  const [time, setTime] = useState<string>(TIMES[0]);
  const [city, setCity] = useState<string>(CITIES[0]);
  const [submitting, setSubmitting] = useState(false);

  const confirm = async () => {
    const [h, m] = time.split(':').map(Number);
    const when = new Date(day);
    when.setHours(h, m, 0, 0);
    setSubmitting(true);
    try {
      await api.bookAppointment({
        procedure_id: id!,
        scheduled_at: when.toISOString(),
        city,
      });
      Alert.alert('Requested', 'Your appointment request was sent. The clinic will confirm shortly.', [
        { text: 'OK', onPress: () => router.replace('/(patient)/appointments') },
      ]);
    } catch (e) {
      Alert.alert('Booking failed', e instanceof ApiError ? e.message : 'Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Screen scroll padded edges={['top']}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={10}>
          <Ionicons name="chevron-back" size={24} color={colors.textPrimary} />
        </Pressable>
        <Text variant="h2">Book</Text>
        <View style={{ width: 24 }} />
      </View>

      <Card style={styles.summary} padded>
        <Text variant="caption">Treatment</Text>
        <Text variant="h3">{procedure?.title ?? 'Treatment'}</Text>
      </Card>

      <Text variant="overline" style={styles.label}>Select a day</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.dayRow}>
        {days.map((d) => {
          const active = d.toDateString() === day.toDateString();
          return (
            <Pressable key={d.toISOString()} onPress={() => setDay(d)} style={[styles.dayCard, active && styles.activeCard]}>
              <Text style={[styles.dayName, active && styles.activeText]}>
                {d.toLocaleDateString(undefined, { weekday: 'short' })}
              </Text>
              <Text style={[styles.dayNum, active && styles.activeText]}>{d.getDate()}</Text>
              <Text style={[styles.dayMon, active && styles.activeText]}>
                {d.toLocaleDateString(undefined, { month: 'short' })}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      <Text variant="overline" style={styles.label}>Select a time</Text>
      <View style={styles.chips}>
        {TIMES.map((tm) => {
          const active = tm === time;
          return (
            <Pressable key={tm} onPress={() => setTime(tm)} style={[styles.chip, active && styles.activeCard]}>
              <Text style={[styles.chipText, active && styles.activeText]}>{tm}</Text>
            </Pressable>
          );
        })}
      </View>

      <Text variant="overline" style={styles.label}>City</Text>
      <View style={styles.chips}>
        {CITIES.map((c) => {
          const active = c === city;
          return (
            <Pressable key={c} onPress={() => setCity(c)} style={[styles.chip, active && styles.activeCard]}>
              <Text style={[styles.chipText, active && styles.activeText]}>{c}</Text>
            </Pressable>
          );
        })}
      </View>

      <Button title="Request appointment" loading={submitting} onPress={confirm} style={styles.cta} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginTop: spacing.sm, marginBottom: spacing.xl,
  },
  summary: { marginBottom: spacing.lg },
  label: { marginTop: spacing.lg, marginBottom: spacing.md },
  dayRow: { flexDirection: 'row' },
  dayCard: {
    width: 64, alignItems: 'center', paddingVertical: spacing.md, marginRight: spacing.sm,
    borderRadius: radius.md, borderWidth: StyleSheet.hairlineWidth, borderColor: colors.border, backgroundColor: colors.surface,
  },
  activeCard: { backgroundColor: colors.gold, borderColor: colors.gold },
  activeText: { color: colors.textInverse },
  dayName: { fontFamily: fonts.medium, fontSize: 11, color: colors.textMuted },
  dayNum: { fontFamily: fonts.semiBold, fontSize: 18, color: colors.textPrimary, marginVertical: 2 },
  dayMon: { fontFamily: fonts.regular, fontSize: 11, color: colors.textMuted },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  chip: {
    paddingHorizontal: spacing.lg, paddingVertical: spacing.md, borderRadius: radius.pill,
    borderWidth: StyleSheet.hairlineWidth, borderColor: colors.border, backgroundColor: colors.surface,
  },
  chipText: { fontFamily: fonts.medium, fontSize: 14, color: colors.textSecondary },
  cta: { marginTop: spacing.xxl },
});
