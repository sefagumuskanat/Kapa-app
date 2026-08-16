import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, G } from 'react-native-svg';

import { colors, radius, spacing, typography } from '@/theme';

export interface DonutSlice {
  key: string;
  label: string;
  value: number;
}

interface DonutChartProps {
  slices: DonutSlice[];
  size?: number;
  thickness?: number;
  centerLabel?: string;
  centerValue?: string;
  showLegend?: boolean;
}

/**
 * Kategori dağılımı için donut grafik.
 * Renkler yalnızca marka paletinden türetilir; yeni ana renk eklenmez.
 */
export function DonutChart({
  slices,
  size = 180,
  thickness = 22,
  centerLabel,
  centerValue,
  showLegend = true,
}: DonutChartProps) {
  const total = slices.reduce((sum, slice) => sum + Math.max(0, slice.value), 0);
  const r = (size - thickness) / 2;
  const circumference = 2 * Math.PI * r;

  let offsetRatio = 0;
  const rendered = slices
    .filter((slice) => slice.value > 0)
    .map((slice, index) => {
      const ratio = total > 0 ? slice.value / total : 0;
      const segment = {
        ...slice,
        ratio,
        color: SEGMENT_PALETTE[index % SEGMENT_PALETTE.length],
        dashOffset: -offsetRatio * circumference,
        dashArray: `${ratio * circumference} ${circumference}`,
      };
      offsetRatio += ratio;
      return segment;
    });

  return (
    <View style={styles.wrapper}>
      <View style={{ width: size, height: size }}>
        <Svg width={size} height={size} accessibilityLabel="Kategori dağılımı">
          <G rotation={-90} originX={size / 2} originY={size / 2}>
            <Circle
              cx={size / 2}
              cy={size / 2}
              r={r}
              stroke={colors.skeleton}
              strokeWidth={thickness}
              fill="none"
            />
            {rendered.map((segment) => (
              <Circle
                key={segment.key}
                cx={size / 2}
                cy={size / 2}
                r={r}
                stroke={segment.color}
                strokeWidth={thickness}
                strokeDasharray={segment.dashArray}
                strokeDashoffset={segment.dashOffset}
                strokeLinecap="butt"
                fill="none"
              />
            ))}
          </G>
        </Svg>

        <View style={[styles.center, { width: size, height: size }]} pointerEvents="none">
          {centerValue ? (
            <Text
              style={[typography.heading, styles.centerValue]}
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.6}
            >
              {centerValue}
            </Text>
          ) : null}
          {centerLabel ? (
            <Text style={[typography.caption, styles.centerLabel]} numberOfLines={1}>
              {centerLabel}
            </Text>
          ) : null}
        </View>
      </View>

      {showLegend ? (
        <View style={styles.legend}>
          {rendered.map((segment) => (
            <View key={segment.key} style={styles.legendRow}>
              <View style={[styles.legendDot, { backgroundColor: segment.color }]} />
              <Text style={[typography.caption, styles.legendLabel]} numberOfLines={1}>
                {segment.label}
              </Text>
              <Text style={[typography.caption, styles.legendValue]}>
                %{Math.round(segment.ratio * 100)}
              </Text>
            </View>
          ))}
        </View>
      ) : null}
    </View>
  );
}

/** Palet içi tonlar — marka renklerinin doygunluk varyantları. */
const SEGMENT_PALETTE = [
  colors.green,
  colors.gold,
  'rgba(41, 211, 145, 0.55)',
  colors.red,
  'rgba(244, 199, 102, 0.55)',
  'rgba(255, 107, 107, 0.55)',
  'rgba(247, 249, 252, 0.35)',
];

/** Tek satırlık yatay dağılım çubuğu — donut'ın kompakt alternatifi. */
export function BarBreakdown({ slices }: { slices: DonutSlice[] }) {
  const total = slices.reduce((sum, slice) => sum + Math.max(0, slice.value), 0);
  if (total <= 0) return null;

  return (
    <View style={styles.bar}>
      {slices
        .filter((slice) => slice.value > 0)
        .map((slice, index) => (
          <View
            key={slice.key}
            style={{
              flex: slice.value / total,
              backgroundColor: SEGMENT_PALETTE[index % SEGMENT_PALETTE.length],
            }}
          />
        ))}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { alignItems: 'center', gap: spacing.md },
  center: { position: 'absolute', alignItems: 'center', justifyContent: 'center', padding: spacing.lg },
  centerValue: { color: colors.text, textAlign: 'center' },
  centerLabel: { color: colors.textMuted, textAlign: 'center' },
  legend: { alignSelf: 'stretch', gap: spacing.sm },
  legendRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendLabel: { flex: 1, color: colors.textMuted },
  legendValue: { color: colors.text, fontWeight: '600' },
  bar: {
    flexDirection: 'row',
    height: 8,
    borderRadius: radius.pill,
    overflow: 'hidden',
    backgroundColor: colors.skeleton,
  },
});
