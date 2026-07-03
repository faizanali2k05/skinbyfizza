import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  View,
  ViewStyle,
} from 'react-native';
import { Text } from './Text';
import { useTheme } from '../theme/ThemeContext';
import { AppColors } from '../theme/palettes';
import { radius, spacing } from '../theme/spacing';
import { fonts } from '../theme/typography';

type Variant = 'primary' | 'outline' | 'ghost' | 'light';

type Props = {
  title: string;
  onPress?: () => void;
  variant?: Variant;
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  icon?: React.ReactNode;
  style?: ViewStyle;
};

export function Button({
  title,
  onPress,
  variant = 'primary',
  loading,
  disabled,
  fullWidth = true,
  icon,
  style,
}: Props) {
  const { colors } = useTheme();
  const isDisabled = disabled || loading;
  const v = variants(colors)[variant];

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.base,
        { backgroundColor: v.bg, borderColor: v.border },
        fullWidth && styles.fullWidth,
        pressed && !isDisabled && styles.pressed,
        isDisabled && styles.disabled,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={v.fg} />
      ) : (
        <View style={styles.row}>
          {icon ? <View style={styles.icon}>{icon}</View> : null}
          <Text style={[styles.label, { color: v.fg }]}>{title}</Text>
        </View>
      )}
    </Pressable>
  );
}

const variants = (c: AppColors): Record<Variant, { bg: string; fg: string; border: string }> => ({
  primary: { bg: c.gold, fg: c.textInverse, border: c.gold },
  light: { bg: c.white, fg: c.textInverse, border: c.white },
  outline: { bg: 'transparent', fg: c.textPrimary, border: c.border },
  ghost: { bg: 'transparent', fg: c.gold, border: 'transparent' },
});

const styles = StyleSheet.create({
  base: {
    height: 54,
    borderRadius: radius.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
  },
  fullWidth: { alignSelf: 'stretch' },
  row: { flexDirection: 'row', alignItems: 'center' },
  icon: { marginRight: spacing.sm },
  label: { fontFamily: fonts.semiBold, fontSize: 15, letterSpacing: 0.3 },
  pressed: { opacity: 0.85 },
  disabled: { opacity: 0.5 },
});
