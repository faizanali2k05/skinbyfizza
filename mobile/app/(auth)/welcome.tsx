import { ImageBackground, StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Text, Button } from '../../src/components';
import { colors, gradients } from '../../src/theme/colors';
import { spacing, screenPadding } from '../../src/theme/spacing';
import { useI18n } from '../../src/i18n';

export default function Welcome() {
  const { t } = useI18n();
  const router = useRouter();

  return (
    <View style={styles.root}>
      <StatusBar style="light" />
      <ImageBackground
        source={{
          uri: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&w=1000&q=70',
        }}
        style={styles.bg}
      >
        <LinearGradient
          colors={gradients.fadeUp}
          locations={[0, 0.5, 1]}
          style={StyleSheet.absoluteFill}
        />
        <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
          <View style={styles.top}>
            <Text variant="overline" color={colors.goldLight}>
              Skin By Dr. Fizza G
            </Text>
          </View>

          <View style={styles.bottom}>
            <Text variant="display" style={styles.title}>
              {t('auth.welcomeTitle')}
            </Text>
            <Text variant="body" style={styles.subtitle}>
              {t('auth.welcomeSubtitle')}
            </Text>

            <Button
              title={t('auth.createAccount')}
              onPress={() => router.push('/(auth)/sign-up')}
              style={styles.cta}
            />
            <Button
              title={t('auth.signIn')}
              variant="outline"
              onPress={() => router.push('/(auth)/sign-in')}
              style={styles.cta}
            />
            <Button
              title="Continue as guest"
              variant="ghost"
              onPress={() => router.replace('/(patient)/discover')}
            />
          </View>
        </SafeAreaView>
      </ImageBackground>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  bg: { flex: 1 },
  safe: { flex: 1, paddingHorizontal: screenPadding },
  top: { paddingTop: spacing.lg },
  bottom: { flex: 1, justifyContent: 'flex-end', paddingBottom: spacing.xl },
  title: { fontSize: 38, lineHeight: 44 },
  subtitle: { marginTop: spacing.sm, marginBottom: spacing.xxl },
  cta: { marginBottom: spacing.md },
});
