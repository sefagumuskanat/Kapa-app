import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { adService, AdCreative, AdSlot } from '@/services';
import { useApp } from '@/store/AppContext';
import { colors, fonts, radius, spacing, typography } from '@/theme';

interface AdSlotViewProps {
  slot: AdSlot;
  onPressCta: () => void;
}

/**
 * Reklam alanı. Reklam isteği hiçbir finansal veri taşımaz;
 * gönderilen payload kullanıcıya açıkça gösterilir.
 */
export function AdSlotView({ slot, onPressCta }: AdSlotViewProps) {
  const { preferences, isPremium } = useApp();
  const [creative, setCreative] = useState<AdCreative | null>(null);

  useEffect(() => {
    let active = true;
    void adService
      .requestAd({ slot, locale: 'tr-TR' }, preferences.adsEnabled, isPremium)
      .then((result) => {
        if (active) setCreative(result);
      });
    return () => {
      active = false;
    };
  }, [slot, preferences.adsEnabled, isPremium]);

  if (!creative) return null;

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={[typography.label, styles.tag]}>REKLAM</Text>
        <View style={styles.privacyTag}>
          <Ionicons name="shield-checkmark-outline" size={11} color={colors.green} />
          <Text style={[typography.caption, styles.privacyText]}>Hedefleme yok</Text>
        </View>
      </View>
      <Text style={[typography.bodyStrong, styles.headline]}>{creative.headline}</Text>
      <Text style={[typography.caption, styles.body]}>{creative.body}</Text>
      <Pressable
        accessibilityRole="button"
        onPress={onPressCta}
        style={({ pressed }) => [styles.cta, pressed && styles.pressed]}
      >
        <Text style={[typography.caption, styles.ctaText]}>{creative.ctaLabel}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.xs,
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    borderStyle: 'dashed',
    backgroundColor: colors.card,
  },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  tag: { color: colors.textFaint },
  privacyTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginLeft: 'auto',
  },
  privacyText: { color: colors.green },
  headline: { color: colors.text },
  body: { color: colors.textMuted },
  cta: { alignSelf: 'flex-start', minHeight: 44, justifyContent: 'center' },
  ctaText: { color: colors.green, fontFamily: fonts.bodyBold },
  pressed: { opacity: 0.7 },
});
