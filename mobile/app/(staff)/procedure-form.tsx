import { useEffect, useState } from 'react';
import { Alert, Pressable, StyleSheet, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Screen, Text, TextField, Button } from '../../src/components';
import { useTheme } from '../../src/theme/ThemeContext';
import { spacing } from '../../src/theme/spacing';
import { api } from '../../src/api/services';
import { ApiError } from '../../src/api/client';

export default function ProcedureForm() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const router = useRouter();
  const editing = !!id;

  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [duration, setDuration] = useState('');
  const [sessions, setSessions] = useState('');
  const [sessionGap, setSessionGap] = useState('');
  const [features, setFeatures] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [saving, setSaving] = useState(false);
  const { colors } = useTheme();

  // Prefill when editing.
  useEffect(() => {
    if (!id) return;
    api.getProcedures().then((list) => {
      const p = list.find((x) => x.id === id);
      if (!p) return;
      setTitle(p.title ?? '');
      setCategory(p.category ?? '');
      setDescription(p.description ?? '');
      setDuration(p.duration ?? '');
      setSessions(p.sessions ? String(p.sessions) : '');
      setSessionGap(p.session_gap ?? '');
      setFeatures((p.key_features ?? []).join(', '));
      setImageUrl(p.image_url ?? '');
    });
  }, [id]);

  const save = async () => {
    if (!title.trim()) return Alert.alert('Title is required');
    setSaving(true);
    const payload = {
      title: title.trim(),
      category: category.trim() || undefined,
      description: description.trim() || undefined,
      duration: duration.trim() || undefined,
      sessions: sessions ? parseInt(sessions, 10) : undefined,
      session_gap: sessionGap.trim() || undefined,
      key_features: features.split(',').map((f) => f.trim()).filter(Boolean),
      image_url: imageUrl.trim() || undefined,
    };
    try {
      if (editing) await api.updateProcedure(id!, payload);
      else await api.createProcedure(payload);
      router.back();
    } catch (e) {
      Alert.alert('Save failed', e instanceof ApiError ? e.message : 'Please try again.');
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
        <Text variant="h2">{editing ? 'Edit treatment' : 'Add treatment'}</Text>
        <View style={{ width: 24 }} />
      </View>

      <TextField label="Title" value={title} onChangeText={setTitle} placeholder="HydraFacial" />
      <TextField label="Category" value={category} onChangeText={setCategory} placeholder="Facials" />
      <TextField label="Description" value={description} onChangeText={setDescription} placeholder="What it does…" multiline />
      <TextField label="Duration" value={duration} onChangeText={setDuration} placeholder="45 min" />
      <TextField label="Sessions" value={sessions} onChangeText={setSessions} placeholder="3" keyboardType="number-pad" />
      <TextField label="Gap between sessions" value={sessionGap} onChangeText={setSessionGap} placeholder="2 weeks" />
      <TextField label="Key features (comma separated)" value={features} onChangeText={setFeatures} placeholder="Hydration, Glow, No downtime" />
      <TextField label="Image URL (optional)" value={imageUrl} onChangeText={setImageUrl} placeholder="https://…" autoCapitalize="none" />

      <Button title={editing ? 'Save changes' : 'Add treatment'} loading={saving} onPress={save} style={styles.save} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginTop: spacing.sm, marginBottom: spacing.xl,
  },
  save: { marginTop: spacing.md },
});
