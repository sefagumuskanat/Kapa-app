import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useMemo } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';

import {
  Button,
  Card,
  ConfidenceBar,
  Disclaimer,
  ErrorState,
  SourceStamp,
  ValueCard,
} from '@/components';
import { Screen } from '@/components/Screen';
import type { RootStackParamList } from '@/navigation/types';
import { useApp } from '@/store/AppContext';
import { colors, radius, spacing, typography } from '@/theme';
import { AcquisitionSource } from '@/types';
import {
  CATEGORY_LABEL,
  CONDITION_LABEL,
  formatCurrency,
  formatDate,
  formatSignedCurrency,
  UNIT_LABEL,
} from '@/utils/format';

type Props = NativeStackScreenProps<RootStackParamList, 'AssetDetail'>;

const SOURCE_LABEL: Record<AcquisitionSource, string> = {
  purchase: 'Satın alım',
  gift: 'Hediye',
  inheritance: 'Miras',
  unknown: 'Bilinmiyor',
};

export function AssetDetailScreen({ navigation, route }: Props) {
  const { assetId } = route.params;
  const { assets, valuations, documents, deleteAsset, offline } = useApp();

  const asset = useMemo(() => assets.find((item) => item.id === assetId) ?? null, [assets, assetId]);
  const valuation = valuations[assetId] ?? null;
  const linkedDocuments = useMemo(
    () => documents.filter((document) => document.linkedAssetId === assetId),
    [documents, assetId],
  );

  if (!asset) {
    return (
      <Screen title="Varlık" onBack={() => navigation.goBack()}>
        <ErrorState
          title="Varlık bulunamadı"
          description="Bu varlık silinmiş olabilir."
          onRetry={() => navigation.goBack()}
        />
      </Screen>
    );
  }

  const confirmDelete = () => {
    Alert.alert(
      'Varlığı sil',
      `"${asset.name}" cihazından kalıcı olarak silinecek. Bu işlem geri alınamaz.`,
      [
        { text: 'Vazgeç', style: 'cancel' },
        {
          text: 'Sil',
          style: 'destructive',
          onPress: () => {
            void deleteAsset(asset.id).then(() => navigation.goBack());
          },
        },
      ],
    );
  };

  return (
    <Screen
      title={asset.name}
      subtitle={`${CATEGORY_LABEL[asset.category]} · ${asset.quantity} ${UNIT_LABEL[asset.unit]} · ${
        CONDITION_LABEL[asset.condition]
      }`}
      offline={offline}
      onBack={() => navigation.goBack()}
      headerRight={
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Düzenle"
          onPress={() => navigation.navigate('AddAsset', { assetId: asset.id })}
          style={styles.headerAction}
        >
          <Ionicons name="create-outline" size={20} color={colors.textMuted} />
        </Pressable>
      }
    >
      {/* Üç değer kartı — dikey, detay ekranında tam okunur. */}
      <View style={styles.valueStack}>
        <ValueCard
          scenario="normal"
          value={valuation?.normalValue ?? 0}
          currency={valuation?.currency}
          emphasized
        />
        <View style={styles.valueRow}>
          <ValueCard scenario="fast" value={valuation?.fastValue ?? 0} currency={valuation?.currency} />
          <ValueCard
            scenario="patient"
            value={valuation?.patientValue ?? 0}
            currency={valuation?.currency}
          />
        </View>
      </View>

      {/* Güven skoru + kaynak — sahte kesinlik yasağının görünür karşılığı. */}
      <Card style={styles.card}>
        <Text style={[typography.subheading, styles.cardTitle]}>Güven ve kaynak</Text>
        <ConfidenceBar
          score={valuation?.confidenceScore ?? 0}
          factors={valuation?.confidenceFactors}
        />
        {valuation ? (
          <SourceStamp label={valuation.source.label} timestamp={valuation.sourceTimestamp} />
        ) : null}
      </Card>

      {/* Edinim kırılımı */}
      <Card style={styles.card}>
        <Text style={[typography.subheading, styles.cardTitle]}>Edinim kırılımı</Text>

        {asset.lots.length === 0 ? (
          <Text style={[typography.body, styles.muted]}>
            Edinim partisi eklenmemiş. Kâr/zarar hesaplanamaz.
          </Text>
        ) : (
          <View style={styles.lotList}>
            {asset.lots.map((lot, index) => (
              <View key={lot.id} style={styles.lotRow}>
                <View style={styles.lotBody}>
                  <Text style={[typography.bodyStrong, styles.lotTitle]}>
                    Parti {index + 1} · {lot.quantity} {UNIT_LABEL[asset.unit]}
                  </Text>
                  <Text style={[typography.caption, styles.muted]}>
                    {formatDate(lot.acquiredAt)} · {SOURCE_LABEL[lot.source]}
                    {lot.note ? ` · ${lot.note}` : ''}
                  </Text>
                </View>
                <Text
                  style={[
                    typography.bodyStrong,
                    lot.unitCost == null ? styles.unknownCost : styles.lotCost,
                  ]}
                >
                  {lot.unitCost == null
                    ? 'bilinmiyor'
                    : formatCurrency(lot.unitCost * lot.quantity, lot.currency, true)}
                </Text>
              </View>
            ))}
          </View>
        )}

        <View style={styles.divider} />

        <View style={styles.summaryRow}>
          <Text style={[typography.body, styles.muted]}>Toplam maliyet</Text>
          <Text style={[typography.bodyStrong, styles.summaryValue]}>
            {valuation?.acquisitionCost == null
              ? 'Hesaplanamıyor'
              : formatCurrency(valuation.acquisitionCost)}
          </Text>
        </View>

        <View style={styles.summaryRow}>
          <Text style={[typography.body, styles.muted]}>Normal Satış farkı</Text>
          <Text
            style={[
              typography.bodyStrong,
              {
                color:
                  valuation?.unrealizedGain == null
                    ? colors.textFaint
                    : valuation.unrealizedGain >= 0
                      ? colors.green
                      : colors.red,
              },
            ]}
          >
            {valuation?.unrealizedGain == null
              ? '—'
              : formatSignedCurrency(valuation.unrealizedGain)}
          </Text>
        </View>

        {valuation?.acquisitionCost == null ? (
          <Text style={[typography.caption, styles.warning]}>
            Partilerden en az birinin maliyeti bilinmediği için toplam maliyet iddia edilmiyor.
          </Text>
        ) : null}
      </Card>

      {/* Alt parçalar */}
      {asset.components.length > 0 ? (
        <Card style={styles.card}>
          <Text style={[typography.subheading, styles.cardTitle]}>Parçalar</Text>
          {asset.components.map((component) => (
            <View key={component.id} style={styles.componentRow}>
              <Ionicons name="git-branch-outline" size={16} color={colors.textFaint} />
              <Text style={[typography.body, styles.componentName]} numberOfLines={1}>
                {component.name}
              </Text>
              <Text style={[typography.caption, styles.muted]}>
                {component.quantity} {UNIT_LABEL[component.unit]} ·{' '}
                {CONDITION_LABEL[component.condition]}
              </Text>
            </View>
          ))}
        </Card>
      ) : null}

      {/* Bağlı belgeler */}
      <Card style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={[typography.subheading, styles.cardTitle]}>Belgeler</Text>
          <Pressable
            accessibilityRole="button"
            onPress={() => navigation.navigate('Ocr', { linkedAssetId: asset.id })}
          >
            <Text style={[typography.caption, styles.link]}>Belge tara</Text>
          </Pressable>
        </View>
        {linkedDocuments.length === 0 ? (
          <Text style={[typography.caption, styles.muted]}>
            Bağlı belge yok. Taranan belgeler yalnızca cihazında kalır.
          </Text>
        ) : (
          linkedDocuments.map((document) => (
            <View key={document.id} style={styles.componentRow}>
              <Ionicons name="document-text-outline" size={16} color={colors.textFaint} />
              <Text style={[typography.body, styles.componentName]} numberOfLines={1}>
                {document.title}
              </Text>
              <Text style={[typography.caption, styles.muted]}>
                {document.extractedFields.length} alan
              </Text>
            </View>
          ))
        )}
      </Card>

      {asset.notes ? (
        <Card style={styles.card}>
          <Text style={[typography.subheading, styles.cardTitle]}>Not</Text>
          <Text style={[typography.body, styles.muted]}>{asset.notes}</Text>
        </Card>
      ) : null}

      <Button
        label="Varlığı düzenle"
        onPress={() => navigation.navigate('AddAsset', { assetId: asset.id })}
        variant="secondary"
        icon="create-outline"
        fullWidth
      />
      <Button label="Varlığı sil" onPress={confirmDelete} variant="danger" icon="trash-outline" fullWidth />

      <Disclaimer />
    </Screen>
  );
}

const styles = StyleSheet.create({
  headerAction: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  valueStack: { gap: spacing.sm },
  valueRow: { flexDirection: 'row', gap: spacing.sm },
  card: { gap: spacing.md },
  cardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  cardTitle: { color: colors.text },
  muted: { color: colors.textMuted },
  warning: { color: colors.gold },
  link: { color: colors.green, fontWeight: '600' },

  lotList: { gap: spacing.sm },
  lotRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  lotBody: { flex: 1, gap: 2 },
  lotTitle: { color: colors.text },
  lotCost: { color: colors.text },
  unknownCost: { color: colors.gold },

  divider: { height: StyleSheet.hairlineWidth, backgroundColor: colors.border },
  summaryRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  summaryValue: { color: colors.text },

  componentRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  componentName: { flex: 1, color: colors.text },
});
