import { Tabs } from 'expo-router';
import { Platform, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../src/theme/colors';
import { fonts } from '../../src/theme/typography';
import { useI18n } from '../../src/i18n';

/** Ounass-style minimal bottom nav: small icons + spaced uppercase labels. */
export default function PatientTabsLayout() {
  const { t } = useI18n();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.gold,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: styles.tabBar,
        tabBarLabelStyle: styles.tabLabel,
        tabBarItemStyle: styles.tabItem,
        sceneStyle: { backgroundColor: colors.background },
      }}
    >
      <Tabs.Screen
        name="discover"
        options={{
          title: t('nav.discover'),
          tabBarIcon: ({ color }) => (
            <Ionicons name="compass-outline" size={22} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="categories"
        options={{
          title: t('nav.categories'),
          tabBarIcon: ({ color }) => (
            <Ionicons name="grid-outline" size={20} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="featured"
        options={{
          title: t('nav.featured'),
          tabBarIcon: ({ color }) => (
            <Ionicons name="star-outline" size={20} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="appointments"
        options={{
          title: t('nav.appointments'),
          tabBarIcon: ({ color }) => (
            <Ionicons name="calendar-outline" size={20} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="more"
        options={{
          title: t('nav.more'),
          tabBarIcon: ({ color }) => (
            <Ionicons name="ellipsis-horizontal" size={22} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: colors.backgroundElevated,
    borderTopColor: colors.divider,
    borderTopWidth: StyleSheet.hairlineWidth,
    height: Platform.select({ ios: 86, android: 68, default: 68 }),
    paddingTop: 8,
    paddingBottom: Platform.select({ ios: 28, android: 10, default: 10 }),
  },
  tabItem: { paddingTop: 2 },
  tabLabel: {
    fontFamily: fonts.medium,
    fontSize: 9,
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginTop: 3,
  },
});
