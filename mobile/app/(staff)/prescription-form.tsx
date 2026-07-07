import { useState } from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Screen, Text, TextField, Button, Card, EmptyState } from '../../src/components';
import { useTheme } from '../../src/theme/ThemeContext';
import { spacing } from '../../src/theme/spacing';
import { useQuery } from '../../src/hooks/useQuery';
import { api } from '../../src/api/services';
import { ApiError } from '../../src/api/client';

export default function PrescriptionForm() {
  const { user_id, name } = useLocalSearchParams<{ user_id: string; name?: string }>();
  const router = useRouter();
  const { colors } = useTheme();

  const { data, loading, refetch, setData } = useQuery(() => api.getPrescriptions(user_id), [user_id]);
  const items = data ?? [];

  const [item, setItem] = useState('');
  const [price, setPrice] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  // Doctor instructions (team-facing vs doctor's own notes) — per PRD.
  const {
    data: instr,
    setData: setInstr,
  } = useQuery(() => api.getInstructions(user_id!), [user_id]);
  const [audience, setAudience] = useState<'team' | 'doctor'>('team');
  const [instrBody, setInstrBody] = useState('');
  const [savingInstr, setSavingInstr] = useState(false);

  const addInstruction = async () => {
    if (!instrBody.trim()) return Alert.alert('Write the instruction first');
    setSavingInstr(true);
    try {
      const res = await api.addInstruction({ user_id: user_id!, audience, body: instrBody.trim() });
      setInstr((list) => [res.instruction, ...(list ?? [])]);
      setInstrBody('');
    } catch {
      Alert.alert('Could not save the instruction');
    } finally {
      setSavingInstr(false);
    }
  };

  const add = async () => {
    if (!item.trim()) return Alert.alert('Enter a product or service name');
    setSaving(true);
    try {
      const res = await api.createPrescription({
        user_id: user_id!,
        item_name: item.trim(),
        price: price ? Number(price) : undefined,
        notes: notes.trim() || undefined,
      });
      setData((list) => [res.prescription, ...(list ?? [])]); // optimistic add
      setItem('');
      setPrice('');
      setNotes('');
    } catch (e) {
      Alert.alert('Could not add', e instanceof ApiError ? e.message : 'Please try again.');
      refetch();
    } finally {
      setSaving(false);
    }
  };

  return (
    <Screen scroll padded edges={['top']}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={10}>
          <Ionicons name="chevron-back" size={24} color={colors.textPrimary} />
        </Pressable>
        <Text variant="h2">Prescription</Text>
        <View style={{ width: 24 }} />
      </View>

      <Text variant="caption" style={styles.for}>For {name ?? 'patient'}</Text>

      <Card style={styles.form} padded>
        <TextField label="Product or service" value={item} onChangeText={setItem} placeholder="e.g. Botox, Vitamin C serum" />
        <TextField label="Price (Rs)" value={price} onChangeText={setPrice} keyboardType="number-pad" placeholder="Optional" />
        <TextField label="Notes" value={notes} onChangeText={setNotes} placeholder="Directions / remarks" multiline />
        <Button title="Add prescription" loading={saving} onPress={add} />
      </Card>

      {/* Doctor instructions — team-facing vs private notes */}
      <Text variant="h3" style={styles.section}>Instructions</Text>
      <Card style={styles.form} padded>
        <View style={styles.audienceRow}>
          {(['team', 'doctor'] as const).map((a) => (
            <Pressable
              key={a}
              onPress={() => setAudience(a)}
              style={[styles.audChip, audience === a && { backgroundColor: colors.gold, borderColor: colors.gold }]}
            >
              <Text variant="label" color={audience === a ? colors.textInverse : colors.textSecondary}>
                {a === 'team' ? 'For team' : 'My notes'}
              </Text>
            </Pressable>
          ))}
        </View>
        <TextField
          label={audience === 'team' ? 'Instruction for the team' : 'Private note (only you)'}
          value={instrBody}
          onChangeText={setInstrBody}
          multiline
          placeholder="Write the instruction…"
        />
        <Button title="Save instruction" loading={savingInstr} onPress={addInstruction} variant="outline" />
      </Card>
      {(instr ?? []).map((i) => (
        <Card key={i.id} style={styles.card} padded>
          <View style={styles.row}>
            <Ionicons
              name={i.audience === 'team' ? 'people-outline' : 'lock-closed-outline'}
              size={16}
              color={colors.gold}
            />
            <View style={styles.flex}>
              <Text variant="bodySmall" color={colors.textPrimary}>{i.body}</Text>
              <Text variant="caption">{i.audience === 'team' ? 'Team' : 'Private'} · {new Date(i.created_at).toLocaleDateString()}</Text>
            </View>
          </View>
        </Card>
      ))}

      <Text variant="h3" style={styles.section}>Existing</Text>
      {loading && !data ? (
        <ActivityIndicator color={colors.gold} style={{ marginTop: spacing.xl }} />
      ) : items.length === 0 ? (
        <EmptyState icon="medkit-outline" title="No prescriptions yet" />
      ) : (
        items.map((rx) => (
          <Card key={rx.id} style={styles.card} padded>
            <View style={styles.row}>
              <View style={styles.flex}>
                <Text variant="title">{rx.item_name}</Text>
                {rx.notes ? <Text variant="bodySmall">{rx.notes}</Text> : null}
              </View>
              {rx.price != null ? <Text variant="h3" color={colors.gold}>Rs {rx.price}</Text> : null}
            </View>
          </Card>
        ))
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginTop: spacing.sm, marginBottom: spacing.md,
  },
  for: { marginBottom: spacing.lg },
  form: { marginBottom: spacing.xl },
  section: { marginBottom: spacing.md, marginTop: spacing.sm },
  audienceRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.lg },
  audChip: {
    paddingHorizontal: spacing.lg, paddingVertical: spacing.sm, borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth, borderColor: 'rgba(128,128,128,0.35)',
  },
  card: { marginBottom: spacing.md },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  flex: { flex: 1 },
});
