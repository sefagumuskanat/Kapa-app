import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { colors, radius, spacing, typography } from '@/theme';
import { COHORT_VIBE } from '@/content/vibes';
import { RankResult } from '@/types';

interface RankBadgeProps {
  rank: RankResult | null;
  /** Rıza yoksa rozet kilitli görünür ve hiçbir veri gösterilmez. */
  consentGranted: boolean;
  compact?: boolean;
}

/**
 * Sıralama rozeti.
 * Kural: kullanıcı listesi, profil veya kesin sıra numarası ASLA gösterilmez.
 */
export function RankBadge({ rank, consentGranted, compact = false }: RankBadgeProps) {
  if (!consentGranted || !rank) {
    return (
      <View style={[styles.badge, styles.locked, compact && styles.compact]}>
        <Ionicons name="lock-closed-outline" size={14} color={colors.textMuted} />
        <Text style={[typography.caption, styles.lockedText]} numberOfLines={1}>
          Sıralama kapalı — merak ediyorsan aç
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.badge, compact && styles.compact]}>
      <Text style={styles.cohortEmoji}>{COHORT_VIBE[rank.cohort].emoji}</Text>
      <Text style={[typography.caption, styles.cohort]} numberOfLines={1}>
        {COHORT_VIBE[rank.cohort].title}
      </Text>
      <View style={styles.divider} />
      <Text style={[typography.caption, styles.percentile]} numberOfLines={1}>
        {rank.detailLocked ? '•••' : rank.maskedPercentile}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    backgroundColor: colors.goldSoft,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.gold,
  },
  compact: { paddingVertical: spacing.xs, paddingHorizontal: spacing.sm },
  locked: { backgroundColor: colors.card, borderColor: colors.border },
  lockedText: { color: colors.textMuted },
  cohortEmoji: { fontSize: 14, lineHeight: 18 },
  cohort: { color: colors.gold },
  divider: { width: 1, height: 12, backgroundColor: colors.gold, opacity: 0.4 },
  percentile: { color: colors.gold },
});
