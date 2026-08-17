import { Ionicons } from '@expo/vector-icons';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import {
  AdSlotView,
  AssetRow,
  Card,
  Disclaimer,
  DonutChart,
  EmptyState,
  ErrorState,
  PaywallTeaser,
  PortfolioSkeleton,
  RankBadge,
  SourceStamp,
  ValueCardRow,
} from '@/components';
import { Screen } from '@/components/Screen';
import type { DonutSlice } from '@/components';
import type { RootStackParamList, TabParamList } from '@/navigation/types';
import { rankService } from '@/services';
import { useApp } from '@/store/AppContext';
import { colors, fonts, radius, spacing, typography } from '@/theme';
import { RankResult } from '@/types';
import { AdOverlay, Button } from '@/components';
import { ReminderBanner } from '@/components/ReminderBanner';
import { liralikAdamsin } from '@/components/ShareCard';
import { BRAND, EMPTY, resolveKapaTier } from '@/content/vibes';
import { CATEGORY_LABEL, formatCurrency, formatSignedCurrency } from '@/utils/format';

type Props = BottomTabScreenProps<TabParamList, 'Home'>;

/**
 * Açılış reklamı uygulama başına bir kez. Bileşen state'i yetmiyor: ana ekran
 * boş listede erken dönüyor, orada AdOverlay hiç mount edilmiyor. Bayrak
 * olmasaydı kullanıcı ilk varlığını eklediği anda — yani kutlama ekranının
 * üstünde — "açılış" reklamı patlıyordu. Bayrak ayrıca sekmeler arası gidip
 * gelirken reklamın tekrar açılmasını da engelliyor.
 */
let appOpenAdConsumed = false;

