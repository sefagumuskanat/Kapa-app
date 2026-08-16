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
import { colors, radius, spacing, typography } from '@/theme';
import { RankResult } from '@/types';
import {
  CATEGORY_LABEL,
  confidenceLabel,
  formatCurrency,
  formatSignedCurrency,
} from '@/utils/format';

type Props = BottomTabScreenProps<TabParamList, 'Home'>;

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
  } = useApp();

  const [rank, setRank] = useState<RankResult | null>(null);

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
      <Screen title="KAPAMETRE" subtitle="Varlığını ölç.">
        <ErrorState description={error ?? 'Veriler yüklenemedi.'} onRetry={() => void reload()} />
      </Screen>
    );
  }

  if (status === 'loading' || (revaluating && !portfolio)) {
    return (
      <Screen title="KAPAMETRE" subtitle="Varlığını ölç.">
        <PortfolioSkeleton />
      </Screen>
    );
  }

  if (status === 'empty' || assets.length === 0) {
    return (
      <Screen title="KAPAMETRE" subtitle="Varlığını ölç." offline={offline}>
        <EmptyState
          icon="cube-outline"
          title="Henüz varlık yok"
          description="İlk varlığını ekle; Hızlı Satış, Normal Satış ve Tok Satıcı değerlerini hemen gör."
          actionLabel="Varlık ekle"
          onAction={() => root.navigate('AddAsset')}
          secondaryActionLabel="Demo veriyi yükle"
          onSecondaryAction={() => void loadDemoData()}
        />
      </Screen>
    );
  }

  const totals = portfolio?.totals ?? { fast: 0, normal: 0, patient: 0 };

  return (
    <Screen
      title="KAPAMETRE"
      subtitle="Varlığını ölç."
      offline={offline}
      onRefresh={() => void revaluate()}
      refreshing={revaluating}
      headerRight={
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Belge tara"
          onPress={() => root.navigate('Ocr')}
          style={styles.headerAction}
        >
          <Ionicons name="scan-outline" size={20} color={colors.textMuted} />
        </Pressable>
      }
    >
      {/* Toplam varlık — Normal Satış ana metriktir. */}
      <Card elevated style={styles.totalCard}>
        <Text style={[typography.label, styles.totalLabel]}>TOPLAM VARLIK · NORMAL SATIŞ</Text>
        <Text
          style={[typography.display, styles.totalValue]}
          numberOfLines={1}
          adjustsFontSizeToFit
          minimumFontScale={0.6}
        >
          {formatCurrency(totals.normal)}
        </Text>

        <View style={styles.totalMetaRow}>
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
          <Text style={[typography.caption, styles.assetCount]}>
            {portfolio?.assetCount ?? 0} varlık
          </Text>
        </View>

        {portfolio && portfolio.unknownCostAssetCount > 0 ? (
          <Text style={[typography.caption, styles.warning]}>
            {portfolio.unknownCostAssetCount} varlığın edinim maliyeti bilinmiyor; kâr/zarar
            yalnızca maliyeti bilinenler üzerinden hesaplandı.
          </Text>
        ) : null}

        <View style={styles.confidenceRow}>
          <Ionicons name="pulse-outline" size={13} color={colors.textMuted} />
          <Text style={[typography.caption, styles.confidenceText]}>
            Ortalama güven: {confidenceLabel(portfolio?.averageConfidence ?? 0)}
          </Text>
        </View>
      </Card>

      {/* Üç senaryo kartı */}
      <ValueCardRow fast={totals.fast} normal={totals.normal} patient={totals.patient} />

      {/* Kategori dağılımı */}
      <Card style={styles.chartCard}>
        <Text style={[typography.subheading, styles.sectionTitle]}>Dağılım</Text>
        <DonutChart
          slices={slices}
          centerValue={formatCurrency(totals.normal, 'TRY', true)}
          centerLabel="Normal Satış"
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
          title="Premium ile daha fazlası"
          description="Detaylı sıralama, değerleme geçmişi ve reklamsız kullanım."
          onPress={() => root.navigate('Paywall', { source: 'home' })}
        />
      ) : null}

      {/* Son varlıklar */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={[typography.subheading, styles.sectionTitle]}>Son varlıklar</Text>
          <Pressable accessibilityRole="button" onPress={() => navigation.navigate('Assets')}>
            <Text style={[typography.caption, styles.link]}>Tümü</Text>
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
        <SourceStamp label="Değerler demo referans tablosundan hesaplandı" timestamp={portfolio.createdAt} />
      ) : null}

      <AdSlotView slot="home-footer" onPressCta={() => root.navigate('Paywall', { source: 'ad' })} />

      <Disclaimer />
    </Screen>
  );
}

const styles = StyleSheet.create({
  headerAction: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  totalCard: { gap: spacing.sm },
  totalLabel: { color: colors.textMuted },
  totalValue: { color: colors.green },
  totalMetaRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  gainPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.pill,
    backgroundColor: colors.cardElevated,
  },
  assetCount: { color: colors.textMuted, marginLeft: 'auto' },
  warning: { color: colors.gold },
  confidenceRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  confidenceText: { color: colors.textMuted },

  chartCard: { gap: spacing.md },
  sectionTitle: { color: colors.text },
  section: { gap: spacing.sm },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  link: { color: colors.green, fontWeight: '600' },
  list: { gap: spacing.sm },

  rankRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.xs,
  },
  pressed: { opacity: 0.7 },
});
