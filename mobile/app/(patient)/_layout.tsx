import { Tabs } from 'expo-router';
import { StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { fonts } from '../../src/theme/typography';
import { useTheme } from '../../src/theme/ThemeContext';
import { ElevatedHomeTabButton } from '../../src/components';

/** Premium glass bottom nav: frosted blur + fine top border, safe-area aware.
 * Home is centered and raised as a gold FAB — the anchor of the bar. */
export default function PatientTabsLayout() {
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
        name="categories"
        options={{
          title: 'Treatments',
          tabBarIcon: ({ color }) => <Ionicons name="grid-outline" size={20} color={color} />,
        }}
      />
      <Tabs.Screen
        name="ai"
        options={{
          title: 'AI Consult',
          tabBarIcon: ({ color }) => <Ionicons name="sparkles-outline" size={20} color={color} />,
        }}
      />
      <Tabs.Screen
        name="discover"
        options={{
          title: '',
          tabBarAccessibilityLabel: 'Home',
          tabBarButton: (props) => <ElevatedHomeTabButton {...props} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color }) => <Ionicons name="person-outline" size={20} color={color} />,
        }}
      />
      <Tabs.Screen
        name="more"
        options={{
          title: 'More',
          tabBarIcon: ({ color }) => <Ionicons name="ellipsis-horizontal" size={22} color={color} />,
        }}
      />
    </Tabs>
  );
}
