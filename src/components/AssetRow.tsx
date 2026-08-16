import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, radius, spacing, TOUCH_TARGET, typography } from '@/theme';
import { Asset, ValuationSnapshot } from '@/types';
import { CATEGORY_EMOJI } from '@/content/vibes';
import {
  CATEGORY_LABEL,
  CONDITION_LABEL,
  formatCurrency,
  formatSignedCurrency,
  UNIT_LABEL,
} from '@/utils/format';

interface AssetRowProps {
  asset: Asset;
  valuation: ValuationSnapshot | null;
  onPress: () => void;
}

/** Liste satırı: ad + Normal Satış değeri + kâr/zarar. */
export function AssetRow({ asset, valuation, onPress }: AssetRowProps) {
  const gain = valuation?.unrealizedGain ?? null;
  const gainTone = gain == null ? colors.textFaint : gain >= 0 ? colors.green : colors.red;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${asset.name}, ${
        valuation ? formatCurrency(valuation.normalValue) : 'değer hesaplanıyor'
      }`}
      onPress={onPress}
      style={({ pressed }) => [styles.row, pressed && styles.pressed]}
    >
      <View style={styles.iconBox}>
        <Text style={styles.emoji}>{CATEGORY_EMOJI[asset.category]}</Text>
      </View>

      <View style={styles.body}>
        <Text style={[typography.bodyStrong, styles.name]} numberOfLines={1}>
          {asset.name}
        </Text>
        <Text style={[typography.caption, styles.meta]} numberOfLines={1}>
          {CATEGORY_LABEL[asset.category]} · {formatQuantity(asset)} · {CONDITION_LABEL[asset.condition]}
        </Text>
      </View>

      <View style={styles.values}>
        <Text style={[typography.bodyStrong, styles.value]} numberOfLines={1}>
          {valuation ? formatCurrency(valuation.normalValue, valuation.currency, true) : '—'}
        </Text>
        <Text style={[typography.caption, { color: gainTone }]} numberOfLines={1}>
          {gain == null ? 'kaça aldın?' : formatSignedCurrency(gain)}
        </Text>
      </View>

      <Ionicons name="chevron-forward" size={16} color={colors.textFaint} />
    </Pressable>
  );
}

function formatQuantity(asset: Asset): string {
  const quantity = Number.isInteger(asset.quantity)
    ? asset.quantity.toString()
    : asset.quantity.toString().replace('.', ',');
  return `${quantity} ${UNIT_LABEL[asset.unit]}`;
}

const styles = StyleSheet.create({
  row: {
    minHeight: TOUCH_TARGET + 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  pressed: { opacity: 0.7 },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    backgroundColor: colors.cardElevated,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emoji: { fontSize: 22, lineHeight: 28 },
  body: { flex: 1, gap: 2 },
  name: { color: colors.text },
  meta: { color: colors.textMuted },
  values: { alignItems: 'flex-end', gap: 2 },
  value: { color: colors.text },
});
