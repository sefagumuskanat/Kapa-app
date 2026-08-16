import { Ionicons } from '@expo/vector-icons';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import {
  AdSlotView,
  Button,
  Card,
  Disclaimer,
  EmptyState,
  PaywallTeaser,
  RankBadge,
  Skeleton,
} from '@/components';
import { Screen } from '@/components/Screen';
import type { RootStackParamList, TabParamList } from '@/navigation/types';
import { COHORT_LABEL, rankService } from '@/services';
import { useApp } from '@/store/AppContext';
import { colors, radius, spacing, typography } from '@/theme';
import { RankResult } from '@/types';
import { formatCurrency } from '@/utils/format';

type Props = BottomTabScreenProps<TabParamList, 'Ranking'>;

export function RankingScreen({}: Props) {
  const root = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { consent, portfolio, isPremium, offline, setRankConsent } = useApp();

  const [rank, setRank] = useState<RankResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [toggling, setToggling] = useState(false);

  useEffect(() => {
    if (!consent.granted || !portfolio) {
      setRank(null);
      return;
    }
    let active = true;
    setLoading(true);
    void rankService.getRank(portfolio.totals.normal, isPremium).then((result) => {
      if (!active) return;
      setRank(result);
      setLoading(false);
    });
    return () => {
      active = false;
    };
  }, [consent.granted, portfolio, isPremium]);

  const normalValue = portfolio?.totals.normal ?? 0;

  if (!consent.granted) {
    return (
      <Screen title="Sıralama" subtitle="İsteğe bağlı, kapalı" offline={offline}>
        <EmptyState
          icon="lock-closed-outline"
          title="Sıralama kapalı"
          description="Katılım tamamen isteğe bağlıdır. Açarsan yalnızca Normal Satış toplamın takma bir kimlikle kohort hesabına katılır."
        />

        <Card style={styles.card}>
          <Text style={[typography.subheading, styles.cardTitle]}>Açarsan ne paylaşılır?</Text>
          {SHARED_ITEMS.map((item) => (
            <View key={item} style={styles.bulletRow}>
              <Ionicons name="checkmark-circle-outline" size={16} color={colors.green} />
              <Text style={[typography.body, styles.bulletText]}>{item}</Text>
            </View>
          ))}
          <View style={styles.divider} />
          <Text style={[typography.subheading, styles.cardTitle]}>Asla paylaşılmaz</Text>
          {NEVER_SHARED.map((item) => (
            <View key={item} style={styles.bulletRow}>
              <Ionicons name="close-circle-outline" size={16} color={colors.red} />
              <Text style={[typography.body, styles.bulletText]}>{item}</Text>
            </View>
          ))}
        </Card>

        <Button
          label="Sıralamaya katıl"
          onPress={() => {
            setToggling(true);
            void setRankConsent(true).finally(() => setToggling(false));
          }}
          loading={toggling}
          size="lg"
          fullWidth
        />
        <Disclaimer text="Sıralama bir yarışma veya sosyal özellik değildir; kullanıcı listesi gösterilmez." />
      </Screen>
    );
  }

  return (
    <Screen title="Sıralama" subtitle="Kohort bazlı, kimliksiz" offline={offline}>
      {loading ? (
        <View style={styles.skeletonGroup}>
          <Skeleton height={120} r={radius.xl} />
          <Skeleton height={80} r={radius.xl} />
        </View>
      ) : (
        <Card elevated style={styles.card}>
          <RankBadge rank={rank} consentGranted={consent.granted} />
          <Text style={[typography.title, styles.cohortTitle]}>
            {rank ? COHORT_LABEL[rank.cohort] : '—'} kohortu
          </Text>
          <Text style={[typography.body, styles.muted]}>
            {rank?.cohortSizeBucket ?? '—'} · benzer büyüklükteki portföylerle karşılaştırılıyor.
          </Text>

          <View style={styles.divider} />

          <View style={styles.metricRow}>
            <Text style={[typography.body, styles.muted]}>Karşılaştırılan değer</Text>
            <Text style={[typography.bodyStrong, styles.metricValue]}>
              {formatCurrency(normalValue, 'TRY', true)}
            </Text>
          </View>
          <Text style={[typography.caption, styles.faint]}>
            Yalnızca Normal Satış toplamı kullanılır. Hızlı Satış ve Tok Satıcı değerleri
            sıralamaya girmez.
          </Text>

          <View style={styles.divider} />

          <View style={styles.metricRow}>
            <Text style={[typography.body, styles.muted]}>Dilimin</Text>
            <Text style={[typography.bodyStrong, styles.metricValue]}>
              {rank ? (rank.detailLocked ? 'Premium ile görünür' : rank.maskedPercentile) : '—'}
            </Text>
          </View>
        </Card>
      )}

      {rank?.detailLocked ? (
        <PaywallTeaser
          title="Detaylı sıralamayı aç"
          description="Kohort içindeki dilimini ve zaman içindeki değişimini gör."
          onPress={() => root.navigate('Paywall', { source: 'ranking' })}
        />
      ) : null}

      <Card style={styles.card}>
        <Text style={[typography.subheading, styles.cardTitle]}>Gönderilen veri</Text>
        <Text style={[typography.caption, styles.faint]}>
          Sunucuya giden payload'ın tamamı budur:
        </Text>
        {Object.entries(rankService.describeOutboundPayload(normalValue, consent)).map(
          ([key, value]) => (
            <View key={key} style={styles.payloadRow}>
              <Text style={[typography.mono, styles.payloadKey]}>{key}</Text>
              <Text style={[typography.mono, styles.payloadValue]}>{value}</Text>
            </View>
          ),
        )}
      </Card>

      <Button
        label="Sıralamadan çık"
        onPress={() => {
          setToggling(true);
          void setRankConsent(false).finally(() => setToggling(false));
        }}
        variant="danger"
        loading={toggling}
        fullWidth
      />

      <AdSlotView
        slot="ranking-footer"
        onPressCta={() => root.navigate('Paywall', { source: 'ranking-ad' })}
      />
      <Disclaimer text="Sıralama tahmini değerlere dayanır ve yatırım tavsiyesi değildir." />
    </Screen>
  );
}

const SHARED_ITEMS = [
  'Takma kimlik (cihazda üretilir, hesabınla ilişkilendirilmez)',
  'Normal Satış toplamının kova etiketi (ör. 250K-1.5M)',
  'Kohort adı',
];

const NEVER_SHARED = [
  'Varlık listesi, isimleri veya notların',
  'Kategori kırılımın',
  'Adın, e-postan, konumun veya cihaz kimliğin',
  'Hızlı Satış ve Tok Satıcı değerlerin',
];

const styles = StyleSheet.create({
  card: { gap: spacing.sm },
  cardTitle: { color: colors.text },
  cohortTitle: { color: colors.text },
  muted: { color: colors.textMuted },
  faint: { color: colors.textFaint },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: colors.border, marginVertical: spacing.xs },
  bulletRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm },
  bulletText: { flex: 1, color: colors.textMuted },
  metricRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  metricValue: { color: colors.text },
  payloadRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.md,
    paddingVertical: spacing.xs,
  },
  payloadKey: { color: colors.textFaint },
  payloadValue: { color: colors.green },
  skeletonGroup: { gap: spacing.md },
});
