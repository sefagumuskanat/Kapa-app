import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Card } from './Card';
import { colors, radius, spacing, TOUCH_TARGET, typography } from '@/theme';
import { SubscriptionProduct } from '@/services';

interface PaywallTeaserProps {
  title: string;
  description: string;
  onPress: () => void;
  icon?: keyof typeof Ionicons.glyphMap;
}

/** Ekran içi premium teaser — içerik kilidini açıklar, veri sızdırmaz. */
export function PaywallTeaser({
  title,
  description,
  onPress,
  icon = 'sparkles-outline',
}: PaywallTeaserProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={title}
      onPress={onPress}
      style={({ pressed }) => [styles.teaser, pressed && styles.pressed]}
    >
      <View style={styles.teaserIcon}>
        <Ionicons name={icon} size={18} color={colors.gold} />
      </View>
      <View style={styles.teaserBody}>
        <Text style={[typography.bodyStrong, styles.teaserTitle]}>{title}</Text>
        <Text style={[typography.caption, styles.teaserDescription]}>{description}</Text>
      </View>
      <Ionicons name="chevron-forward" size={16} color={colors.gold} />
    </Pressable>
  );
}

interface PaywallCardProps {
  product: SubscriptionProduct;
  selected: boolean;
  onSelect: () => void;
}

/** Paywall ekranındaki tek bir abonelik seçeneği. */
export function PaywallCard({ product, selected, onSelect }: PaywallCardProps) {
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      accessibilityLabel={`${product.title} ${product.priceLabel} ${product.periodLabel}`}
      onPress={onSelect}
      style={({ pressed }) => [pressed && styles.pressed]}
    >
      <Card
        elevated={selected}
        style={StyleSheet.flatten([styles.card, selected && styles.cardSelected])}
      >
        <View style={styles.cardHeader}>
          <View style={[styles.radio, selected && styles.radioSelected]}>
            {selected ? <View style={styles.radioDot} /> : null}
          </View>
          <Text style={[typography.subheading, styles.cardTitle]}>{product.title}</Text>
          {product.badge ? (
            <View style={styles.badge}>
              <Text style={[typography.label, styles.badgeText]}>{product.badge}</Text>
            </View>
          ) : null}
        </View>

        <View style={styles.priceRow}>
          <Text style={[typography.title, styles.price]}>{product.priceLabel}</Text>
          <Text style={[typography.body, styles.period]}>{product.periodLabel}</Text>
        </View>

        {product.savingLabel ? (
          <Text style={[typography.caption, styles.saving]}>{product.savingLabel}</Text>
        ) : null}
      </Card>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  teaser: {
    minHeight: TOUCH_TARGET,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radius.lg,
    backgroundColor: colors.goldSoft,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.gold,
  },
  pressed: { opacity: 0.75 },
  teaserIcon: {
    width: 36,
    height: 36,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.goldSoft,
  },
  teaserBody: { flex: 1, gap: 2 },
  teaserTitle: { color: colors.gold },
  teaserDescription: { color: colors.textMuted },

  card: { gap: spacing.sm },
  cardSelected: { borderColor: colors.gold },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  radio: {
    width: 20,
    height: 20,
    borderRadius: radius.pill,
    borderWidth: 1.5,
    borderColor: colors.borderStrong,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioSelected: { borderColor: colors.gold },
  radioDot: { width: 10, height: 10, borderRadius: radius.pill, backgroundColor: colors.gold },
  cardTitle: { color: colors.text, flex: 1 },
  badge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.pill,
    backgroundColor: colors.goldSoft,
  },
  badgeText: { color: colors.gold },
  priceRow: { flexDirection: 'row', alignItems: 'baseline', gap: spacing.xs },
  price: { color: colors.text },
  period: { color: colors.textMuted },
  saving: { color: colors.green },
});
