import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Screen, Text, TextField, Button } from '../../src/components';
import { useTheme } from '../../src/theme/ThemeContext';
import { spacing } from '../../src/theme/spacing';
import { useI18n } from '../../src/i18n';
import { useAuth } from '../../src/auth/AuthContext';
import { ApiError } from '../../src/api/client';

export default function SignUp() {
  const { t } = useI18n();
  const router = useRouter();
  const { signUp } = useAuth();
  const { colors } = useTheme();

  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('+92');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async () => {
    if (!fullName.trim() || !phone.trim() || !password) {
      setError('Name, WhatsApp number and password are required.');
      return;
    }
    if (!/^\+\d{8,15}$/.test(phone.replace(/\s/g, ''))) {
      setError('Enter your WhatsApp number with country code, e.g. +92300…');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await signUp({
        full_name: fullName.trim(),
        phone_e164: phone.replace(/\s/g, ''),
        email: email.trim() || undefined,
        password,
      });
      router.replace('/(patient)/discover');
    } catch (e) {
      setError(
        e instanceof ApiError ? e.message : 'Registration failed. Please try again.',
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen scroll padded edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <Pressable onPress={() => router.back()} hitSlop={10} style={styles.back}>
          <Ionicons name="chevron-back" size={24} color={colors.textPrimary} />
        </Pressable>

        <View style={styles.header}>
          <Text variant="h1">{t('auth.createAccount')}</Text>
          <Text variant="body" style={styles.sub}>
            {t('auth.welcomeSubtitle')}
          </Text>
        </View>

        <TextField
          label={t('auth.fullName')}
          placeholder="Aisha Khan"
          leftIcon="person-outline"
          value={fullName}
          onChangeText={setFullName}
        />
        <TextField
          label={t('auth.whatsappNumber')}
          hint={t('auth.countryCodeHint')}
          placeholder="+92 300 1234567"
          keyboardType="phone-pad"
          leftIcon="logo-whatsapp"
          value={phone}
          onChangeText={setPhone}
        />
        <TextField
          label="Email (optional)"
          placeholder="you@email.com"
          autoCapitalize="none"
          keyboardType="email-address"
          leftIcon="mail-outline"
          value={email}
          onChangeText={setEmail}
        />
        <TextField
          label={t('auth.password')}
          placeholder="At least 6 characters"
          secure
          leftIcon="lock-closed-outline"
          value={password}
          onChangeText={setPassword}
        />

        {error ? (
          <Text variant="bodySmall" color={colors.error} style={styles.error}>
            {error}
          </Text>
        ) : null}

        <Button
          title={t('auth.createAccount')}
          loading={loading}
          onPress={onSubmit}
          style={styles.cta}
        />
        <Pressable
          style={styles.footer}
          onPress={() => router.replace('/(auth)/sign-in')}
        >
          <Text variant="bodySmall">{t('auth.haveAccount')} </Text>
          <Text variant="bodySmall" color={colors.gold}>
            {t('auth.signIn')}
          </Text>
        </Pressable>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  back: { marginTop: spacing.sm, marginBottom: spacing.lg, alignSelf: 'flex-start' },
  header: { marginBottom: spacing.xl },
  sub: { marginTop: spacing.xs },
  error: { marginBottom: spacing.md },
  cta: { marginTop: spacing.sm },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingVertical: spacing.xl,
  },
});
