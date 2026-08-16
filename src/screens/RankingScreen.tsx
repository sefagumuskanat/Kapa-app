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
  Skeleton,
} from '@/components';
import { Screen } from '@/components/Screen';
import type { RootStackParamList, TabParamList } from '@/navigation/types';
import { rankService } from '@/services';
import { COHORT_VIBE, RANK_PITCH } from '@/content/vibes';
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
  const vibe = rank ? COHORT_VIBE[rank.cohort] : null;

  if (!consent.granted) {
    return (
      <Screen title="Sıralama" subtitle="Şu an kapalı" offline={offline}>
        <EmptyState
          emoji={RANK_PITCH.emoji}
          title={RANK_PITCH.title}
          description={RANK_PITCH.line}
        />

        <Card style={styles.card}>
          <Text style={[typography.subheading, styles.cardTitle]}>✅ Açarsan bunlar gider</Text>
          {SHARED_ITEMS.map((item) => (
            <View key={item} style={styles.bulletRow}>
              <Ionicons name="checkmark-circle-outline" size={16} color={colors.green} />
              <Text style={[typography.body, styles.bulletText]}>{item}</Text>
            </View>
          ))}
          <View style={styles.divider} />
          <Text style={[typography.subheading, styles.cardTitle]}>🚫 Bunlar asla gitmez</Text>
          {NEVER_SHARED.map((item) => (
            <View key={item} style={styles.bulletRow}>
              <Ionicons name="close-circle-outline" size={16} color={colors.red} />
              <Text style={[typography.body, styles.bulletText]}>{item}</Text>
            </View>
          ))}
        </Card>

        <Button
          label="Varım, sok beni sıralamaya"
          onPress={() => {
            setToggling(true);
            void setRankConsent(true).finally(() => setToggling(false));
          }}
          loading={toggling}
          size="lg"
          fullWidth
        />
        <Disclaimer text="Burası bir yarışma değil, sosyal medya hiç değil. Kimsenin listesini göremezsin, kimse de seninkini göremez." />
      </Screen>
    );
  }

  return (
    <Screen title="Sıralama" subtitle="İsimsiz, gruplu" offline={offline}>
      {loading ? (
        <View style={styles.skeletonGroup}>
          <Skeleton height={120} r={radius.xl} />
          <Skeleton height={80} r={radius.xl} />
        </View>
      ) : (
        <Card elevated style={styles.card}>
          <Text style={styles.cohortEmoji}>{vibe?.emoji ?? '🏆'}</Text>
          <Text style={[typography.title, styles.cohortTitle]}>{vibe?.title ?? '—'}</Text>
          <Text style={[typography.body, styles.muted]}>
            {vibe?.line} Senin ligde {rank?.cohortSizeBucket ?? '—'} var.
          </Text>

          <View style={styles.divider} />

          <View style={styles.metricRow}>
            <Text style={[typography.body, styles.muted]}>Yarışa giren rakam</Text>
            <Text style={[typography.bodyStrong, styles.metricValue]}>
              {formatCurrency(normalValue, 'TRY', true)}
            </Text>
          </View>
          <Text style={[typography.caption, styles.faint]}>
Sadece “normal satarsan” rakamın yarışıyor. Diğer iki senaryo burada işe karışmıyor.
          </Text>

          <View style={styles.divider} />

          <View style={styles.metricRow}>
            <Text style={[typography.body, styles.muted]}>Nerelerdesin</Text>
            <Text style={[typography.bodyStrong, styles.metricValue]}>
              {rank ? (rank.detailLocked ? '🔒 Premium’da' : rank.maskedPercentile) : '—'}
            </Text>
          </View>
        </Card>
      )}

      {rank?.detailLocked ? (
        <PaywallTeaser
          title="Tam olarak nerede olduğunu gör"
          description="Grubun neresindesin, zamanla ne oldu — hepsi premium’da."
          onPress={() => root.navigate('Paywall', { source: 'ranking' })}
        />
      ) : null}

      <Card style={styles.card}>
        <Text style={[typography.subheading, styles.cardTitle]}>📤 Giden veri bu kadar</Text>
        <Text style={[typography.caption, styles.faint]}>
          Sunucuya gönderdiğimiz her şey aşağıda. Fazlası yok:
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
        label="Beni sıralamadan çıkar"
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
      <Disclaimer text="Sıralama tahmini rakamlara göre. Yani bununla övünmek serbest ama fazla ciddiye alma. 🙂" />
    </Screen>
  );
}

const SHARED_ITEMS = [
  'Uydurma bir takma ad (telefonunda üretilir, seninle bağı yok)',
  'Toplamının hangi aralıkta olduğu — ör. “250B-1,5M” (kesin rakam bile değil)',
  'Hangi gruptasın',
];

const NEVER_SHARED = [
  'Neyin var, ne yazdın, ne not düştün',
  'Hangi kategoride ne kadarın olduğu',
  'Adın, e-postan, nerede oturduğun, telefonun kim olduğu',
  'Diğer iki senaryodaki rakamların',
];

const styles = StyleSheet.create({
  card: { gap: spacing.sm },
  cardTitle: { color: colors.text },
  cohortEmoji: { fontSize: 40, lineHeight: 48 },
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
