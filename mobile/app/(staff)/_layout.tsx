import { Tabs } from 'expo-router';
import { StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { fonts } from '../../src/theme/typography';
import { useTheme } from '../../src/theme/ThemeContext';
import { ElevatedHomeTabButton } from '../../src/components';

/** Staff (doctor/manager) portal — same premium glass tab bar as the patient
 * side, with Home centered and raised. Detail/edit screens (chat thread,
 * treatment form, prescription form) live outside this group at the app root
 * so they push as full-screen stack screens instead of becoming extra tabs. */
export default function StaffTabsLayout() {
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.gold,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarBackground: () => (
          <BlurView
            intensity={40}
            tint={isDark ? 'dark' : 'light'}
            style={[StyleSheet.absoluteFill, { backgroundColor: colors.glassTint }]}
          />
        ),
        tabBarStyle: {
          backgroundColor: 'transparent',
          borderTopColor: colors.glassBorder,
          borderTopWidth: StyleSheet.hairlineWidth,
          height: 58 + insets.bottom,
          paddingTop: 8,
          paddingBottom: insets.bottom > 0 ? insets.bottom : 8,
          elevation: 0,
          // The centered Home button is raised above the bar — without this it
          // gets clipped to the bar's bounds on Android.
          overflow: 'visible',
        },
        tabBarLabelStyle: {
          fontFamily: fonts.medium,
          fontSize: 10,
          letterSpacing: 0.2,
          marginTop: 2,
        },
        tabBarItemStyle: { paddingVertical: 2 },
        sceneStyle: { backgroundColor: colors.background },
      }}
    >
      <Tabs.Screen
        name="chats"
        options={{
          title: 'Chats',
          tabBarIcon: ({ color }) => <Ionicons name="chatbubbles-outline" size={20} color={color} />,
        }}
      />
      <Tabs.Screen
        name="users"
        options={{
          title: 'Users',
          tabBarIcon: ({ color }) => <Ionicons name="people-outline" size={20} color={color} />,
        }}
      />
      <Tabs.Screen
        name="dashboard"
        options={{
          title: '',
          tabBarAccessibilityLabel: 'Home',
          tabBarButton: (props) => <ElevatedHomeTabButton {...props} />,
        }}
      />
      <Tabs.Screen
        name="appointments"
        options={{
          title: 'Appointments',
          tabBarIcon: ({ color }) => <Ionicons name="calendar-outline" size={20} color={color} />,
        }}
      />
      <Tabs.Screen
        name="procedures"
        options={{
          title: 'Treatments',
          tabBarIcon: ({ color }) => <Ionicons name="sparkles-outline" size={20} color={color} />,
        }}
      />
    </Tabs>
  );
}
