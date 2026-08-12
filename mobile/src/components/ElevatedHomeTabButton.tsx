import React from 'react';
import { Platform, Pressable, StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeContext';
import { gradients } from '../theme/colors';
import { shadow } from '../theme';

type Props = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onPress?: (e: any) => void;
  accessibilityState?: { selected?: boolean };
};

const SIZE = 56;

/**
 * The centered "Home" tab button, raised above the glass tab bar as a
 * skeuomorphic gold FAB (gradient + gloss sheen + gold glow) so it reads as
 * the anchor of the bar rather than just another icon — used via a custom
 * `tabBarButton` on both the patient and staff tab layouts.
 */
export function ElevatedHomeTabButton({ onPress, accessibilityState }: Props) {
  const { colors } = useTheme();
  const selected = !!accessibilityState?.selected;

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={accessibilityState}
      hitSlop={10}
      style={styles.wrap}
    >
      <View style={[shadow.glow, styles.ring, { borderColor: colors.background }]}>
        <LinearGradient colors={gradients.gold} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.circle}>
          <LinearGradient
            colors={['rgba(255,255,255,0.5)', 'rgba(255,255,255,0.05)', 'transparent']}
            locations={[0, 0.5, 1]}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
            style={StyleSheet.absoluteFill}
            pointerEvents="none"
          />
          <Ionicons name={selected ? 'home' : 'home-outline'} size={24} color={colors.textInverse} />
        </LinearGradient>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-start',
    top: Platform.select({ ios: -20, default: -22 }),
  },
  ring: {
    width: SIZE + 6,
    height: SIZE + 6,
    borderRadius: (SIZE + 6) / 2,
    borderWidth: 3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  circle: {
    width: SIZE,
    height: SIZE,
    borderRadius: SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
});
