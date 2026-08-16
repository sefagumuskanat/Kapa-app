import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, radius, spacing, TOUCH_TARGET, typography } from '@/theme';

export interface Segment<T extends string> {
  value: T;
  label: string;
}

interface SegmentedControlProps<T extends string> {
  segments: Array<Segment<T>>;
  value: T;
  onChange: (value: T) => void;
  accentFor?: (value: T) => string;
}

export function SegmentedControl<T extends string>({
  segments,
  value,
  onChange,
  accentFor,
}: SegmentedControlProps<T>) {
  return (
    <View style={styles.track} accessibilityRole="tablist">
      {segments.map((segment) => {
        const selected = segment.value === value;
        const accent = accentFor?.(segment.value) ?? colors.green;
        return (
          <Pressable
            key={segment.value}
            accessibilityRole="tab"
            accessibilityState={{ selected }}
            onPress={() => onChange(segment.value)}
            style={({ pressed }) => [
              styles.segment,
              selected && { backgroundColor: colors.cardElevated },
              pressed && styles.pressed,
            ]}
          >
            <Text
              style={[
                typography.caption,
                styles.label,
                selected && { color: accent, fontWeight: '700' },
              ]}
              numberOfLines={1}
            >
              {segment.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    flexDirection: 'row',
    padding: spacing.xs,
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    gap: spacing.xs,
  },
  segment: {
    flex: 1,
    minHeight: TOUCH_TARGET - spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.md,
    paddingHorizontal: spacing.sm,
  },
  pressed: { opacity: 0.7 },
  label: { color: colors.textMuted },
});
