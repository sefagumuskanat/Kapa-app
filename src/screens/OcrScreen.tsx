import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';

import { Button, Card, Chip, ConfidenceBar, Disclaimer, Input, Skeleton } from '@/components';
import { Screen } from '@/components/Screen';
import type { RootStackParamList } from '@/navigation/types';
import { DOCUMENT_KIND_LABEL, ocrService, OcrScanResult } from '@/services';
import { useApp } from '@/store/AppContext';
import { colors, radius, spacing, typography } from '@/theme';
import { DocumentKind } from '@/types';
import { formatPercent } from '@/utils/format';

type Props = NativeStackScreenProps<RootStackParamList, 'Ocr'>;

const KINDS: DocumentKind[] = ['invoice', 'warranty', 'receipt', 'certificate', 'other'];

export function OcrScreen({ navigation, route }: Props) {
  const linkedAssetId = route.params?.linkedAssetId ?? null;
  const { assets, addDocument } = useApp();

  const [kind, setKind] = useState<DocumentKind>('invoice');
  const [title, setTitle] = useState('');
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState<OcrScanResult | null>(null);
  const [saving, setSaving] = useState(false);

  const linkedAsset = assets.find((asset) => asset.id === linkedAssetId) ?? null;

  const scan = async () => {
    setScanning(true);
    setResult(null);
    try {
      const scanResult = await ocrService.scanDocument({ kind, title, linkedAssetId });
      setResult(scanResult);
    } finally {
      setScanning(false);
    }
  };

  const save = async () => {
    if (!result) return;
    setSaving(true);
    try {
      const record = ocrService.toRecord({ kind, title, linkedAssetId }, result);
      await addDocument(record);
      Alert.alert('Kaydedildi 🧾', 'Belge telefonunda duruyor, hiçbir yere gitmedi.');
      navigation.goBack();
    } finally {
      setSaving(false);
    }
  };

  return (
    <Screen
      title="Belge tara"
      subtitle="Sadece kâğıt · eşyanın fotoğrafını istemiyoruz"
      onBack={() => navigation.goBack()}
    >
      <Card style={styles.noticeCard}>
        <View style={styles.noticeRow}>
          <Ionicons name="shield-checkmark-outline" size={18} color={colors.green} />
          <Text style={[typography.caption, styles.notice]}>
Tarama telefonunda oluyor. Görüntü hiçbir yere gitmiyor, biz de görmüyoruz. Burası sadece fatura, garanti, fiş gibi kâğıtlar için — eşyanın fotoğrafını çekmene gerek yok.
          </Text>
        </View>
      </Card>

      {linkedAsset ? (
        <Card style={styles.linkCard}>
          <Ionicons name="link-outline" size={16} color={colors.textMuted} />
          <Text style={[typography.body, styles.linkText]} numberOfLines={1}>
            “{linkedAsset.name}” ile eşleşecek
          </Text>
        </Card>
      ) : null}

      <View>
        <Text style={[typography.caption, styles.fieldLabel]}>Ne belgesi bu?</Text>
        <View style={styles.chipRow}>
          {KINDS.map((item) => (
            <Chip
              key={item}
              label={DOCUMENT_KIND_LABEL[item]}
              selected={kind === item}
              onPress={() => {
                setKind(item);
                setResult(null);
              }}
              tone="green"
            />
          ))}
        </View>
      </View>

      <Input
        label="İsim versen? (şart değil)"
        placeholder={DOCUMENT_KIND_LABEL[kind]}
        value={title}
        onChangeText={setTitle}
      />

      {/* Tarama alanı — kamera yerine stub çerçeve. */}
      <View style={styles.scanFrame}>
        {scanning ? (
          <View style={styles.scanningBody}>
            <Ionicons name="scan-outline" size={32} color={colors.green} />
            <Text style={[typography.caption, styles.muted]}>Belge okunuyor…</Text>
          </View>
        ) : (
          <View style={styles.scanningBody}>
            <Ionicons name="document-text-outline" size={32} color={colors.textFaint} />
            <Text style={[typography.caption, styles.muted]}>
              Demoda kamera açılmıyor, örnek bilgiler geliyor.
            </Text>
          </View>
        )}
      </View>

      <Button
        label={result ? 'Bir daha tara' : 'Taramaya başla'}
        onPress={() => void scan()}
        loading={scanning}
        icon="scan-outline"
        fullWidth
      />

      {scanning ? (
        <View style={styles.skeletonGroup}>
          <Skeleton height={56} r={radius.lg} />
          <Skeleton height={56} r={radius.lg} />
          <Skeleton height={56} r={radius.lg} />
        </View>
      ) : null}

      {result ? (
        <>
          <Card style={styles.resultCard}>
            <Text style={[typography.subheading, styles.cardTitle]}>👀 Neler okuduk</Text>
            {result.fields.map((field) => (
              <View key={field.key} style={styles.fieldRow}>
                <View style={styles.fieldBody}>
                  <Text style={[typography.caption, styles.fieldLabelInline]}>{field.label}</Text>
                  <Text style={[typography.bodyStrong, styles.fieldValue]}>{field.value}</Text>
                </View>
                <View style={styles.fieldConfidence}>
                  <Text
                    style={[
                      typography.caption,
                      { color: field.confidence >= 0.8 ? colors.green : colors.gold },
                    ]}
                  >
                    {formatPercent(field.confidence)}
                  </Text>
                </View>
              </View>
            ))}

            <View style={styles.divider} />
            <ConfidenceBar
              score={result.overallConfidence}
              factors={['Hepsi telefonunda okundu', 'Yanlış okuduysak elle düzeltebilirsin']}
            />
          </Card>

          <Button
            label="Kaydet"
            onPress={() => void save()}
            loading={saving}
            size="lg"
            fullWidth
          />
        </>
      ) : null}

      <Disclaimer text="Yanlış okumuş olabiliriz. Önemliyse kâğıdın aslına bir bak." />
    </Screen>
  );
}

const styles = StyleSheet.create({
  noticeCard: { backgroundColor: colors.greenSoft, borderColor: colors.green },
  noticeRow: { flexDirection: 'row', gap: spacing.sm, alignItems: 'flex-start' },
  notice: { flex: 1, color: colors.text },
  linkCard: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  linkText: { flex: 1, color: colors.textMuted },
  fieldLabel: { color: colors.textMuted, marginBottom: spacing.xs },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  scanFrame: {
    height: 180,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.borderStrong,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scanningBody: { alignItems: 'center', gap: spacing.sm, paddingHorizontal: spacing.lg },
  muted: { color: colors.textMuted, textAlign: 'center' },
  skeletonGroup: { gap: spacing.sm },
  resultCard: { gap: spacing.md },
  cardTitle: { color: colors.text },
  fieldRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  fieldBody: { flex: 1, gap: 2 },
  fieldLabelInline: { color: colors.textMuted, textAlign: 'left' },
  fieldValue: { color: colors.text },
  fieldConfidence: { alignItems: 'flex-end' },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: colors.border },
});
