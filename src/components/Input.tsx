import React from 'react';
import { StyleSheet, Text, TextInput, TextInputProps, View } from 'react-native';

import { colors, radius, spacing, TOUCH_TARGET, typography } from '@/theme';

interface InputProps extends TextInputProps {
  label?: string;
  hint?: string;
  error?: string | null;
  suffix?: string;
}

export function Input({ label, hint, error, suffix, style, ...rest }: InputProps) {
  return (
    <View style={styles.wrapper}>
      {label ? <Text style={[typography.caption, styles.label]}>{label}</Text> : null}
      <View style={[styles.field, !!error && styles.fieldError]}>
        <TextInput
          {...rest}
          style={[typography.body, styles.input, style]}
          placeholderTextColor={colors.textFaint}
          selectionColor={colors.green}
          accessibilityLabel={label ?? rest.accessibilityLabel}
        />
        {suffix ? <Text style={[typography.caption, styles.suffix]}>{suffix}</Text> : null}
      </View>
      {error ? (
        <Text style={[typography.caption, styles.error]}>{error}</Text>
      ) : hint ? (
        <Text style={[typography.caption, styles.hint]}>{hint}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { gap: spacing.xs },
  label: { color: colors.textMuted },
  field: {
    minHeight: TOUCH_TARGET,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  fieldError: { borderColor: colors.red },
  input: { flex: 1, color: colors.text, paddingVertical: spacing.sm },
  suffix: { color: colors.textFaint },
  hint: { color: colors.textFaint },
  error: { color: colors.red },
});
