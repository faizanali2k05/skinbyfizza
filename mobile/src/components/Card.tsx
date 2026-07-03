import React from 'react';
import { Pressable, StyleSheet, View, ViewStyle } from 'react-native';
import { colors } from '../theme/colors';
import { radius, spacing } from '../theme/spacing';
import { shadow } from '../theme';

type Props = {
  children: React.ReactNode;
  onPress?: () => void;
  style?: ViewStyle;
  padded?: boolean;
  elevated?: boolean;
};

/** Rounded dark surface card; pressable when onPress is provided. */
export function Card({ children, onPress, style, padded = true, elevated }: Props) {
  const content = (
    <View
      style={[
        styles.card,
        padded && styles.padded,
        elevated && shadow.card,
        style,
      ]}
    >
      {children}
    </View>
  );

  if (!onPress) return content;
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [pressed && styles.pressed]}
    >
      {content}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  padded: { padding: spacing.lg },
  pressed: { opacity: 0.9, transform: [{ scale: 0.995 }] },
});
