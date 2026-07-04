import { useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Screen, Text, TextField, Button } from '../../src/components';
import { useTheme, useThemedStyles } from '../../src/theme/ThemeContext';
import { AppColors } from '../../src/theme/palettes';
import { radius, spacing } from '../../src/theme/spacing';
import { fonts } from '../../src/theme/typography';
import { useAuth } from '../../src/auth/AuthContext';
import { useQuery } from '../../src/hooks/useQuery';
import { api } from '../../src/api/services';
import { ApiError } from '../../src/api/client';

const TIMES = ['11:00', '13:00', '15:00', '17:00'];
const CITIES = ['Karachi'];
const CONCERNS = ['Breakouts / acne', 'Blackheads / whiteheads', 'Excessive oil / shine', 'Dryness', 'Pigmentation', 'Fine lines', 'Redness / sensitivity'];
const STEPS = ['Your details', 'Skin care', 'Medical & consent', 'Appointment'];

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

type Form = Record<string, string>;

export default function BookScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const { user } = useAuth();
  const { data } = useQuery(api.getProcedures);
  const procedures = data ?? [];
  const preselected = id && id !== 'new' ? id : undefined;
  const [procId, setProcId] = useState<string | undefined>(preselected);
  const procedure = procedures.find((p) => p.id === procId);

  const days = useMemo(() => nextDays(7), []);
  const [step, setStep] = useState(0);
  const [f, setF] = useState<Form>({
    name: user?.full_name ?? '',
    phone: user?.phone_e164 ?? '',
    email: user?.email ?? '',
    signature: user?.full_name ?? '',
  });
  const [concerns, setConcerns] = useState<string[]>([]);
  const [agreed, setAgreed] = useState(false);
  const [day, setDay] = useState<Date>(days[0]);
  const [time, setTime] = useState(TIMES[0]);
  const [city, setCity] = useState(CITIES[0]);
  const [submitting, setSubmitting] = useState(false);

  const set = (k: string) => (v: string) => setF((prev) => ({ ...prev, [k]: v }));
  const toggleConcern = (c: string) =>
    setConcerns((prev) => (prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c]));

  const next = () => {
    if (step === 0 && !procId) return Alert.alert('Please select a treatment first');
    if (step === 0 && !f.name?.trim()) return Alert.alert('Please enter your name');
    if (step === 2 && !agreed) return Alert.alert('Please accept the consent to continue');
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  };
  const back = () => (step === 0 ? router.back() : setStep((s) => s - 1));

  const confirm = async () => {
    const [h, m] = time.split(':').map(Number);
    const when = new Date(day);
    when.setHours(h, m, 0, 0);
    setSubmitting(true);
    try {
      await api.bookAppointment({
        procedure_id: procId,
        scheduled_at: when.toISOString(),
        city,
        consultation: {
          full_name: f.name,
          date_of_birth: f.dob || undefined,
          address: f.address,
          phone: f.phone,
          email: f.email,
          referred_by: f.referredBy,
          main_goal: f.mainGoal,
          signature: f.signature,
          agreed,
          form: {
            facial_before: f.facialBefore, facial_when: f.facialWhen,
            skin_concerns: f.skinConcerns, retinoids: f.retinoids, retinoids_recent: f.retinoidsRecent,
            peels_laser: f.peels, acne_medicine: f.acne, acne_which: f.acneWhich,
            products: {
              cleanser: f.cleanser, toner: f.toner, day_moisturizer: f.dayMoist, spf: f.spf,
              exfoliator: f.exfoliator, mask: f.mask, eye: f.eye, night_moisturizer: f.nightMoist, other: f.otherProduct,
            },
            areas_of_concern: concerns,
            medical_procedures: f.medProcedures, allergies: f.allergies, medications: f.medications,
          },
        },
      });
      Alert.alert('Requested', 'Your consultation & appointment request was sent. The clinic will confirm shortly.', [
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
      {/* Header + progress */}
      <View style={styles.header}>
        <Pressable onPress={back} hitSlop={10}>
          <Ionicons name="chevron-back" size={24} color={colors.textPrimary} />
        </Pressable>
        <Text variant="h3">{STEPS[step]}</Text>
        <Text variant="overline" color={colors.textMuted}>{step + 1}/{STEPS.length}</Text>
      </View>
      <View style={styles.progress}>
        {STEPS.map((_, i) => (
          <View key={i} style={[styles.progressBar, { backgroundColor: i <= step ? colors.gold : colors.surfaceHigh }]} />
        ))}
      </View>

      {procedure ? (
        <Text variant="caption" style={styles.treatment}>Treatment · {procedure.title}</Text>
      ) : null}

      {/* STEP 0 — personal */}
      {step === 0 && (
        <View>
          {!preselected && (
            <>
              <Text variant="overline" style={styles.pickLabel}>Select a treatment</Text>
              <View style={styles.chips}>
                {procedures.map((p) => (
                  <Pressable key={p.id} onPress={() => setProcId(p.id)} style={[styles.chip, procId === p.id && styles.activeCard]}>
                    <Text style={[styles.chipText, procId === p.id && styles.activeText]}>{p.title}</Text>
                  </Pressable>
                ))}
              </View>
            </>
          )}
          <TextField label="Full name" value={f.name} onChangeText={set('name')} />
          <TextField label="Date of birth" value={f.dob} onChangeText={set('dob')} placeholder="YYYY-MM-DD" />
          <TextField label="Address" value={f.address} onChangeText={set('address')} />
          <TextField label="Phone number" value={f.phone} onChangeText={set('phone')} keyboardType="phone-pad" />
          <TextField label="Email" value={f.email} onChangeText={set('email')} autoCapitalize="none" keyboardType="email-address" />
          <TextField label="Referred by" value={f.referredBy} onChangeText={set('referredBy')} />
          <TextField label="Main goal for today's treatment" value={f.mainGoal} onChangeText={set('mainGoal')} multiline />
        </View>
      )}

      {/* STEP 1 — skin care */}
      {step === 1 && (
        <View>
          <Text variant="caption" style={styles.note}>
            We treat according to the info you provide — if unsure, please leave blank.
          </Text>
          <TextField label="Have you had a facial before? (when)" value={f.facialBefore} onChangeText={set('facialBefore')} placeholder="No / Yes — when" />
          <TextField label="Any special skin problems or concerns?" value={f.skinConcerns} onChangeText={set('skinConcerns')} placeholder="No / please specify" multiline />
          <TextField label="Use Retin-A / Renova / AHA / Retinol?" value={f.retinoids} onChangeText={set('retinoids')} placeholder="No / please specify" />
          <TextField label="Used in the last 3 months? (how long ago)" value={f.retinoidsRecent} onChangeText={set('retinoidsRecent')} />
          <TextField label="Had chemical peels / laser / microdermabrasion?" value={f.peels} onChangeText={set('peels')} placeholder="No / Yes — when" />
          <TextField label="Used any acne medicine?" value={f.acne} onChangeText={set('acne')} placeholder="No / Yes — when" />
          <TextField label="Which acne drug?" value={f.acneWhich} onChangeText={set('acneWhich')} />

          <Text variant="overline" style={styles.section}>Current products (brand if known)</Text>
          <TextField label="Cleanser" value={f.cleanser} onChangeText={set('cleanser')} />
          <TextField label="Toner" value={f.toner} onChangeText={set('toner')} />
          <TextField label="Day moisturizer" value={f.dayMoist} onChangeText={set('dayMoist')} />
          <TextField label="SPF" value={f.spf} onChangeText={set('spf')} />
          <TextField label="Exfoliator / scrub" value={f.exfoliator} onChangeText={set('exfoliator')} />
          <TextField label="Mask" value={f.mask} onChangeText={set('mask')} />
          <TextField label="Eye product" value={f.eye} onChangeText={set('eye')} />
          <TextField label="Night moisturizer" value={f.nightMoist} onChangeText={set('nightMoist')} />
          <TextField label="Other" value={f.otherProduct} onChangeText={set('otherProduct')} />

          <Text variant="overline" style={styles.section}>Areas of concern</Text>
          <View style={styles.checks}>
            {CONCERNS.map((c) => {
              const on = concerns.includes(c);
              return (
                <Pressable key={c} style={[styles.check, on && { backgroundColor: colors.gold, borderColor: colors.gold }]} onPress={() => toggleConcern(c)}>
                  <Ionicons name={on ? 'checkmark-circle' : 'ellipse-outline'} size={16} color={on ? colors.textInverse : colors.textMuted} />
                  <Text style={[styles.checkText, { color: on ? colors.textInverse : colors.textSecondary }]}>{c}</Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      )}

      {/* STEP 2 — medical + consent */}
      {step === 2 && (
        <View>
          <TextField label="Any medical procedures (laser, Botox, fillers…)? Details" value={f.medProcedures} onChangeText={set('medProcedures')} placeholder="No / details" multiline />
          <TextField label="Any allergies or medical conditions?" value={f.allergies} onChangeText={set('allergies')} multiline />
          <TextField label="Are you on any medication right now?" value={f.medications} onChangeText={set('medications')} multiline />

          <Text variant="caption" style={styles.consent}>
            By signing below I confirm the information is true to the best of my knowledge. Neither
            Dr. Fizza Gul nor FMC clinic are liable for the treatments/procedures, which you undertake
            at your own will and risk.
          </Text>
          <TextField label="Signature (type your full name)" value={f.signature} onChangeText={set('signature')} />
          <Pressable style={styles.agree} onPress={() => setAgreed((a) => !a)}>
            <Ionicons name={agreed ? 'checkbox' : 'square-outline'} size={22} color={agreed ? colors.gold : colors.textMuted} />
            <Text variant="bodySmall" color={colors.textPrimary} style={styles.flex}>
              I agree to the terms & conditions and have provided accurate information.
            </Text>
          </Pressable>
        </View>
      )}

      {/* STEP 3 — appointment slot */}
      {step === 3 && (
        <View>
          <Text variant="overline" style={styles.section}>Select a day</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.dayRow}>
            {days.map((d) => {
              const active = d.toDateString() === day.toDateString();
              return (
                <Pressable key={d.toISOString()} onPress={() => setDay(d)} style={[styles.dayCard, active && styles.activeCard]}>
                  <Text style={[styles.dayName, active && styles.activeText]}>{d.toLocaleDateString(undefined, { weekday: 'short' })}</Text>
                  <Text style={[styles.dayNum, active && styles.activeText]}>{d.getDate()}</Text>
                  <Text style={[styles.dayMon, active && styles.activeText]}>{d.toLocaleDateString(undefined, { month: 'short' })}</Text>
                </Pressable>
              );
            })}
          </ScrollView>

          <Text variant="overline" style={styles.section}>Select a time</Text>
          <View style={styles.chips}>
            {TIMES.map((tm) => (
              <Pressable key={tm} onPress={() => setTime(tm)} style={[styles.chip, tm === time && styles.activeCard]}>
                <Text style={[styles.chipText, tm === time && styles.activeText]}>{tm}</Text>
              </Pressable>
            ))}
          </View>

          <Text variant="overline" style={styles.section}>City</Text>
          <View style={styles.chips}>
            {CITIES.map((c) => (
              <Pressable key={c} onPress={() => setCity(c)} style={[styles.chip, c === city && styles.activeCard]}>
                <Text style={[styles.chipText, c === city && styles.activeText]}>{c}</Text>
              </Pressable>
            ))}
          </View>
        </View>
      )}

      {step < STEPS.length - 1 ? (
        <Button title="Next" onPress={next} style={styles.cta} />
      ) : (
        <Button title="Confirm booking" loading={submitting} onPress={confirm} style={styles.cta} />
      )}
    </Screen>
  );
}

const makeStyles = (c: AppColors) =>
  StyleSheet.create({
    flex: { flex: 1 },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: spacing.sm, marginBottom: spacing.md },
    progress: { flexDirection: 'row', gap: spacing.xs, marginBottom: spacing.lg },
    progressBar: { flex: 1, height: 4, borderRadius: 2 },
    treatment: { marginBottom: spacing.lg },
    pickLabel: { marginBottom: spacing.md },
    note: { marginBottom: spacing.lg },
    section: { marginTop: spacing.lg, marginBottom: spacing.md },
    consent: { marginTop: spacing.lg, marginBottom: spacing.md },
    checks: { gap: spacing.sm },
    check: {
      flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingHorizontal: spacing.lg, paddingVertical: spacing.md,
      borderRadius: radius.md, borderWidth: StyleSheet.hairlineWidth, borderColor: c.border, backgroundColor: c.surface,
    },
    checkText: { fontFamily: fonts.medium, fontSize: 14 },
    agree: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginTop: spacing.md },
    dayRow: { flexDirection: 'row' },
    dayCard: {
      width: 64, alignItems: 'center', paddingVertical: spacing.md, marginRight: spacing.sm,
      borderRadius: radius.md, borderWidth: StyleSheet.hairlineWidth, borderColor: c.border, backgroundColor: c.surface,
    },
    activeCard: { backgroundColor: c.gold, borderColor: c.gold },
    activeText: { color: c.textInverse },
    dayName: { fontFamily: fonts.medium, fontSize: 11, color: c.textMuted },
    dayNum: { fontFamily: fonts.semiBold, fontSize: 18, color: c.textPrimary, marginVertical: 2 },
    dayMon: { fontFamily: fonts.regular, fontSize: 11, color: c.textMuted },
    chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
    chip: {
      paddingHorizontal: spacing.lg, paddingVertical: spacing.md, borderRadius: radius.pill,
      borderWidth: StyleSheet.hairlineWidth, borderColor: c.border, backgroundColor: c.surface,
    },
    chipText: { fontFamily: fonts.medium, fontSize: 14, color: c.textSecondary },
    cta: { marginTop: spacing.xxl },
  });
