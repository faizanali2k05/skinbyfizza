import { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useFonts } from 'expo-font';
import {
  PlayfairDisplay_400Regular,
  PlayfairDisplay_500Medium,
  PlayfairDisplay_600SemiBold,
  PlayfairDisplay_700Bold,
} from '@expo-google-fonts/playfair-display';
import {
  Poppins_400Regular,
  Poppins_500Medium,
  Poppins_600SemiBold,
  Poppins_700Bold,
} from '@expo-google-fonts/poppins';

import { AuthProvider } from '../src/auth/AuthContext';
import { I18nProvider } from '../src/i18n';
import { usePushToken } from '../src/hooks/usePushToken';
import { colors } from '../src/theme/colors';

/** Registers the Expo push token once the user is authenticated. */
function PushRegistrar() {
  usePushToken();
  return null;
}

SplashScreen.preventAutoHideAsync().catch(() => {});

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    PlayfairDisplay_400Regular,
    PlayfairDisplay_500Medium,
    PlayfairDisplay_600SemiBold,
    PlayfairDisplay_700Bold,
    Poppins_400Regular,
    Poppins_500Medium,
    Poppins_600SemiBold,
    Poppins_700Bold,
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: colors.background }}>
      <SafeAreaProvider>
        <I18nProvider>
          <AuthProvider>
            <PushRegistrar />
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
              <Stack.Screen name="chat" options={{ animation: 'slide_from_bottom' }} />
              <Stack.Screen name="notifications" options={{ animation: 'slide_from_right' }} />
              <Stack.Screen name="prescriptions" options={{ animation: 'slide_from_right' }} />
              <Stack.Screen name="procedure/[id]" options={{ animation: 'slide_from_right' }} />
              <Stack.Screen name="book/[id]" options={{ animation: 'slide_from_right' }} />
            </Stack>
          </AuthProvider>
        </I18nProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
