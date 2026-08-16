import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import {
  Button,
  Card,
  CelebrationOverlay,
  Chip,
  Disclaimer,
  Input,
  SegmentedControl,
} from '@/components';
import { Screen } from '@/components/Screen';
import {
  CATEGORY_EMOJI,
  Celebration,
  CONDITION_EMOJI,
  pickCelebration,
  UNKNOWN_VALUE_CELEBRATION,
} from '@/content/vibes';
import type { RootStackParamList } from '@/navigation/types';
import { catalogService, FREE_ASSET_LIMIT, valuationService } from '@/services';
import { useApp } from '@/store/AppContext';
import { TOUCH_TARGET, colors, fonts, radius, spacing, typography } from '@/theme';
import {
  AcquisitionLot,
  AcquisitionSource,
  Asset,
  AssetCategory,
  AssetCondition,
  CatalogItem,
  MeasurementUnit,
} from '@/types';
import { createId, nowIso } from '@/utils/id';
import { CATEGORY_LABEL, CONDITION_LABEL, UNIT_LABEL } from '@/utils/format';

type Props = NativeStackScreenProps<RootStackParamList, 'AddAsset'>;

type Step = 'category' | 'source' | 'details' | 'lot';
type EntryMode = 'catalog' | 'manual';

const CATEGORIES: AssetCategory[] = [
  'gold',
  'silver',
  'jewelry',
  'watch',
  'electronics',
  'photography',
  'vehicle',
  'bicycle',
  'furniture',
  'collectible',
  'other',
];

const CONDITIONS: AssetCondition[] = ['new', 'likeNew', 'good', 'fair', 'poor'];
const UNITS: MeasurementUnit[] = ['piece', 'gram', 'carat', 'set'];

const SOURCE_LABEL: Record<AcquisitionSource, string> = {
  purchase: 'Satın aldım',
  gift: 'Hediye',
  inheritance: 'Miras',
  unknown: 'Hatırlamıyorum',
};

