import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Screen, Text, TextField, Button } from '../../src/components';
import { colors } from '../../src/theme/colors';
import { spacing } from '../../src/theme/spacing';
import { useI18n } from '../../src/i18n';
import { useAuth } from '../../src/auth/AuthContext';
import { ApiError } from '../../src/api/client';

export default function SignIn() {
  const { t } = useI18n();
  const router = useRouter();
  const { signIn } = useAuth();

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async () => {
    if (!identifier.trim() || !password) {
      setError('Please enter your credentials.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await signIn(identifier, password);
      router.replace('/(patient)/discover');
    } catch (e) {
      setError(
        e instanceof ApiError ? e.message : 'Sign in failed. Please try again.',
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen padded edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <Pressable onPress={() => router.back()} hitSlop={10} style={styles.back}>
          <Ionicons name="chevron-back" size={24} color={colors.textPrimary} />
        </Pressable>

        <View style={styles.header}>
          <Text variant="h1">{t('auth.signIn')}</Text>
          <Text variant="body" style={styles.sub}>
            {t('auth.forFasterCheckout')}
          </Text>
        </View>

        <TextField
          label={t('auth.emailOrPhone')}
          placeholder="you@email.com  /  +92 3xx xxxxxxx"
          autoCapitalize="none"
          keyboardType="email-address"
          leftIcon="person-outline"
          value={identifier}
          onChangeText={setIdentifier}
        />
        <TextField
          label={t('auth.password')}
          placeholder="••••••••"
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

        <Pressable hitSlop={8} style={styles.forgot}>
          <Text variant="bodySmall" color={colors.gold}>
            {t('auth.forgotPassword')}
          </Text>
        </Pressable>

        <View style={styles.flex} />

        <Button title={t('auth.signIn')} loading={loading} onPress={onSubmit} />
        <Pressable
          style={styles.footer}
          onPress={() => router.replace('/(auth)/sign-up')}
        >
          <Text variant="bodySmall">{t('auth.noAccount')} </Text>
          <Text variant="bodySmall" color={colors.gold}>
            {t('auth.register')}
          </Text>
        </Pressable>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  back: { marginTop: spacing.sm, marginBottom: spacing.lg, alignSelf: 'flex-start' },
  header: { marginBottom: spacing.xxl },
  sub: { marginTop: spacing.xs },
  error: { marginBottom: spacing.md },
  forgot: { alignSelf: 'flex-start' },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingVertical: spacing.xl,
  },
});
