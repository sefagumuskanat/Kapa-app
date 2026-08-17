import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import { Button } from './Button';
import { adService, AdCreative, AdSlot } from '@/services';
import { useApp } from '@/store/AppContext';
import { colors, fonts, radius, spacing, TOUCH_TARGET, typography } from '@/theme';

interface AdOverlayProps {
  slot: AdSlot;
  visible: boolean;
  /** Reklam kapandığında (veya premium olduğu için hiç açılmadığında) çağrılır. */
  onFinished: () => void;
  onUpgrade: () => void;
}

/**
 * Tam ekran reklam.
 *
 * Kapatma düğmesi bilerek standart boyutta (44px dokunma alanı) ve reklam
 * içeriğinden uzakta duruyor. Kullanıcıyı yanlışlıkla reklama tıklatmak
 * hem mağaza politikalarına aykırı hem de reklam verene karşı sahtekârlık;
 * o yüzden burada normal bir kapatma düğmesi var.
 */
export function AdOverlay({ slot, visible, onFinished, onUpgrade }: AdOverlayProps) {
  const { isPremium } = useApp();
  const [creative, setCreative] = useState<AdCreative | null>(null);
  const [remaining, setRemaining] = useState(0);

  useEffect(() => {
    if (!visible) {
      setCreative(null);
      return;
    }
    let active = true;
    void adService.requestAd({ slot, locale: 'tr-TR' }, isPremium).then((result) => {
      if (!active) return;
      if (!result) {
        // Premium: reklam yok, akış kesintisiz devam etsin.
        onFinished();
        return;
      }
      setCreative(result);
      setRemaining(result.skipAfterSeconds ?? 0);
    });
    return () => {
      active = false;
    };
  }, [visible, slot, isPremium, onFinished]);

  // Geri sayım
  useEffect(() => {
    if (!creative || remaining <= 0) return;
    const timer = setTimeout(() => setRemaining((value) => value - 1), 1000);
    return () => clearTimeout(timer);
  }, [creative, remaining]);

  if (!visible || !creative) return null;

  const canClose = remaining <= 0;

  return (
    <Modal visible transparent animationType="fade" onRequestClose={canClose ? onFinished : undefined}>
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          <View style={styles.topRow}>
            <Text style={[typography.label, styles.tag]}>REKLAM</Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={canClose ? 'Reklamı kapat' : `${remaining} saniye sonra kapatılabilir`}
              onPress={canClose ? onFinished : undefined}
              disabled={!canClose}
              hitSlop={8}
              style={({ pressed }) => [
                styles.closeButton,
                !canClose && styles.closeDisabled,
                pressed && canClose && styles.pressed,
              ]}
            >
              {canClose ? (
                <Ionicons name="close" size={22} color={colors.text} />
              ) : (
                <Text style={[typography.caption, styles.countdown]}>{remaining}</Text>
              )}
            </Pressable>
          </View>

          <View style={styles.body}>
            <Text style={styles.emoji}>📣</Text>
            <Text style={[typography.heading, styles.headline]}>{creative.headline}</Text>
            <Text style={[typography.body, styles.text]}>{creative.body}</Text>
          </View>

          <View style={styles.privacyRow}>
            <Ionicons name="shield-checkmark-outline" size={13} color={colors.green} />
            <Text style={[typography.caption, styles.privacy]}>
              Bu reklam senin neyin olduğunu bilmiyor.
            </Text>
          </View>

          <Button label={creative.ctaLabel} onPress={onUpgrade} fullWidth />

          {canClose ? (
            <Pressable accessibilityRole="button" onPress={onFinished} style={styles.skipRow}>
              <Text style={[typography.caption, styles.skip]}>Şimdilik geç</Text>
            </Pressable>
          ) : (
            <Text style={[typography.caption, styles.skip]}>
              {remaining} saniye sonra geçebilirsin
            </Text>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: colors.overlay,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  sheet: {
    width: '100%',
    maxWidth: 380,
    gap: spacing.md,
    padding: spacing.lg,
    borderRadius: radius.xxl,
    backgroundColor: colors.cardElevated,
    borderWidth: 1,
    borderColor: colors.borderStrong,
  },
  topRow: { flexDirection: 'row', alignItems: 'center' },
  tag: { color: colors.textFaint, flex: 1 },
  closeButton: {
    width: TOUCH_TARGET,
    height: TOUCH_TARGET,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.card,
  },
  closeDisabled: { opacity: 0.6 },
  countdown: { color: colors.textMuted, fontFamily: fonts.bodyBold },
  pressed: { opacity: 0.7 },
  body: { alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.md },
  emoji: { fontSize: 44, lineHeight: 54 },
  headline: { color: colors.text, textAlign: 'center' },
  text: { color: colors.textMuted, textAlign: 'center' },
  privacyRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, justifyContent: 'center' },
  privacy: { color: colors.green },
  skipRow: { minHeight: TOUCH_TARGET, alignItems: 'center', justifyContent: 'center' },
  skip: { color: colors.textMuted, textAlign: 'center' },
});
