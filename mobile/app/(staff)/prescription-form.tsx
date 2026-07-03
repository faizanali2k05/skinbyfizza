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
  section: { marginBottom: spacing.md },
  card: { marginBottom: spacing.md },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  flex: { flex: 1 },
});