export function AddAssetScreen({ navigation, route }: Props) {
  const editingId = route.params?.assetId;
  const { assets, addAsset, updateAsset, isPremium, portfolio } = useApp();
  const editing = useMemo(
    () => assets.find((asset) => asset.id === editingId) ?? null,
    [assets, editingId],
  );

  const [step, setStep] = useState<Step>(editing ? 'details' : 'category');
  // Yeni kayıtta katalog varsayılan: eşleşme güven skorunu belirgin şekilde yükseltir.
  const [entryMode, setEntryMode] = useState<EntryMode>(
    editing && !editing.catalogRef ? 'manual' : 'catalog',
  );
  const [category, setCategory] = useState<AssetCategory>(editing?.category ?? 'gold');
  const [catalogQuery, setCatalogQuery] = useState('');
  const [catalogResults, setCatalogResults] = useState<CatalogItem[]>([]);
  const [catalogLoading, setCatalogLoading] = useState(false);
  const [catalogRef, setCatalogRef] = useState<string | undefined>(editing?.catalogRef);

  const [name, setName] = useState(editing?.name ?? '');
  const [quantity, setQuantity] = useState(editing ? String(editing.quantity) : '1');
  const [unit, setUnit] = useState<MeasurementUnit>(editing?.unit ?? 'piece');
  const [condition, setCondition] = useState<AssetCondition>(editing?.condition ?? 'good');
  const [declaredValue, setDeclaredValue] = useState(
    editing?.declaredUnitValue != null ? String(editing.declaredUnitValue) : '',
  );
  const [notes, setNotes] = useState(editing?.notes ?? '');

  const [lots, setLots] = useState<AcquisitionLot[]>(editing?.lots ?? []);
  const [lotQuantity, setLotQuantity] = useState('1');
  const [lotUnitCost, setLotUnitCost] = useState('');
  const [lotCostUnknown, setLotCostUnknown] = useState(false);
  const [lotSource, setLotSource] = useState<AcquisitionSource>('purchase');
  const [lotDate, setLotDate] = useState(new Date().toISOString().slice(0, 10));

  const [saving, setSaving] = useState(false);
  const [nameError, setNameError] = useState<string | null>(null);
  const [celebration, setCelebration] = useState<Celebration | null>(null);
  const [celebratedValue, setCelebratedValue] = useState<number | null>(null);

  const atFreeLimit = !isPremium && !editing && assets.length >= FREE_ASSET_LIMIT;

  useEffect(() => {
    if (entryMode !== 'catalog') return;
    let active = true;
    setCatalogLoading(true);
    void catalogService.search(catalogQuery, category).then((results) => {
      if (!active) return;
      setCatalogResults(results);
      setCatalogLoading(false);
    });
    return () => {
      active = false;
    };
  }, [entryMode, catalogQuery, category]);

  const selectCatalogItem = (item: CatalogItem) => {
    setCatalogRef(item.ref);
    setName(item.name);
    setUnit(item.unit);
    setStep('details');
  };

  const addLot = () => {
    const parsedQuantity = parseNumber(lotQuantity);
    if (parsedQuantity == null || parsedQuantity <= 0) {
      Alert.alert('Miktar olmadı', 'Sıfırdan büyük bir sayı yazman lazım.');
      return;
    }
    const unitCost = lotCostUnknown ? null : parseNumber(lotUnitCost);
    if (!lotCostUnknown && (unitCost == null || unitCost < 0)) {
      Alert.alert('Fiyat lazım', 'Ya bir rakam yaz ya da “valla hatırlamıyorum” de.');
      return;
    }

    setLots((current) => [
      ...current,
      {
        id: createId('lot'),
        assetId: editing?.id ?? 'pending',
        acquiredAt: parseDate(lotDate),
        quantity: parsedQuantity,
        unitCost,
        currency: 'TRY',
        source: lotSource,
      },
    ]);
    setLotQuantity('1');
    setLotUnitCost('');
    setLotCostUnknown(false);
  };

  const save = async () => {
    const trimmed = name.trim();
    if (!trimmed) {
      setNameError('Bir isim yaz, ne olduğunu bilelim.');
      setStep('details');
      return;
    }
    const parsedQuantity = parseNumber(quantity);
    if (parsedQuantity == null || parsedQuantity <= 0) {
      Alert.alert('Miktar olmadı', 'Kaç tane olduğunu sıfırdan büyük bir sayı olarak yaz.');
      return;
    }

    setSaving(true);
    try {
      const id = editing?.id ?? createId('asset');
      const asset: Asset = {
        id,
        name: trimmed,
        category,
        condition,
        quantity: parsedQuantity,
        unit,
        catalogRef,
        components: editing?.components ?? [],
        lots: lots.map((lot) => ({ ...lot, assetId: id })),
        declaredUnitValue: parseNumber(declaredValue),
        notes: notes.trim() || undefined,
        createdAt: editing?.createdAt ?? nowIso(),
        updatedAt: nowIso(),
        isArchived: false,
      };

      if (editing) {
        // Düzenlemede kutlama yok — yeni bir şey kazanılmadı.
        await updateAsset(asset);
        navigation.goBack();
        return;
      }

      await addAsset(asset);
      // Değerleme kaydettikten sonra hesaplandığı için kutlamayı burada bekletiyoruz.
      const snapshot = await valuationService.valuateAsset(asset);
      setCelebration(
        snapshot.normalValue > 0
          ? pickCelebration(snapshot.normalValue)
          : UNKNOWN_VALUE_CELEBRATION,
      );
      setCelebratedValue(snapshot.normalValue);
    } finally {
      setSaving(false);
    }
  };

  const dismissCelebration = () => {
    setCelebration(null);
    navigation.goBack();
  };

  if (atFreeLimit) {
    return (
      <Screen title="Varlık ekle" onBack={() => navigation.goBack()}>
        <Card style={styles.limitCard}>
          <Ionicons name="lock-closed-outline" size={24} color={colors.gold} />
          <Text style={[typography.heading, styles.limitTitle]}>Kasa doldu!</Text>
          <Text style={[typography.body, styles.limitBody]}>
            Bedava sürümde {FREE_ASSET_LIMIT} şey ekleyebiliyorsun. Bu kadar malın varsa premium'a geçme vaktin gelmiş demektir.
          </Text>
          <Button
            label="Premium’a bakayım"
            onPress={() => navigation.replace('Paywall', { source: 'asset-limit' })}
            fullWidth
          />
        </Card>
      </Screen>
    );
  }

  return (
    <Screen
      title={editing ? 'Düzenle' : 'Ne ekliyoruz?'}
      subtitle={STEP_SUBTITLE[step]}
      onBack={() => navigation.goBack()}
    >
      <CelebrationOverlay
        visible={celebration != null}
        content={celebration}
        assetName={name.trim()}
        addedValue={celebratedValue}
        newTotal={portfolio?.totals.normal ?? null}
        onDismiss={dismissCelebration}
      />

      <StepIndicator current={step} />

      {step === 'category' ? (
        <View style={styles.section}>
          <Text style={[typography.subheading, styles.sectionTitle]}>Bu ne böyle?</Text>
          <View style={styles.categoryGrid}>
            {CATEGORIES.map((item) => {
              const selected = item === category;
              return (
                <Pressable
                  key={item}
                  accessibilityRole="button"
                  accessibilityState={{ selected }}
                  onPress={() => setCategory(item)}
                  style={({ pressed }) => [
                    styles.categoryTile,
                    selected && styles.categoryTileSelected,
                    pressed && styles.pressed,
                  ]}
                >
                  <Text style={styles.categoryEmoji}>{CATEGORY_EMOJI[item]}</Text>
                  <Text
                    style={[
                      typography.caption,
                      styles.categoryLabel,
                      selected && styles.categoryLabelSelected,
                    ]}
                    numberOfLines={1}
                  >
                    {CATEGORY_LABEL[item]}
                  </Text>
                </Pressable>
              );
            })}
          </View>
          <Button label="Devam" onPress={() => setStep('source')} fullWidth />
        </View>
      ) : null}

      {step === 'source' ? (
        <View style={styles.section}>
          <SegmentedControl<EntryMode>
            value={entryMode}
            onChange={setEntryMode}
            segments={[
              { value: 'catalog', label: '📋 Listeden seç' },
              { value: 'manual', label: '✍️ Kendim yazayım' },
            ]}
          />

          {entryMode === 'catalog' ? (
            <View style={styles.section}>
              <Input
                placeholder={`${CATEGORY_EMOJI[category]} ${CATEGORY_LABEL[category]} ara`}
                value={catalogQuery}
                onChangeText={setCatalogQuery}
                autoCorrect={false}
              />
              {catalogLoading ? (
                <ActivityIndicator color={colors.textMuted} style={styles.loader} />
              ) : catalogResults.length === 0 ? (
                <Card>
                  <Text style={[typography.body, styles.emptyCatalog]}>
                    Burada öyle bir şey bulamadık. Kendin yazsan daha hızlı olur.
                  </Text>
                </Card>
              ) : (
                <View style={styles.list}>
                  {catalogResults.map((item) => (
                    <Pressable
                      key={item.ref}
                      accessibilityRole="button"
                      onPress={() => selectCatalogItem(item)}
                      style={({ pressed }) => [styles.catalogRow, pressed && styles.pressed]}
                    >
                      <View style={styles.catalogBody}>
                        <Text style={[typography.bodyStrong, styles.catalogName]}>{item.name}</Text>
                        <Text style={[typography.caption, styles.catalogMeta]}>
                          birim: {UNIT_LABEL[item.unit]}
                        </Text>
                      </View>
                      <Ionicons name="chevron-forward" size={16} color={colors.textFaint} />
                    </Pressable>
                  ))}
                </View>
              )}
            </View>
          ) : (
            <Card style={styles.section}>
              <Text style={[typography.body, styles.manualHint]}>
                Kendin yazarsan değeri kategoriye bakarak tahmin ederiz. Listeden seçtiğinden biraz daha az emin oluruz, o kadar.
              </Text>
              <Button label="Tamam, yazayım" onPress={() => setStep('details')} fullWidth />
            </Card>
          )}
        </View>
      ) : null}

      {step === 'details' ? (
        <View style={styles.section}>
          <Input
            label="Adı ne?"
            placeholder="Mesela: annemin bileziği"
            value={name}
            onChangeText={(value) => {
              setName(value);
              if (nameError) setNameError(null);
            }}
            error={nameError}
          />

          <View style={styles.row}>
            <View style={styles.rowItem}>
              <Input
                label="Kaç tane / kaç gram"
                value={quantity}
                onChangeText={setQuantity}
                keyboardType="decimal-pad"
              />
            </View>
            <View style={styles.rowItem}>
              <Text style={[typography.caption, styles.fieldLabel]}>Birim</Text>
              <View style={styles.chipRow}>
                {UNITS.map((item) => (
                  <Chip
                    key={item}
                    label={UNIT_LABEL[item]}
                    selected={unit === item}
                    onPress={() => setUnit(item)}
                    tone="green"
                  />
                ))}
              </View>
            </View>
          </View>

          <View>
            <Text style={[typography.caption, styles.fieldLabel]}>Durum</Text>
            <View style={styles.chipRow}>
              {CONDITIONS.map((item) => (
                <Chip
                  key={item}
                  label={`${CONDITION_EMOJI[item]} ${CONDITION_LABEL[item]}`}
                  selected={condition === item}
                  onPress={() => setCondition(item)}
                  tone="green"
                />
              ))}
            </View>
          </View>

          <Input
            label="Sence kaç eder? (isteğe bağlı)"
            placeholder="Tanesi kaç para"
            hint="Boş bırak, biz tahmin ederiz."
            value={declaredValue}
            onChangeText={setDeclaredValue}
            keyboardType="decimal-pad"
            suffix="₺"
          />

          <Input
            label="Not düşmek istersen"
            placeholder="Kutusu var, faturası duruyor…"
            value={notes}
            onChangeText={setNotes}
            multiline
          />

          <Button label="Devam" onPress={() => setStep('lot')} fullWidth />
        </View>
      ) : null}

      {step === 'lot' ? (
        <View style={styles.section}>
          <Card style={styles.section}>
            <Text style={[typography.subheading, styles.sectionTitle]}>Kaça almıştın?</Text>
            <Text style={[typography.caption, styles.hint]}>
              Farklı zamanlarda aldıysan her alımı ayrı ekle. Hatırlamıyorsan da dert etme, “bilmiyorum” de geç — biz de kimseye bildiğimizi söylemeyiz.
            </Text>

            <View style={styles.row}>
              <View style={styles.rowItem}>
                <Input
                  label="Miktar"
                  value={lotQuantity}
                  onChangeText={setLotQuantity}
                  keyboardType="decimal-pad"
                />
              </View>
              <View style={styles.rowItem}>
                <Input
                  label="Tarih"
                  value={lotDate}
                  onChangeText={setLotDate}
                  placeholder="YYYY-AA-GG"
                  autoCapitalize="none"
                />
              </View>
            </View>

            <Input
              label="Tanesi kaça"
              value={lotCostUnknown ? '' : lotUnitCost}
              onChangeText={setLotUnitCost}
              keyboardType="decimal-pad"
              editable={!lotCostUnknown}
              suffix="₺"
              placeholder={lotCostUnknown ? 'Bilinmiyor' : '0'}
            />

            <Pressable
              accessibilityRole="checkbox"
              accessibilityState={{ checked: lotCostUnknown }}
              onPress={() => setLotCostUnknown((value) => !value)}
              style={({ pressed }) => [styles.checkRow, pressed && styles.pressed]}
            >
              <View style={[styles.checkbox, lotCostUnknown && styles.checkboxChecked]}>
                {lotCostUnknown ? (
                  <Ionicons name="checkmark" size={14} color={colors.background} />
                ) : null}
              </View>
              <Text style={[typography.body, styles.checkLabel]}>Valla hatırlamıyorum</Text>
            </Pressable>

            <View>
              <Text style={[typography.caption, styles.fieldLabel]}>Nasıl geldi bu sana?</Text>
              <View style={styles.chipRow}>
                {(Object.keys(SOURCE_LABEL) as AcquisitionSource[]).map((item) => (
                  <Chip
                    key={item}
                    label={SOURCE_LABEL[item]}
                    selected={lotSource === item}
                    onPress={() => {
                      setLotSource(item);
                      if (item === 'gift' || item === 'inheritance' || item === 'unknown') {
                        setLotCostUnknown(true);
                      }
                    }}
                    tone="green"
                  />
                ))}
              </View>
            </View>

            <Button label="Ekle" onPress={addLot} variant="secondary" icon="add" fullWidth />
          </Card>

          {lots.length > 0 ? (
            <View style={styles.list}>
              {lots.map((lot, index) => (
                <View key={lot.id} style={styles.lotRow}>
                  <View style={styles.lotBody}>
                    <Text style={[typography.bodyStrong, styles.lotTitle]}>
                      {index + 1}. alım · {lot.quantity} birim
                    </Text>
                    <Text style={[typography.caption, styles.lotMeta]}>
                      {SOURCE_LABEL[lot.source]} ·{' '}
                      {lot.unitCost == null ? 'kaça alındığı meçhul' : `${lot.unitCost} ₺/birim`}
                    </Text>
                  </View>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={`${index + 1}. alımı sil`}
                    onPress={() => setLots((current) => current.filter((c) => c.id !== lot.id))}
                    style={styles.lotDelete}
                  >
                    <Ionicons name="trash-outline" size={18} color={colors.red} />
                  </Pressable>
                </View>
              ))}
            </View>
          ) : (
            <Text style={[typography.caption, styles.hint]}>
              İstersen hiç girmeden de kaydet. O zaman kâr mı ettin zarar mı, onu hesaplayamayız sadece.
            </Text>
          )}

          <Button
            label={editing ? 'Kaydet' : 'Ekle gitsin'}
            onPress={() => void save()}
            loading={saving}
            size="lg"
            fullWidth
          />
          <Disclaimer />
        </View>
      ) : null}
    </Screen>
  );
}

