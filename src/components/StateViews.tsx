import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Button } from './Button';
import { colors, fonts, radius, spacing, typography } from '@/theme';

interface EmptyStateProps {
  /** Boş durumlar ikon yerine emoji kullanır — ton daha sıcak oluyor. */
  emoji?: string;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  secondaryActionLabel?: string;
  onSecondaryAction?: () => void;
}

export function EmptyState({
  emoji = '📦',
  title,
  description,
  actionLabel,
  onAction,
  secondaryActionLabel,
  onSecondaryAction,
}: EmptyStateProps) {
  return (
    <View style={styles.container}>
      <View style={styles.iconCircle}>
        <Text style={styles.bigEmoji}>{emoji}</Text>
      </View>
      <Text style={[typography.heading, styles.title]}>{title}</Text>
      <Text style={[typography.body, styles.description]}>{description}</Text>
      {actionLabel && onAction ? (
        <Button label={actionLabel} onPress={onAction} icon="add" />
      ) : null}
      {secondaryActionLabel && onSecondaryAction ? (
        <Button label={secondaryActionLabel} onPress={onSecondaryAction} variant="ghost" />
      ) : null}
    </View>
  );
}

interface ErrorStateProps {
  title?: string;
  description: string;
  onRetry?: () => void;
}

export function ErrorState({
  title = 'Bir terslik oldu',
  description,
  onRetry,
}: ErrorStateProps) {
  return (
    <View style={styles.container}>
      <View style={[styles.iconCircle, styles.errorCircle]}>
        <Text style={styles.bigEmoji}>😵‍💫</Text>
      </View>
      <Text style={[typography.heading, styles.title]}>{title}</Text>
      <Text style={[typography.body, styles.description]}>{description}</Text>
      {onRetry ? <Button label="Tekrar dene" onPress={onRetry} variant="secondary" icon="refresh" /> : null}
    </View>
  );
}

/** Çevrimdışı modda gösterilen bant. Veri cihazda olduğu için uygulama çalışmaya devam eder. */
export function OfflineBanner({ onRetry }: { onRetry?: () => void }) {
  return (
    <View style={styles.banner} accessibilityRole="alert">
      <Text style={styles.bannerEmoji}>📡</Text>
      <Text style={[typography.caption, styles.bannerText]}>
        İnternet yok gibi. Sorun değil, listen zaten telefonunda — değerler son bildiğimiz
        rakamlarla hesaplandı.
      </Text>
      {onRetry ? (
        <Text
          accessibilityRole="button"
          onPress={onRetry}
          style={[typography.caption, styles.bannerAction]}
        >
          Yenile
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.xxl,
    paddingHorizontal: spacing.lg,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: radius.pill,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  errorCircle: { backgroundColor: colors.redSoft },
  bigEmoji: { fontSize: 38, lineHeight: 46 },
  bannerEmoji: { fontSize: 15 },
  title: { color: colors.text, textAlign: 'center' },
  description: {
    color: colors.textMuted,
    textAlign: 'center',
    marginBottom: spacing.sm,
    maxWidth: 320,
  },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginHorizontal: spacing.md,
    marginBottom: spacing.sm,
    borderRadius: radius.md,
    backgroundColor: colors.goldSoft,
  },
  bannerText: { flex: 1, color: colors.gold },
  bannerAction: { color: colors.gold, fontFamily: fonts.bodyBold },
});
