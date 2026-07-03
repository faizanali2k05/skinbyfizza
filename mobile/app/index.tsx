import { View, ActivityIndicator } from 'react-native';
import { Redirect } from 'expo-router';
import { useAuth } from '../src/auth/AuthContext';
import { colors } from '../src/theme/colors';

/** Entry route: decide landing screen by auth state + role once the session restores. */
export default function Index() {
  const { initializing, isAuthenticated, user } = useAuth();

  if (initializing) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color={colors.gold} />
      </View>
    );
  }

  if (!isAuthenticated) return <Redirect href="/(auth)/welcome" />;

  // Staff (doctor / manager) land in the console; patients in the app shell.
  if (user?.role === 'doctor' || user?.role === 'manager') {
    return <Redirect href="/(staff)/dashboard" />;
  }
  return <Redirect href="/(patient)/discover" />;
}
