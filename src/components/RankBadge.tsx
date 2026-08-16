import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { colors, radius, spacing, typography } from '@/theme';
import { COHORT_LABEL } from '@/services';
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
          Sıralama kapalı
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.badge, compact && styles.compact]}>
      <Ionicons name="trending-up" size={14} color={colors.gold} />
      <Text style={[typography.caption, styles.cohort]} numberOfLines={1}>
        {COHORT_LABEL[rank.cohort]}
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
  cohort: { color: colors.gold, fontWeight: '700' },
  divider: { width: 1, height: 12, backgroundColor: colors.gold, opacity: 0.4 },
  percentile: { color: colors.gold },
});
