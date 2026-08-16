import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Button } from './Button';
import { colors, radius, spacing, typography } from '@/theme';

interface EmptyStateProps {
  icon?: keyof typeof Ionicons.glyphMap;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  secondaryActionLabel?: string;
  onSecondaryAction?: () => void;
}

export function EmptyState({
  icon = 'cube-outline',
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
        <Ionicons name={icon} size={28} color={colors.textMuted} />
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
  title = 'Bir şeyler ters gitti',
  description,
  onRetry,
}: ErrorStateProps) {
  return (
    <View style={styles.container}>
      <View style={[styles.iconCircle, styles.errorCircle]}>
        <Ionicons name="alert-circle-outline" size={28} color={colors.red} />
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
      <Ionicons name="cloud-offline-outline" size={16} color={colors.gold} />
      <Text style={[typography.caption, styles.bannerText]}>
        Çevrimdışısın. Varlıkların cihazında; değerler son bilinen referansla hesaplandı.
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
    width: 64,
    height: 64,
    borderRadius: radius.pill,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  errorCircle: { backgroundColor: colors.redSoft },
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
  bannerAction: { color: colors.gold, fontWeight: '700' },
});
