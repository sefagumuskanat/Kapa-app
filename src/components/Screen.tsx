import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import {
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { OfflineBanner } from './StateViews';
import { colors, layout, spacing, TOUCH_TARGET, typography } from '@/theme';

interface ScreenProps {
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
  scroll?: boolean;
  offline?: boolean;
  onRefresh?: () => void;
  refreshing?: boolean;
  onBack?: () => void;
  headerRight?: React.ReactNode;
  contentStyle?: ViewStyle;
}

export function Screen({
  title,
  subtitle,
  children,
  scroll = true,
  offline = false,
  onRefresh,
  refreshing = false,
  onBack,
  headerRight,
  contentStyle,
}: ScreenProps) {
  const header =
    title || onBack ? (
      <View style={styles.header}>
        {onBack ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Geri"
            onPress={onBack}
            style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}
          >
            <Ionicons name="chevron-back" size={22} color={colors.text} />
          </Pressable>
        ) : null}
        <View style={styles.headerText}>
          {title ? (
            <Text style={[typography.title, styles.title]} numberOfLines={1}>
              {title}
            </Text>
          ) : null}
          {subtitle ? (
            <Text style={[typography.caption, styles.subtitle]} numberOfLines={2}>
              {subtitle}
            </Text>
          ) : null}
        </View>
        {headerRight ? <View style={styles.headerRight}>{headerRight}</View> : null}
      </View>
    ) : null;

  const body = scroll ? (
    <ScrollView
      contentContainerStyle={[styles.content, contentStyle]}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
      refreshControl={
        onRefresh ? (
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.textMuted}
          />
        ) : undefined
      }
    >
      {children}
    </ScrollView>
  ) : (
    <View style={[styles.content, styles.flex, contentStyle]}>{children}</View>
  );

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      {header}
      {offline ? <OfflineBanner onRetry={onRefresh} /> : null}
      {body}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  flex: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: layout.screenPadding,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
  },
  backButton: {
    width: TOUCH_TARGET,
    height: TOUCH_TARGET,
    marginLeft: -spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: { opacity: 0.6 },
  headerText: { flex: 1, gap: 2 },
  headerRight: { marginLeft: spacing.sm },
  title: { color: colors.text },
  subtitle: { color: colors.textMuted },
  content: {
    paddingHorizontal: layout.screenPadding,
    paddingBottom: spacing.xxxl,
    gap: spacing.md,
  },
});
