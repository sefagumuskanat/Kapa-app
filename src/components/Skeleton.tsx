import React, { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, View, ViewStyle } from 'react-native';

import { colors, radius, spacing } from '@/theme';

interface SkeletonProps {
  height?: number;
  width?: number | `${number}%`;
  /** Köşe yarıçapı. */
  r?: number;
  style?: ViewStyle;
}

export function Skeleton({ height = 16, width = '100%', r = 8, style }: SkeletonProps) {
  const pulse = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1,
          duration: 900,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 0.4,
          duration: 900,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    );
    animation.start();
    return () => animation.stop();
  }, [pulse]);

  return (
    <Animated.View
      accessibilityRole="progressbar"
      accessibilityLabel="Yükleniyor"
      style={[
        { height, width, borderRadius: r, backgroundColor: colors.skeleton, opacity: pulse },
        style,
      ]}
    />
  );
}

/** Home ekranı için hazır iskelet düzeni. */
export function PortfolioSkeleton() {
  return (
    <View style={styles.group}>
      <Skeleton height={12} width="40%" />
      <Skeleton height={44} width="70%" r={radius.md} />
      <View style={styles.row}>
        <Skeleton height={96} width="32%" r={radius.lg} />
        <Skeleton height={96} width="32%" r={radius.lg} />
        <Skeleton height={96} width="32%" r={radius.lg} />
      </View>
      <Skeleton height={200} r={radius.xl} />
    </View>
  );
}

/** Liste ekranları için hazır iskelet düzeni. */
export function ListSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <View style={styles.group}>
      {Array.from({ length: rows }).map((_, index) => (
        <Skeleton key={index} height={72} r={radius.lg} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  group: { gap: spacing.md },
  row: { flexDirection: 'row', gap: spacing.sm },
});
