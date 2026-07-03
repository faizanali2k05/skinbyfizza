import React, { useState } from 'react';
import {
  StyleSheet,
  TextInput,
  TextInputProps,
  View,
  Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Text } from './Text';
import { colors } from '../theme/colors';
import { radius, spacing } from '../theme/spacing';
import { fonts } from '../theme/typography';

type Props = TextInputProps & {
  label?: string;
  error?: string;
  hint?: string;
  leftIcon?: keyof typeof Ionicons.glyphMap;
  secure?: boolean;
};

export function TextField({
  label,
  error,
  hint,
  leftIcon,
  secure,
  style,
  ...rest
}: Props) {
  const [focused, setFocused] = useState(false);
  const [hidden, setHidden] = useState(!!secure);

  return (
    <View style={styles.wrap}>
      {label ? (
        <Text variant="overline" style={styles.label}>
          {label}
        </Text>
      ) : null}
      <View
        style={[
          styles.field,
          focused && styles.focused,
          !!error && styles.errored,
        ]}
      >
        {leftIcon ? (
          <Ionicons
            name={leftIcon}
            size={18}
            color={colors.textMuted}
            style={styles.leftIcon}
          />
        ) : null}
        <TextInput
          {...rest}
          secureTextEntry={hidden}
          onFocus={(e) => {
            setFocused(true);
            rest.onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            rest.onBlur?.(e);
          }}
          placeholderTextColor={colors.textMuted}
          style={[styles.input, style]}
        />
        {secure ? (
          <Pressable onPress={() => setHidden((h) => !h)} hitSlop={10}>
            <Ionicons
              name={hidden ? 'eye-outline' : 'eye-off-outline'}
              size={18}
              color={colors.textMuted}
            />
          </Pressable>
        ) : null}
      </View>
      {error ? (
        <Text variant="caption" color={colors.error} style={styles.helper}>
          {error}
        </Text>
      ) : hint ? (
        <Text variant="caption" style={styles.helper}>
          {hint}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: spacing.lg },
  label: { marginBottom: spacing.sm },
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.lg,
    height: 54,
  },
  focused: { borderColor: colors.gold },
  errored: { borderColor: colors.error },
  leftIcon: { marginRight: spacing.sm },
  input: {
    flex: 1,
    color: colors.textPrimary,
    fontFamily: fonts.regular,
    fontSize: 15,
    height: '100%',
  },
  helper: { marginTop: spacing.xs },
});
