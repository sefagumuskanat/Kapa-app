import React, { useEffect, useMemo, useRef } from 'react';
import { Animated, Dimensions, Easing, Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import { Button } from './Button';
import { Celebration as CelebrationContent } from '@/content/vibes';
import { chartPalette, colors, radius, spacing, typography } from '@/theme';
import { formatCurrency } from '@/utils/format';

interface CelebrationOverlayProps {
  visible: boolean;
  content: CelebrationContent | null;
  /** Eklenen varlığın adı ve Normal Satış değeri. */
  assetName?: string;
  addedValue?: number | null;
  /** Portföyün yeni toplamı. */
  newTotal?: number | null;
  onDismiss: () => void;
}

/**
 * Varlık eklendiğinde çıkan kutlama ekranı.
 * Uygulamanın "eğlence" vaadi en çok burada hissedilir.
 */
export function CelebrationOverlay({
  visible,
  content,
  assetName,
  addedValue,
  newTotal,
  onDismiss,
}: CelebrationOverlayProps) {
  const pop = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!visible) {
      pop.setValue(0);
      return;
    }
    Animated.spring(pop, {
      toValue: 1,
      friction: 5,
      tension: 90,
      useNativeDriver: true,
    }).start();
  }, [visible, pop]);

  if (!content) return null;

  const scale = pop.interpolate({ inputRange: [0, 1], outputRange: [0.7, 1] });

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onDismiss}>
      <Pressable style={styles.backdrop} onPress={onDismiss} accessibilityLabel="Kapat">
        <Confetti active={visible} />

        <Animated.View style={[styles.card, { opacity: pop, transform: [{ scale }] }]}>
          <Text style={styles.emoji}>{content.emoji}</Text>

          <Text style={[typography.shout, styles.headline]}>{content.headline}</Text>
          <Text style={[typography.body, styles.line]}>{content.line}</Text>

          {assetName ? (
            <View style={styles.assetPill}>
              <Text style={[typography.bodyStrong, styles.assetName]} numberOfLines={1}>
                {assetName}
              </Text>
              {addedValue != null && addedValue > 0 ? (
                <Text style={[typography.bodyStrong, styles.assetValue]}>
                  +{formatCurrency(addedValue, 'TRY', true)}
                </Text>
              ) : null}
            </View>
          ) : null}

          {newTotal != null ? (
            <View style={styles.totalBox}>
              <Text style={[typography.caption, styles.totalLabel]}>YENİ TOPLAMIN</Text>
              <Text
                style={[typography.title, styles.totalValue]}
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.6}
              >
                {formatCurrency(newTotal)}
              </Text>
            </View>
          ) : null}

          <Button label="Eyvallah" onPress={onDismiss} size="lg" fullWidth />
        </Animated.View>
      </Pressable>
    </Modal>
  );
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CONFETTI_COUNT = 26;

/** Hafif konfeti — ek bağımlılık olmadan, sadece Animated ile. */
function Confetti({ active }: { active: boolean }) {
  const pieces = useMemo(
    () =>
      Array.from({ length: CONFETTI_COUNT }).map((_, index) => ({
        key: `confetti-${index}`,
        left: Math.random() * SCREEN_WIDTH,
        size: 6 + Math.random() * 8,
        color: chartPalette[index % chartPalette.length],
        delay: Math.random() * 400,
        duration: 1600 + Math.random() * 1200,
        drift: (Math.random() - 0.5) * 90,
        spin: Math.random() > 0.5 ? 1 : -1,
      })),
    [],
  );

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {pieces.map(({ key, ...piece }) => (
        <ConfettiPiece key={key} active={active} {...piece} />
      ))}
    </View>
  );
}

interface PieceProps {
  active: boolean;
  left: number;
  size: number;
  color: string;
  delay: number;
  duration: number;
  drift: number;
  spin: number;
}

function ConfettiPiece({ active, left, size, color, delay, duration, drift, spin }: PieceProps) {
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!active) {
      progress.setValue(0);
      return;
    }
    const animation = Animated.timing(progress, {
      toValue: 1,
      duration,
      delay,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    });
    animation.start();
    return () => animation.stop();
  }, [active, progress, duration, delay]);

  const translateY = progress.interpolate({ inputRange: [0, 1], outputRange: [-60, 700] });
  const translateX = progress.interpolate({ inputRange: [0, 1], outputRange: [0, drift] });
  const rotate = progress.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', `${spin * 540}deg`],
  });
  const opacity = progress.interpolate({ inputRange: [0, 0.8, 1], outputRange: [1, 1, 0] });

  return (
    <Animated.View
      style={{
        position: 'absolute',
        left,
        width: size,
        height: size * 1.6,
        borderRadius: 2,
        backgroundColor: color,
        opacity,
        transform: [{ translateY }, { translateX }, { rotate }],
      }}
    />
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
  card: {
    width: '100%',
    maxWidth: 380,
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.lg,
    borderRadius: radius.xxl,
    backgroundColor: colors.cardElevated,
    borderWidth: 1,
    borderColor: colors.borderStrong,
  },
  emoji: { fontSize: 64, lineHeight: 76 },
  headline: { color: colors.text, textAlign: 'center' },
  line: { color: colors.textMuted, textAlign: 'center', marginBottom: spacing.sm },
  assetPill: {
    alignSelf: 'stretch',
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    backgroundColor: colors.card,
  },
  assetName: { flex: 1, color: colors.text },
  assetValue: { color: colors.green },
  totalBox: {
    alignSelf: 'stretch',
    alignItems: 'center',
    gap: 2,
    paddingVertical: spacing.md,
  },
  totalLabel: { color: colors.textFaint, letterSpacing: 1 },
  totalValue: { color: colors.green },
});
