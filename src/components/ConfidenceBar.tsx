import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { colors, radius, spacing, typography } from '@/theme';
import { confidenceLabel, formatPercent } from '@/utils/format';

interface ConfidenceBarProps {
  /** 0..1 */
  score: number;
  factors?: string[];
  compact?: boolean;
}

/**
 * Güven göstergesi. Ürün kuralı gereği hiçbir değer güven skoru olmadan
 * gösterilmez — sahte kesinlik üretmemek için zorunlu bileşendir.
 */
export function ConfidenceBar({ score, factors, compact = false }: ConfidenceBarProps) {
  const clamped = Math.min(1, Math.max(0, score));
  const tone = clamped >= 0.75 ? colors.green : clamped >= 0.5 ? colors.gold : colors.red;

  return (
    <View style={styles.wrapper}>
      <View style={styles.headerRow}>
        <Ionicons name="pulse-outline" size={14} color={tone} />
        <Text style={[typography.caption, { color: tone, fontWeight: '600' }]}>
          {confidenceLabel(clamped)}
        </Text>
        <Text style={[typography.caption, styles.score]}>{formatPercent(clamped)}</Text>
      </View>
      <View
        style={styles.track}
        accessibilityRole="progressbar"
        accessibilityLabel={`Güven skoru ${formatPercent(clamped)}`}
      >
        <View style={[styles.fill, { width: `${clamped * 100}%`, backgroundColor: tone }]} />
      </View>
      {!compact && factors && factors.length > 0 ? (
        <View style={styles.factors}>
          {factors.map((factor, index) => (
            <Text key={`${factor}-${index}`} style={[typography.caption, styles.factor]}>
              • {factor}
            </Text>
          ))}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { gap: spacing.xs },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  score: { color: colors.textFaint, marginLeft: 'auto' },
  track: {
    height: 6,
    borderRadius: radius.pill,
    backgroundColor: colors.skeleton,
    overflow: 'hidden',
  },
  fill: { height: '100%', borderRadius: radius.pill },
  factors: { gap: 2, marginTop: spacing.xs },
  factor: { color: colors.textFaint },
});
