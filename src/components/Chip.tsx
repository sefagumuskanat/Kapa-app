import React from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';

import { TOUCH_TARGET, colors, fonts, radius, spacing, typography } from '@/theme';

interface ChipProps {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  tone?: 'default' | 'green' | 'gold' | 'red';
}

export function Chip({ label, selected = false, onPress, tone = 'default' }: ChipProps) {
  const accent = TONE[tone];
  return (
    <Pressable
      accessibilityRole={onPress ? 'button' : 'text'}
      accessibilityState={{ selected }}
      onPress={onPress}
      disabled={!onPress}
      style={({ pressed }) => [
        styles.chip,
        selected && { backgroundColor: accent.soft, borderColor: accent.solid },
        pressed && styles.pressed,
      ]}
    >
      <Text
        style={[
          typography.caption,
          styles.label,
          selected && { color: accent.solid, fontFamily: fonts.bodySemi },
        ]}
        numberOfLines={1}
      >
        {label}
      </Text>
    </Pressable>
  );
}

const TONE = {
  default: { solid: colors.text, soft: colors.cardElevated },
  green: { solid: colors.green, soft: colors.greenSoft },
  gold: { solid: colors.gold, soft: colors.goldSoft },
  red: { solid: colors.red, soft: colors.redSoft },
} as const;

const styles = StyleSheet.create({
  chip: {
    minHeight: 36,
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    backgroundColor: colors.card,
    // Dokunma alanı 44px'e tamamlanır.
    marginVertical: (TOUCH_TARGET - 36) / 2,
  },
  pressed: { opacity: 0.7 },
  label: { color: colors.textMuted },
});
