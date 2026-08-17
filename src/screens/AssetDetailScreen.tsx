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
import { colors, fonts, radius, spacing, typography } from '@/theme';
import { getAssetType } from '@/catalog';
import { DELETE_ASSET } from '@/content/vibes';
import { AcquisitionSource } from '@/types';
import {
  CATEGORY_LABEL,
  CONDITION_LABEL,
  formatCurrency,
  formatDate,
  formatRelativeTime,
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
  const { assets, valuations, deleteAsset, offline } = useApp();

  const asset = useMemo(() => assets.find((item) => item.id === assetId) ?? null, [assets, assetId]);
  const valuation = valuations[assetId] ?? null;
  const assetType = getAssetType(asset?.typeId);
  const typeFields = assetType?.fields ?? [];
  // Altın/gümüş otomatik; diğerleri kullanıcı elini değdirmeden bayatlar.
  const needsManualUpdate = assetType != null && assetType.pricing !== 'metal';

  if (!asset) {
    return (
      <Screen title="Varlık" onBack={() => navigation.goBack()}>
        <ErrorState
          title="Böyle bir şeyin yok"
          description="Silinmiş olabilir. Listeye dönelim mi?"
          onRetry={() => navigation.goBack()}
        />
      </Screen>
    );
  }

  const confirmDelete = () => {
    Alert.alert(
      DELETE_ASSET.title,
      DELETE_ASSET.body(asset.name),
      [
        { text: DELETE_ASSET.cancel, style: 'cancel' },
        {
          text: DELETE_ASSET.confirm,
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
        <Text style={[typography.subheading, styles.cardTitle]}>🎯 Ne kadar eminiz?</Text>
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
        <Text style={[typography.subheading, styles.cardTitle]}>🧾 Kaça almıştın</Text>

        {asset.lots.length === 0 ? (
          <Text style={[typography.body, styles.muted]}>
            Alım bilgisi girmemişsin. O yüzden kâr mı zarar mı, bilemiyoruz.
          </Text>
        ) : (
          <View style={styles.lotList}>
            {asset.lots.map((lot, index) => (
              <View key={lot.id} style={styles.lotRow}>
                <View style={styles.lotBody}>
                  <Text style={[typography.bodyStrong, styles.lotTitle]}>
                    {index + 1}. alım · {lot.quantity} {UNIT_LABEL[asset.unit]}
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
                    ? 'meçhul'
                    : formatCurrency(lot.unitCost * lot.quantity, lot.currency, true)}
                </Text>
              </View>
            ))}
          </View>
        )}

        <View style={styles.divider} />

        <View style={styles.summaryRow}>
          <Text style={[typography.body, styles.muted]}>Cebinden çıkan</Text>
          <Text style={[typography.bodyStrong, styles.summaryValue]}>
            {valuation?.acquisitionCost == null
              ? 'Bilmiyoruz'
              : formatCurrency(valuation.acquisitionCost)}
          </Text>
        </View>

        <View style={styles.summaryRow}>
          <Text style={[typography.body, styles.muted]}>Kâr mı, zarar mı?</Text>
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
            🤷 Alımlardan en az birinin fiyatını bilmiyoruz. Uydurmaktansa söylememeyi tercih ediyoruz.
          </Text>
        ) : null}
      </Card>

      {/* Türe özel bilgiler */}
      {typeFields.length > 0 ? (
        <Card style={styles.card}>
          <Text style={[typography.subheading, styles.cardTitle]}>📋 Bilgileri</Text>
          {typeFields.map((field) => {
            const raw = asset.attributes[field.key];
            if (!raw) return null;
            const option = field.options?.find((o) => o.value === raw);
            return (
              <View key={field.key} style={styles.summaryRow}>
                <Text style={[typography.body, styles.muted]}>{field.label}</Text>
                <Text style={[typography.bodyStrong, styles.summaryValue]}>
                  {option?.label ?? raw}
                  {field.suffix ? ` ${field.suffix}` : ''}
                </Text>
              </View>
            );
          })}
        </Card>
      ) : null}

      {/* Alt parçalar */}
      {asset.components.length > 0 ? (
        <Card style={styles.card}>
          <Text style={[typography.subheading, styles.cardTitle]}>🧩 Yanında gelenler</Text>
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

      {/* Elle güncellenen kalemler için hızlı güncelleme yolu */}
      {needsManualUpdate ? (
        <Card style={styles.card}>
          <Text style={[typography.subheading, styles.cardTitle]}>🔄 Değerini güncelle</Text>
          <Text style={[typography.body, styles.muted]}>
            Bunun fiyatını piyasadan çekemiyoruz. Son güncelleme:{' '}
            {formatRelativeTime(asset.valueUpdatedAt ?? asset.updatedAt)}.
          </Text>
          <Button
            label="Fiyatı güncelle"
            onPress={() => navigation.navigate('AddAsset', { assetId: asset.id })}
            variant="secondary"
            icon="refresh"
            fullWidth
          />
        </Card>
      ) : (
        <Card style={styles.card}>
          <Text style={[typography.subheading, styles.cardTitle]}>📈 Otomatik takip</Text>
          <Text style={[typography.body, styles.muted]}>
            Bunun değerini piyasa fiyatından biz hesaplıyoruz; senin güncellemene gerek yok.
          </Text>
        </Card>
      )}

      {asset.notes ? (
        <Card style={styles.card}>
          <Text style={[typography.subheading, styles.cardTitle]}>📝 Notun</Text>
          <Text style={[typography.body, styles.muted]}>{asset.notes}</Text>
        </Card>
      ) : null}

      <Button
        label="Düzenle"
        onPress={() => navigation.navigate('AddAsset', { assetId: asset.id })}
        variant="secondary"
        icon="create-outline"
        fullWidth
      />
      <Button label="Sil gitsin" onPress={confirmDelete} variant="danger" icon="trash-outline" fullWidth />

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
  link: { color: colors.green, fontFamily: fonts.bodySemi },

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
