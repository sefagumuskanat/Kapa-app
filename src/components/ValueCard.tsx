import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { SCENARIO_VIBE } from '@/content/vibes';
import { colors, radius, scenarioColors, spacing, typography } from '@/theme';
import { Currency, ValuationScenario } from '@/types';
import { formatCurrency, SCENARIO_HINT, SCENARIO_LABEL } from '@/utils/format';

interface ValueCardProps {
  scenario: ValuationScenario;
  value: number;
  currency?: Currency;
  /** Normal Satış ana metriktir; vurgulu gösterilir. */
  emphasized?: boolean;
  compact?: boolean;
  onPress?: () => void;
  selected?: boolean;
}

/**
 * Üç senaryodan birini gösteren kart.
 * Ürün kuralı: yalnızca fast / normal / patient gösterilir, dördüncü değer yoktur.
 */
export function ValueCard({
  scenario,
  value,
  currency = 'TRY',
  emphasized = false,
  compact = false,
  onPress,
  selected = false,
}: ValueCardProps) {
  const accent = scenarioColors[scenario];
  const Container = onPress ? Pressable : View;

  return (
    <Container
      accessibilityRole={onPress ? 'button' : undefined}
      accessibilityLabel={`${SCENARIO_LABEL[scenario]}: ${formatCurrency(value, currency)}`}
      accessibilityState={onPress ? { selected } : undefined}
      onPress={onPress}
      style={[
        styles.card,
        compact && styles.compact,
        emphasized && { borderColor: accent, backgroundColor: colors.cardElevated },
        selected && { borderColor: accent },
      ]}
    >
      <View style={styles.labelRow}>
        <Text style={compact ? styles.emojiCompact : styles.emoji}>
          {SCENARIO_VIBE[scenario].emoji}
        </Text>
        <Text
          style={[typography.label, styles.label, compact && styles.labelCompact]}
          numberOfLines={1}
        >
          {SCENARIO_LABEL[scenario].toLocaleUpperCase('tr-TR')}
        </Text>
        {/* Dar üçlü satırda yıldız etiketi kırpıyor; vurgu zaten kenarlık ve renkle veriliyor. */}
        {emphasized && !compact ? <Ionicons name="star" size={12} color={accent} /> : null}
      </View>

      <Text
        style={[compact ? typography.subheading : typography.heading, { color: accent }]}
        numberOfLines={1}
        adjustsFontSizeToFit
        minimumFontScale={0.7}
      >
        {formatCurrency(value, currency, compact)}
      </Text>

      {!compact ? (
        <Text style={[typography.caption, styles.hint]} numberOfLines={2}>
          {SCENARIO_HINT[scenario]}
        </Text>
      ) : null}
    </Container>
  );
}

/** Üç senaryoyu yan yana gösteren hazır satır. */
export function ValueCardRow({
  fast,
  normal,
  patient,
  currency = 'TRY',
  compact = true,
}: {
  fast: number;
  normal: number;
  patient: number;
  currency?: Currency;
  compact?: boolean;
}) {
  return (
    <View style={styles.row}>
      <View style={styles.rowItem}>
        <ValueCard scenario="fast" value={fast} currency={currency} compact={compact} />
      </View>
      <View style={styles.rowItem}>
        <ValueCard scenario="normal" value={normal} currency={currency} compact={compact} emphasized />
      </View>
      <View style={styles.rowItem}>
        <ValueCard scenario="patient" value={patient} currency={currency} compact={compact} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.lg,
    backgroundColor: colors.card,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    minHeight: 96,
    justifyContent: 'center',
  },
  compact: { padding: spacing.sm + 4, minHeight: 88, gap: spacing.xs },
  labelRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  emoji: { fontSize: 15, lineHeight: 19 },
  emojiCompact: { fontSize: 12, lineHeight: 15 },
  label: { color: colors.textMuted, flexShrink: 1 },
  labelCompact: { fontSize: 10, letterSpacing: 0.2 },
  hint: { color: colors.textFaint },
  row: { flexDirection: 'row', gap: spacing.sm },
  rowItem: { flex: 1 },
});
