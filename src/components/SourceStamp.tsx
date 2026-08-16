import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { colors, spacing, typography } from '@/theme';
import { formatRelativeTime } from '@/utils/format';

interface SourceStampProps {
  label: string;
  timestamp: string;
}

/** Kaynak + zaman damgası. Değer gösterilen her yerde zorunludur. */
export function SourceStamp({ label, timestamp }: SourceStampProps) {
  return (
    <View style={styles.row}>
      <Ionicons name="information-circle-outline" size={13} color={colors.textFaint} />
      <Text style={[typography.caption, styles.text]} numberOfLines={2}>
        {label} · {formatRelativeTime(timestamp)}
      </Text>
    </View>
  );
}

/** Uygulama genelinde tekrar eden yasal uyarı. */
export function Disclaimer({ text }: { text?: string }) {
  return (
    <Text style={[typography.caption, styles.disclaimer]}>
      {text ??
        'Bu değerler tahminidir, yatırım tavsiyesi değildir ve satış garantisi vermez.'}
    </Text>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  text: { flex: 1, color: colors.textFaint },
  disclaimer: {
    color: colors.textFaint,
    textAlign: 'center',
    paddingHorizontal: spacing.md,
  },
});
