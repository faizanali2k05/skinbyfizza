import React from 'react';
import { Pressable, StyleSheet, View, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../theme/ThemeContext';
import { radius, spacing } from '../theme/spacing';
import { shadow } from '../theme';

type Props = {
  children: React.ReactNode;
  onPress?: () => void;
  style?: ViewStyle;
  padded?: boolean;
  elevated?: boolean;
};

/**
 * Premium glass card: frosted surface + top sheen (glassmorphism) layered over
 * a soft drop shadow (skeuomorphic lift) with a fine light border.
 */
export function Card({ children, onPress, style, padded = true, elevated }: Props) {
  const { colors } = useTheme();

  const content = (
    <View
      style={[
        styles.base,
        elevated ? shadow.card : shadow.soft,
        {
          backgroundColor: colors.surface,
          borderColor: colors.glassBorder,
        },
        padded && styles.padded,
        style,
      ]}
    >
      {/* Frosted top sheen */}
      <LinearGradient
        colors={[colors.glassHighlight, colors.glassTint, 'transparent']}
        locations={[0, 0.15, 0.6]}
        start={{ x: 0.1, y: 0 }}
        end={{ x: 0.1, y: 1 }}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />
      {children}
    </View>
  );

  if (!onPress) return content;
  return (
    <Pressable onPress={onPress} style={({ pressed }) => pressed && styles.pressed}>
      {content}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: radius.xl,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
  },
  padded: { padding: spacing.lg },
  pressed: { opacity: 0.92, transform: [{ scale: 0.99 }] },
});
