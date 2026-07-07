import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  View,
  ViewStyle,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Text } from './Text';
import { useTheme } from '../theme/ThemeContext';
import { AppColors } from '../theme/palettes';
import { gradients } from '../theme/colors';
import { radius, spacing } from '../theme/spacing';
import { fonts } from '../theme/typography';
import { shadow } from '../theme';

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

  const inner = (fg: string) =>
    loading ? (
      <ActivityIndicator color={fg} />
    ) : (
      <View style={styles.row}>
        {icon ? <View style={styles.icon}>{icon}</View> : null}
        <Text style={[styles.label, { color: fg }]}>{title}</Text>
      </View>
    );

  // Skeuomorphic primary — gold gradient + glossy top sheen + gold glow.
  if (variant === 'primary') {
    return (
      <Pressable
        onPress={onPress}
        disabled={isDisabled}
        style={({ pressed }) => [
          shadow.glow,
          fullWidth && styles.fullWidth,
          pressed && !isDisabled && styles.pressed,
          isDisabled && styles.disabled,
          style,
        ]}
      >
        <LinearGradient
          colors={gradients.gold}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.base}
        >
          <LinearGradient
            colors={['rgba(255,255,255,0.45)', 'rgba(255,255,255,0.05)', 'transparent']}
            locations={[0, 0.5, 1]}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
            style={StyleSheet.absoluteFill}
            pointerEvents="none"
          />
          {inner(colors.textInverse)}
        </LinearGradient>
      </Pressable>
    );
  }

  const v = variants(colors)[variant as Exclude<Variant, 'primary'>];
  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.base,
        styles.bordered,
        { backgroundColor: v.bg, borderColor: v.border },
        fullWidth && styles.fullWidth,
        pressed && !isDisabled && styles.pressed,
        isDisabled && styles.disabled,
        style,
      ]}
    >
      {inner(v.fg)}
    </Pressable>
  );
}

const variants = (c: AppColors): Record<Exclude<Variant, 'primary'>, { bg: string; fg: string; border: string }> => ({
  light: { bg: c.white, fg: c.textInverse, border: c.white },
  outline: { bg: c.glassTint, fg: c.textPrimary, border: c.glassBorder },
  ghost: { bg: 'transparent', fg: c.gold, border: 'transparent' },
});

const styles = StyleSheet.create({
  base: {
    height: 56,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
    overflow: 'hidden',
  },
  bordered: { borderWidth: StyleSheet.hairlineWidth },
  fullWidth: { alignSelf: 'stretch' },
  row: { flexDirection: 'row', alignItems: 'center' },
  icon: { marginRight: spacing.sm },
  label: { fontFamily: fonts.semiBold, fontSize: 15.5, letterSpacing: 0.2 },
  pressed: { opacity: 0.9, transform: [{ scale: 0.985 }] },
  disabled: { opacity: 0.45 },
});
