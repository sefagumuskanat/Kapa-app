import React from 'react';
import { StyleSheet, View, ViewProps, ViewStyle } from 'react-native';

import { colors, radius, spacing } from '@/theme';

interface CardProps extends ViewProps {
  padded?: boolean;
  elevated?: boolean;
  style?: ViewStyle | ViewStyle[];
}

export function Card({ children, padded = true, elevated = false, style, ...rest }: CardProps) {
  return (
    <View
      {...rest}
      style={[styles.base, elevated && styles.elevated, padded && styles.padded, style]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    backgroundColor: colors.card,
    borderRadius: radius.xl,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  elevated: {
    backgroundColor: colors.cardElevated,
    borderColor: colors.borderStrong,
  },
  padded: {
    padding: spacing.md,
  },
});
