import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Pressable, StyleSheet, Switch, Text, View } from 'react-native';

import { colors, radius, spacing, TOUCH_TARGET, typography } from '@/theme';

interface BaseRowProps {
  icon?: keyof typeof Ionicons.glyphMap;
  title: string;
  description?: string;
  tone?: 'default' | 'danger';
}

interface ToggleRowProps extends BaseRowProps {
  value: boolean;
  onValueChange: (value: boolean) => void;
  disabled?: boolean;
}

export function ToggleRow({
  icon,
  title,
  description,
  value,
  onValueChange,
  disabled = false,
}: ToggleRowProps) {
  return (
    <View style={styles.row}>
      {icon ? <Ionicons name={icon} size={20} color={colors.textMuted} style={styles.icon} /> : null}
      <View style={styles.body}>
        <Text style={[typography.bodyStrong, styles.title]}>{title}</Text>
        {description ? (
          <Text style={[typography.caption, styles.description]}>{description}</Text>
        ) : null}
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        disabled={disabled}
        accessibilityLabel={title}
        trackColor={{ false: colors.cardElevated, true: colors.greenSoft }}
        thumbColor={value ? colors.green : colors.textFaint}
        ios_backgroundColor={colors.cardElevated}
      />
    </View>
  );
}

interface ActionRowProps extends BaseRowProps {
  onPress: () => void;
  value?: string;
}

export function ActionRow({
  icon,
  title,
  description,
  value,
  onPress,
  tone = 'default',
}: ActionRowProps) {
  const accent = tone === 'danger' ? colors.red : colors.text;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={title}
      onPress={onPress}
      style={({ pressed }) => [styles.row, pressed && styles.pressed]}
    >
      {icon ? (
        <Ionicons
          name={icon}
          size={20}
          color={tone === 'danger' ? colors.red : colors.textMuted}
          style={styles.icon}
        />
      ) : null}
      <View style={styles.body}>
        <Text style={[typography.bodyStrong, { color: accent }]}>{title}</Text>
        {description ? (
          <Text style={[typography.caption, styles.description]}>{description}</Text>
        ) : null}
      </View>
      {value ? <Text style={[typography.caption, styles.value]}>{value}</Text> : null}
      <Ionicons name="chevron-forward" size={16} color={colors.textFaint} />
    </Pressable>
  );
}

/** Ayar gruplarını başlıklandıran bölüm sarmalayıcı. */
export function Section({
  title,
  footer,
  children,
}: {
  title: string;
  footer?: string;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.section}>
      <Text style={[typography.label, styles.sectionTitle]}>{title.toLocaleUpperCase('tr-TR')}</Text>
      <View style={styles.sectionBody}>{children}</View>
      {footer ? <Text style={[typography.caption, styles.footer]}>{footer}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    minHeight: TOUCH_TARGET + 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 4,
  },
  pressed: { opacity: 0.7 },
  icon: { width: 24, textAlign: 'center' },
  body: { flex: 1, gap: 2 },
  title: { color: colors.text },
  description: { color: colors.textMuted },
  value: { color: colors.textMuted },
  section: { gap: spacing.sm },
  sectionTitle: { color: colors.textFaint, paddingHorizontal: spacing.xs },
  sectionBody: {
    backgroundColor: colors.card,
    borderRadius: radius.xl,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  footer: { color: colors.textFaint, paddingHorizontal: spacing.xs },
});