const STEP_SUBTITLE: Record<Step, string> = {
  category: '1 / 4 · Nesi var bunun',
  source: '2 / 4 · Listeden mi, elle mi',
  details: '3 / 4 · Biraz detay',
  lot: '4 / 4 · Kaça almıştın',
};

const STEP_ORDER: Step[] = ['category', 'source', 'details', 'lot'];

function StepIndicator({ current }: { current: Step }) {
  const index = STEP_ORDER.indexOf(current);
  return (
    <View style={styles.steps}>
      {STEP_ORDER.map((step, i) => (
        <View key={step} style={[styles.stepBar, i <= index && styles.stepBarActive]} />
      ))}
    </View>
  );
}

function parseNumber(input: string): number | null {
  const normalized = input.replace(/\s/g, '').replace(',', '.');
  if (!normalized) return null;
  const value = Number(normalized);
  return Number.isFinite(value) ? value : null;
}

function parseDate(input: string): string {
  const parsed = new Date(input);
  return Number.isNaN(parsed.getTime()) ? nowIso() : parsed.toISOString();
}

const styles = StyleSheet.create({
  section: { gap: spacing.md },
  sectionTitle: { color: colors.text },
  hint: { color: colors.textFaint },
  fieldLabel: { color: colors.textMuted, marginBottom: spacing.xs },
  loader: { paddingVertical: spacing.lg },
  pressed: { opacity: 0.7 },

  steps: { flexDirection: 'row', gap: spacing.xs },
  stepBar: { flex: 1, height: 3, borderRadius: 2, backgroundColor: colors.border },
  stepBarActive: { backgroundColor: colors.green },

  categoryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  categoryTile: {
    width: '31%',
    minHeight: 72,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    padding: spacing.sm,
    borderRadius: radius.lg,
    backgroundColor: colors.card,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  categoryTileSelected: { borderColor: colors.green, backgroundColor: colors.cardElevated },
  categoryEmoji: { fontSize: 24, lineHeight: 30 },
  categoryLabel: { color: colors.textMuted, textAlign: 'center' },
  categoryLabelSelected: { color: colors.green, fontFamily: fonts.bodySemi },

  row: { flexDirection: 'row', gap: spacing.sm },
  rowItem: { flex: 1 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },

  list: { gap: spacing.sm },
  catalogRow: {
    minHeight: TOUCH_TARGET,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.lg,
    backgroundColor: colors.card,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  catalogBody: { flex: 1, gap: 2 },
  catalogName: { color: colors.text },
  catalogMeta: { color: colors.textMuted },
  emptyCatalog: { color: colors.textMuted },
  manualHint: { color: colors.textMuted },

  checkRow: { minHeight: TOUCH_TARGET, flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: radius.sm,
    borderWidth: 1.5,
    borderColor: colors.borderStrong,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: { backgroundColor: colors.green, borderColor: colors.green },
  checkLabel: { color: colors.text, flex: 1 },

  lotRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.lg,
    backgroundColor: colors.card,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  lotBody: { flex: 1, gap: 2 },
  lotTitle: { color: colors.text },
  lotMeta: { color: colors.textMuted },
  lotDelete: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },

  limitCard: { gap: spacing.md, alignItems: 'flex-start' },
  limitTitle: { color: colors.text },
  limitBody: { color: colors.textMuted },
});
