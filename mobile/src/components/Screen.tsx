import React from 'react';
import {
  ScrollView,
  StyleSheet,
  View,
  ViewStyle,
  RefreshControl,
} from 'react-native';
import { SafeAreaView, Edge } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../theme/ThemeContext';
import { screenPadding } from '../theme/spacing';

type Props = {
  children: React.ReactNode;
  scroll?: boolean;
  padded?: boolean;
  edges?: Edge[];
  style?: ViewStyle;
  contentStyle?: ViewStyle;
  refreshing?: boolean;
  onRefresh?: () => void;
};

/** Themed screen with a soft depth gradient background + safe-area handling. */
export function Screen({
  children,
  scroll = false,
  padded = true,
  edges = ['top'],
  style,
  contentStyle,
  refreshing,
  onRefresh,
}: Props) {
  const { colors, isDark } = useTheme();
  const inner: ViewStyle[] = [
    padded ? { paddingHorizontal: screenPadding } : {},
    contentStyle ?? {},
  ];

  return (
    <View style={[styles.root, { backgroundColor: colors.background }, style]}>
      <LinearGradient
        colors={[colors.backgroundElevated, colors.background, colors.background]}
        locations={[0, 0.4, 1]}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />
      <SafeAreaView style={styles.flex} edges={edges}>
        <StatusBar style={isDark ? 'light' : 'dark'} />
        {scroll ? (
          <ScrollView
            style={styles.flex}
            contentContainerStyle={[styles.scrollContent, ...inner]}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            refreshControl={
              onRefresh ? (
                <RefreshControl
                  refreshing={!!refreshing}
                  onRefresh={onRefresh}
                  tintColor={colors.gold}
                />
              ) : undefined
            }
          >
            {children}
          </ScrollView>
        ) : (
          <View style={[styles.flex, ...inner]}>{children}</View>
        )}
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  flex: { flex: 1 },
  scrollContent: { flexGrow: 1, paddingBottom: 40 },
});
