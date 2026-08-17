import { Ionicons } from '@expo/vector-icons';
import React, { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { pickNudge } from '@/services';
import { colors, fonts, radius, spacing, TOUCH_TARGET, typography } from '@/theme';

interface ReminderBannerProps {
  count: number;
  onPress: () => void;
  onDismiss: () => void;
}

/**
 * Uygulama içi hatırlatma şeridi.
 *
 * Bildirim izni verilmemiş olabilir ya da ortam bildirimi desteklemiyor
 * olabilir; hatırlatmanın hiçbir koşulda kaybolmaması için ekranda da
 * görünür. Bildirimle aynı samimi dili kullanır.
 */
export function ReminderBanner({ count, onPress, onDismiss }: ReminderBannerProps) {
  // Her render'da mesaj değişmesin diye sabitleniyor.
  const nudge = useMemo(() => pickNudge(), []);

  return (
    <View style={styles.banner}>
      <Text style={styles.emoji}>🔔</Text>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${count} kalemin fiyatını güncelle`}
        onPress={onPress}
        style={styles.body}
      >
        <Text style={[typography.bodyStrong, styles.title]}>{nudge.title}</Text>
        <Text style={[typography.caption, styles.text]}>
          {count} kalemin fiyatını epeydir güncellemedin. Karnen yanlış çıkabilir.
        </Text>
      </Pressable>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Şimdilik kapat"
        onPress={onDismiss}
        style={styles.close}
      >
        <Ionicons name="close" size={18} color={colors.gold} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.lg,
    backgroundColor: colors.goldSoft,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.gold,
  },
  emoji: { fontSize: 22, lineHeight: 28 },
  body: { flex: 1, gap: 2 },
  title: { color: colors.gold, fontFamily: fonts.bodyBold },
  text: { color: colors.textMuted },
  close: { width: TOUCH_TARGET, height: TOUCH_TARGET, alignItems: 'center', justifyContent: 'center' },
});
