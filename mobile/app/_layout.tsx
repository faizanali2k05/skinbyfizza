import { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Stack, useRouter, useSegments } from 'expo-router';
import { useAuth } from '../src/auth/AuthContext';
import * as SplashScreen from 'expo-splash-screen';
import { useFonts } from 'expo-font';
import {
  Outfit_400Regular,
  Outfit_500Medium,
  Outfit_600SemiBold,
  Outfit_700Bold,
} from '@expo-google-fonts/outfit';
import {
  PlusJakartaSans_400Regular,
  PlusJakartaSans_500Medium,
  PlusJakartaSans_600SemiBold,
  PlusJakartaSans_700Bold,
} from '@expo-google-fonts/plus-jakarta-sans';

import { AuthProvider } from '../src/auth/AuthContext';
import { I18nProvider } from '../src/i18n';
import { ThemeProvider, useTheme } from '../src/theme/ThemeContext';
import { ProcedureSheetProvider } from '../src/components';
import { usePushToken } from '../src/hooks/usePushToken';

/** Registers the Expo push token once the user is authenticated. */
function PushRegistrar() {
  usePushToken();
  return null;
}

/**
 * Global route guard: keeps patients out of the staff portal and vice-versa,
 * bounces signed-out users to the welcome screen (so logout always navigates),
 * and sends freshly signed-in users to their role home.
 */
function AuthGate() {
  const { isAuthenticated, initializing, user } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (initializing) return;
    const group = segments[0];
    const inAuth = group === '(auth)';
    const inStaff = group === '(staff)';
    const inPatient = group === '(patient)';
    const isStaff = user?.role === 'doctor' || user?.role === 'manager';

    if (!isAuthenticated) {
      // Staff area is auth-only. The patient area stays open to guests
      // ("Continue as guest"), so we don't bounce unauthenticated users there.
      if (inStaff) router.replace('/(auth)/welcome');
      return;
    }
    // signed in
    if (inAuth) {
      router.replace(isStaff ? '/(staff)/dashboard' : '/(patient)/discover');
    } else if (isStaff && inPatient) {
      router.replace('/(staff)/dashboard'); // admins/managers stay in their portal
    } else if (!isStaff && inStaff) {
      router.replace('/(patient)/discover');
    }
  }, [isAuthenticated, initializing, segments, user, router]);

  return null;
}

/** Themed navigator — reads the active palette for the app chrome. */
function ThemedNavigator() {
  const { colors } = useTheme();
  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: colors.background }}>
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.background },
          animation: 'fade',
        }}
      >
        <Stack.Screen name="index" />
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(patient)" />
        <Stack.Screen name="(staff)" />
        <Stack.Screen name="notifications" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="prescriptions" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="my-appointments" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="profile-edit" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="about" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="staff-chat/[id]" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="staff-procedure-form" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="staff-prescription-form" options={{ animation: 'slide_from_right' }} />
      </Stack>
    </GestureHandlerRootView>
  );
}

SplashScreen.preventAutoHideAsync().catch(() => {});

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Outfit_400Regular,
    Outfit_500Medium,
    Outfit_600SemiBold,
    Outfit_700Bold,
    PlusJakartaSans_400Regular,
    PlusJakartaSans_500Medium,
    PlusJakartaSans_600SemiBold,
    PlusJakartaSans_700Bold,
  });

  useEffect(() => {
    if (fontsLoaded || fontError) SplashScreen.hideAsync().catch(() => {});
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) return null;

  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <I18nProvider>
          <AuthProvider>
            <PushRegistrar />
            <AuthGate />
            <ProcedureSheetProvider>
              <ThemedNavigator />
            </ProcedureSheetProvider>
          </AuthProvider>
        </I18nProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