export function HomeScreen({ navigation }: Props) {
  const root = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const {
    status,
    error,
    offline,
    revaluating,
    assets,
    valuations,
    portfolio,
    consent,
    isPremium,
    reload,
    revaluate,
    loadDemoData,
    staleAssets,
    dismissReminder,
    migrationNotice,
    dismissMigrationNotice,
  } = useApp();

  const [rank, setRank] = useState<RankResult | null>(null);
  // Açılışta bir kez reklam; premium'da AdOverlay kendini atlar.
  const [openAdVisible, setOpenAdVisible] = useState(!appOpenAdConsumed);
  // Paylaşımdan önce reklam.
  const [shareAdVisible, setShareAdVisible] = useState(false);

  useEffect(() => {
    appOpenAdConsumed = true;
  }, []);

  useEffect(() => {
    if (!consent.granted || !portfolio) {
      setRank(null);
      return;
    }
    let active = true;
    void rankService.getRank(portfolio.totals.normal, isPremium).then((result) => {
      if (active) setRank(result);
    });
    return () => {
      active = false;
    };
  }, [consent.granted, portfolio, isPremium]);

  const slices = useMemo<DonutSlice[]>(
    () =>
      (portfolio?.byCategory ?? []).map((entry) => ({
        key: entry.category,
        label: CATEGORY_LABEL[entry.category],
        value: entry.normalValue,
      })),
    [portfolio],
  );

  const recent = useMemo(
    () =>
      [...assets]
        .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
        .slice(0, 3),
    [assets],
  );

  if (status === 'error') {
    return (
      <Screen title={BRAND.name} subtitle={BRAND.tagline}>
        <ErrorState
          description={error ?? 'Bir şeyler yüklenemedi. Bir daha deneyelim mi?'}
          onRetry={() => void reload()}
        />
      </Screen>
    );
  }

  if (status === 'loading' || (revaluating && !portfolio)) {
    return (
      <Screen title={BRAND.name} subtitle={BRAND.tagline}>
        <PortfolioSkeleton />
      </Screen>
    );
  }

  if (status === 'empty' || assets.length === 0) {
    return (
      <Screen title={BRAND.name} subtitle={BRAND.tagline} offline={offline}>
        <EmptyState
          emoji={EMPTY.home.emoji}
          title={EMPTY.home.title}
          description={EMPTY.home.line}
          actionLabel="Hadi bir şeyler ekle"
          onAction={() => root.navigate('AddAsset')}
        />
      </Screen>
    );
  }

  const totals = portfolio?.totals ?? { fast: 0, normal: 0, patient: 0 };
  const tier = resolveKapaTier(totals.normal);

  return (
    <Screen
      title={BRAND.name}
      subtitle={BRAND.tagline}
      offline={offline}
      onRefresh={() => void revaluate()}
      refreshing={revaluating}
      headerRight={
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Fiyatları yenile"
          onPress={() => void revaluate()}
          style={styles.headerAction}
        >
          <Ionicons name="refresh" size={20} color={colors.textMuted} />
        </Pressable>
      }
    >
      <AdOverlay
        slot="app-open"
        visible={openAdVisible}
        onFinished={() => setOpenAdVisible(false)}
        onUpgrade={() => {
          setOpenAdVisible(false);
          root.navigate('Paywall', { source: 'app-open-ad' });
        }}
      />

      <AdOverlay
        slot="before-share"
        visible={shareAdVisible}
        onFinished={() => {
          setShareAdVisible(false);
          root.navigate('Share');
        }}
        onUpgrade={() => {
          setShareAdVisible(false);
          root.navigate('Paywall', { source: 'share-ad' });
        }}
      />

      {/* Karne: "kaç paralık adamsın" sorusunun doğrudan cevabı. */}
      <Card elevated style={styles.totalCard}>
        <View style={styles.verdictRow}>
          <Text style={styles.verdictEmoji}>{tier.emoji}</Text>
          <View style={styles.verdictText}>
            <Text style={[typography.heading, styles.verdictTitle]}>{tier.title}</Text>
            <Text style={[typography.caption, styles.verdictLine]}>{tier.line}</Text>
          </View>
        </View>

        <View style={styles.verdictDivider} />

        <Text style={[typography.label, styles.totalLabel]}>ELİNDEKİLERİN TOPLAMI</Text>
        <Text
          style={[typography.display, styles.totalValue]}
          numberOfLines={1}
          adjustsFontSizeToFit
          minimumFontScale={0.6}
        >
          {formatCurrency(totals.normal)}
        </Text>

        {/* Asıl replik: rakamın hemen altında. */}
        <Text
          style={[typography.heading, styles.punchline]}
          numberOfLines={2}
          adjustsFontSizeToFit
          minimumFontScale={0.7}
        >
          {liralikAdamsin(totals.normal)}
        </Text>

        {portfolio?.unrealizedGain != null ? (
          <View style={styles.gainPill}>
            <Ionicons
              name={portfolio.unrealizedGain >= 0 ? 'arrow-up' : 'arrow-down'}
              size={12}
              color={portfolio.unrealizedGain >= 0 ? colors.green : colors.red}
            />
            <Text
              style={[
                typography.caption,
                { color: portfolio.unrealizedGain >= 0 ? colors.green : colors.red },
              ]}
            >
              {formatSignedCurrency(portfolio.unrealizedGain)}
            </Text>
          </View>
        ) : null}

        <Button
          label="Paylaş 🚀"
          onPress={() => setShareAdVisible(true)}
          variant="secondary"
          fullWidth
        />
        <Text style={[typography.caption, styles.shareHint]}>
          Düşman çatlatacaksan buradan paylaş
        </Text>
      </Card>

      {/* Eski sürümden veri taşındıysa kullanıcıya söyle — sessiz kalmak olmaz. */}
      {migrationNotice ? (
        <Card style={styles.migrationCard}>
          <Text style={[typography.subheading, styles.migrationTitle]}>🔄 Kayıtların güncellendi</Text>
          <Text style={[typography.caption, styles.migrationText]}>
            {migrationNotice.migrated > 0
              ? `${migrationNotice.migrated} kalem yeni sürüme taşındı. Değerlerini bir kontrol et, gerekirse güncelle.`
              : ''}
            {migrationNotice.dropped > 0
              ? ` ${migrationNotice.dropped} kayıt okunamadı ve listeden çıkarıldı, kusura bakma.`
              : ''}
          </Text>
          <Button label="Tamam" onPress={dismissMigrationNotice} variant="secondary" fullWidth />
        </Card>
      ) : null}

      {staleAssets.length > 0 ? (
        <ReminderBanner
          count={staleAssets.length}
          onPress={() => navigation.navigate('Assets')}
          onDismiss={() => void dismissReminder()}
        />
      ) : null}

      {/* Üç senaryo kartı */}
      <ValueCardRow fast={totals.fast} normal={totals.normal} patient={totals.patient} />

      {/* Kategori dağılımı */}
      <Card style={styles.chartCard}>
        <Text style={[typography.subheading, styles.sectionTitle]}>🍰 Paran nerede duruyor?</Text>
        <DonutChart
          slices={slices}
          centerValue={formatCurrency(totals.normal, 'TRY', true)}
          centerLabel="toplam"
        />
      </Card>

      {/* Sıralama özeti */}
      <Pressable
        accessibilityRole="button"
        onPress={() => navigation.navigate('Ranking')}
        style={({ pressed }) => [styles.rankRow, pressed && styles.pressed]}
      >
        <RankBadge rank={rank} consentGranted={consent.granted} />
        <Ionicons name="chevron-forward" size={16} color={colors.textFaint} />
      </Pressable>

      {!isPremium ? (
        <PaywallTeaser
          title="Premium’a bir bakıver"
          description="Sıralamada tam olarak nerede olduğunu gör, reklamlardan kurtul."
          onPress={() => root.navigate('Paywall', { source: 'home' })}
        />
      ) : null}

      {/* Son varlıklar */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={[typography.subheading, styles.sectionTitle]}>🆕 Son eklediklerin</Text>
          <Pressable accessibilityRole="button" onPress={() => navigation.navigate('Assets')}>
            <Text style={[typography.caption, styles.link]}>Hepsi</Text>
          </Pressable>
        </View>
        <View style={styles.list}>
          {recent.map((asset) => (
            <AssetRow
              key={asset.id}
              asset={asset}
              valuation={valuations[asset.id] ?? null}
              onPress={() => root.navigate('AssetDetail', { assetId: asset.id })}
            />
          ))}
        </View>
      </View>

      {portfolio ? (
        <SourceStamp label="Rakamlar demo fiyat listesinden geldi" timestamp={portfolio.createdAt} />
      ) : null}

      <AdSlotView slot="home-footer" onPressCta={() => root.navigate('Paywall', { source: 'ad' })} />

      <Disclaimer />
    </Screen>
  );
}

const styles = StyleSheet.create({
  headerAction: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  totalCard: { gap: spacing.sm },
  verdictRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  verdictEmoji: { fontSize: 40, lineHeight: 48 },
  verdictText: { flex: 1, gap: 2 },
  verdictTitle: { color: colors.text },
  verdictLine: { color: colors.textMuted },
  verdictDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
    marginVertical: spacing.xs,
  },
  totalLabel: { color: colors.textFaint },
  totalValue: { color: colors.green },
  punchline: { color: colors.text, marginBottom: spacing.xs },
  migrationCard: { gap: spacing.sm, backgroundColor: colors.goldSoft, borderColor: colors.gold },
  migrationTitle: { color: colors.gold },
  migrationText: { color: colors.textMuted },
  shareHint: { color: colors.textMuted, textAlign: 'center' },
  gainPill: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.pill,
    backgroundColor: colors.cardElevated,
  },

  chartCard: { gap: spacing.md },
  sectionTitle: { color: colors.text },
  section: { gap: spacing.sm },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  link: { color: colors.green, fontFamily: fonts.bodySemi },
  list: { gap: spacing.sm },

  rankRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.xs,
  },
  pressed: { opacity: 0.7 },
});
