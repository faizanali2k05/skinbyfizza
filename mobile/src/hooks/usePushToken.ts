import { useEffect } from 'react';
import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { useAuth } from '../auth/AuthContext';
import { api } from '../api/services';

/**
 * When signed in on a physical device, request notification permission,
 * fetch the Expo push token and register it with the backend
 * (POST /push/register-token). No-ops on web / simulators / when signed out.
 * Needs an EAS projectId (dev build) to mint a token in production.
 */
export function usePushToken() {
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    if (!isAuthenticated || Platform.OS === 'web' || !Device.isDevice) return;

    (async () => {
      try {
        let { status } = await Notifications.getPermissionsAsync();
        if (status !== 'granted') {
          status = (await Notifications.requestPermissionsAsync()).status;
        }
        if (status !== 'granted') return;

        const projectId =
          (Constants.expoConfig?.extra as { eas?: { projectId?: string } } | undefined)?.eas
            ?.projectId ?? (Constants as { easConfig?: { projectId?: string } }).easConfig?.projectId;

        const { data: token } = await Notifications.getExpoPushTokenAsync(
          projectId ? { projectId } : undefined,
        );
        if (token) await api.registerPushToken(token);
      } catch {
        // token minting requires a dev build + EAS projectId; ignore otherwise
      }
    })();
  }, [isAuthenticated]);
}
