import React, { forwardRef } from 'react';
import { Platform, Share, StyleSheet, Text, View } from 'react-native';

import { BRAND, KapaTier } from '@/content/vibes';
import { colors, radius, spacing, typography } from '@/theme';
import { formatCurrency } from '@/utils/format';

interface ShareCardProps {
  tier: KapaTier;
  normalValue: number;
}

/**
 * Sosyal medyada paylaşılmak üzere tasarlanmış kart.
 * Ekran görüntüsü bundan alınır; bu yüzden kendi zeminini ve markasını taşır.
 */
export const ShareCard = forwardRef<View, ShareCardProps>(({ tier, normalValue }, ref) => (
  <View ref={ref} collapsable={false} style={styles.card}>
    <Text style={styles.emoji}>{tier.emoji}</Text>
    <Text style={[typography.shout, styles.headline]} numberOfLines={2} adjustsFontSizeToFit>
      {formatCurrency(normalValue)}
    </Text>
    <Text style={[typography.title, styles.punchline]} numberOfLines={2} adjustsFontSizeToFit>
      {liralikAdamsin(normalValue)}
    </Text>
    <View style={styles.tierPill}>
      <Text style={[typography.bodyStrong, styles.tierText]}>{tier.title}</Text>
    </View>
    <View style={styles.footer}>
      <Text style={[typography.caption, styles.brand]}>
        🪙 {BRAND.name} · {BRAND.tagline}
      </Text>
    </View>
  </View>
));

ShareCard.displayName = 'ShareCard';

/** "500.000 liralık adamsın" — rakamı yuvarlayıp okunur hale getirir. */
export function liralikAdamsin(value: number): string {
  return `${roundedLira(value)} liralık adamsın`;
}

function roundedLira(value: number): string {
  if (value >= 1_000_000) {
    const millions = value / 1_000_000;
    const text = millions >= 10 ? Math.round(millions).toString() : millions.toFixed(1).replace('.', ',');
    return `${text.replace(',0', '')} milyon`;
  }
  if (value >= 1000) {
    return `${Math.round(value / 1000)} bin`;
  }
  return formatCurrency(value).replace(' ₺', '');
}

/** Paylaşım metni — görsel paylaşılamazsa bu gider. */
export function buildShareMessage(normalValue: number, tier: KapaTier): string {
  return [
    `${tier.emoji} ${liralikAdamsin(normalValue)}.`,
    `"${tier.title}" seviyesindeyim.`,
    '',
    `Sen kaç paralık adamsın? ${BRAND.name} ile ölç.`,
  ].join('\n');
}

/** Yerleşik paylaşım sayfası — her platformda çalışır. */
export async function shareText(message: string): Promise<boolean> {
  try {
    const result = await Share.share(
      Platform.OS === 'ios' ? { message } : { message, title: BRAND.name },
    );
    return result.action !== Share.dismissedAction;
  } catch {
    return false;
  }
}

const styles = StyleSheet.create({
  card: {
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.xxl,
    backgroundColor: colors.cardElevated,
    borderWidth: 2,
    borderColor: colors.gold,
  },
  emoji: { fontSize: 56, lineHeight: 68 },
  headline: { color: colors.green, textAlign: 'center' },
  punchline: { color: colors.text, textAlign: 'center' },
  tierPill: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.pill,
    backgroundColor: colors.goldSoft,
  },
  tierText: { color: colors.gold },
  footer: { marginTop: spacing.sm },
  brand: { color: colors.textMuted },
});
