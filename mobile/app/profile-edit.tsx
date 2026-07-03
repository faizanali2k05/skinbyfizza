import { useState } from 'react';
import { Alert, Pressable, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Screen, Text, TextField, Button } from '../src/components';
import { useTheme } from '../src/theme/ThemeContext';
import { spacing } from '../src/theme/spacing';
import { useAuth } from '../src/auth/AuthContext';
import { api } from '../src/api/services';
import { ApiError } from '../src/api/client';

export default function ProfileEdit() {
  const router = useRouter();
  const { colors } = useTheme();
  const { user, refreshUser } = useAuth();

  const [fullName, setFullName] = useState(user?.full_name ?? '');
  const [email, setEmail] = useState(user?.email ?? '');
  const [city, setCity] = useState(user?.city ?? '');
  const [saving, setSaving] = useState(false);

  const save = async () => {
    if (!fullName.trim()) return Alert.alert('Name is required');
    setSaving(true);
    try {
      await api.updateProfile({
        full_name: fullName.trim(),
        email: email.trim() || undefined,
        city: city.trim() || undefined,
      });
      await refreshUser();
      router.back();
    } catch (e) {
      Alert.alert('Could not save', e instanceof ApiError ? e.message : 'Please try again.');
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
        <Text variant="h2">Edit profile</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.avatarWrap}>
        <View style={[styles.avatar, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Ionicons name="person-outline" size={32} color={colors.gold} />
        </View>
        <Text variant="caption">{user?.phone_e164}</Text>
      </View>

      <TextField label="Full name" value={fullName} onChangeText={setFullName} leftIcon="person-outline" />
      <TextField
        label="Email"
        value={email}
        onChangeText={setEmail}
        leftIcon="mail-outline"
        autoCapitalize="none"
        keyboardType="email-address"
      />
      <TextField label="City" value={city} onChangeText={setCity} leftIcon="location-outline" />

      <Button title="Save changes" loading={saving} onPress={save} style={styles.save} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginTop: spacing.sm, marginBottom: spacing.xl,
  },
  avatarWrap: { alignItems: 'center', gap: spacing.sm, marginBottom: spacing.xl },
  avatar: {
    width: 72, height: 72, borderRadius: 36, borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center', justifyContent: 'center',
  },
  save: { marginTop: spacing.md },
});
