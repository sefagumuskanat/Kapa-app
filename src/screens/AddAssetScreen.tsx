import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import {
  Button,
  Card,
  CelebrationOverlay,
  Chip,
  Disclaimer,
  DynamicForm,
  Input,
} from '@/components';
import { initialValues, validateFields } from '@/components/DynamicForm';
import { Screen } from '@/components/Screen';
import {
  AssetTypeDef,
  AVAILABLE_CATEGORIES,
  getAssetType,
  searchAssetTypes,
} from '@/catalog';
import {
  CATEGORY_EMOJI,
  Celebration,
  pickCelebration,
  UNKNOWN_VALUE_CELEBRATION,
} from '@/content/vibes';
import type { RootStackParamList } from '@/navigation/types';
import { FREE_ASSET_LIMIT, valuationService } from '@/services';
import { useApp } from '@/store/AppContext';
import { colors, fonts, radius, spacing, TOUCH_TARGET, typography } from '@/theme';
import { AcquisitionSource, Asset, AssetCondition } from '@/types';
import { CATEGORY_LABEL } from '@/utils/format';
import { createId, nowIso } from '@/utils/id';

type Props = NativeStackScreenProps<RootStackParamList, 'AddAsset'>;

type Step = 'pick' | 'details' | 'price';

const SOURCE_LABEL: Record<AcquisitionSource, string> = {
  purchase: '💳 Satın aldım',
  gift: '🎁 Hediye geldi',
  inheritance: '👵 Miras',
  unknown: '🤷 Hatırlamıyorum',
};

export function AddAssetScreen({ navigation, route }: Props) {
  const editingId = route.params?.assetId;
  const { assets, addAsset, updateAsset, isPremium, portfolio } = useApp();
  const editing = useMemo(
    () => assets.find((asset) => asset.id === editingId) ?? null,
    [assets, editingId],
  );

  const [step, setStep] = useState<Step>(editing ? 'details' : 'pick');
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<string | 'all'>('all');
  const [selectedType, setSelectedType] = useState<AssetTypeDef | null>(
    editing ? getAssetType(editing.typeId) : null,
  );

  const [name, setName] = useState(editing?.name ?? '');
  const [values, setValues] = useState<Record<string, string>>(() =>
    initialValues(getAssetType(editing?.typeId)?.fields ?? [], editing?.attributes),
  );
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [notes, setNotes] = useState(editing?.notes ?? '');

  // Fiyat adımı
  const [purchasePrice, setPurchasePrice] = useState(
    editing?.lots[0]?.unitCost != null ? String(editing.lots[0].unitCost) : '',
  );
  const [purchaseUnknown, setPurchaseUnknown] = useState(
    editing != null && editing.lots.length > 0 && editing.lots[0].unitCost == null,
  );
  const [purchaseSource, setPurchaseSource] = useState<AcquisitionSource>(
    editing?.lots[0]?.source ?? 'purchase',
  );
  const [saleValue, setSaleValue] = useState(
    editing?.declaredSaleValue != null ? String(editing.declaredSaleValue) : '',
  );
  const [fastPrice, setFastPrice] = useState(
    editing?.manualPrices ? String(editing.manualPrices.fast) : '',
  );
  const [normalPrice, setNormalPrice] = useState(
    editing?.manualPrices ? String(editing.manualPrices.normal) : '',
  );
  const [patientPrice, setPatientPrice] = useState(
    editing?.manualPrices ? String(editing.manualPrices.patient) : '',
  );

  // Alert her platformda görünmüyor (web'de hiç çıkmıyor); hatalar alan altında da yazılır.
  const [priceErrors, setPriceErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [celebration, setCelebration] = useState<Celebration | null>(null);
  const [celebratedValue, setCelebratedValue] = useState<number | null>(null);

  const atFreeLimit = !isPremium && !editing && assets.length >= FREE_ASSET_LIMIT;

  const results = useMemo(
    () => searchAssetTypes(query, category === 'all' ? undefined : (category as never)),
    [query, category],
  );

  const chooseType = (type: AssetTypeDef) => {
    setSelectedType(type);
    setValues(initialValues(type.fields));
    if (!name.trim()) setName(type.label);
    setStep('details');
  };

  const goToPrice = () => {
    if (!selectedType) return;
    const errors = validateFields(selectedType.fields, values);
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;
    if (!name.trim()) {
      Alert.alert('İsim lazım', 'Bu şeye bir isim ver ki listede tanıyalım.');
      return;
    }
    setStep('price');
  };

  const save = async () => {
    if (!selectedType) return;

    const errors: Record<string, string> = {};

    const parsedPurchase = purchaseUnknown ? null : parseNumber(purchasePrice);
    if (!purchaseUnknown && (parsedPurchase == null || parsedPurchase < 0)) {
      errors.purchase = 'Kaça aldığını yaz ya da “valla hatırlamıyorum” işaretle.';
    }

    let declaredSaleValue: number | null = null;
    let manualPrices: Asset['manualPrices'] = null;

    if (selectedType.pricing === 'manualSale') {
      declaredSaleValue = parseNumber(saleValue);
      if (declaredSaleValue == null || declaredSaleValue <= 0) {
        errors.sale = 'Bugün satsan kaça gider? Bir rakam yaz.';
      }
    }

    if (selectedType.pricing === 'manual3') {
      const fast = parseNumber(fastPrice);
      const normal = parseNumber(normalPrice);
      const patient = parseNumber(patientPrice);
      if (normal == null || normal <= 0) {
        errors.normal = 'En azından “normal satarsam” rakamını yaz.';
      } else {
        manualPrices = { fast: fast ?? normal, normal, patient: patient ?? normal };
      }
    }

    setPriceErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setSaving(true);
    try {
      const id = editing?.id ?? createId('asset');
      const quantity = parseNumber(values.adet ?? values.gram) ?? 1;

      const asset: Asset = {
        id,
        name: name.trim(),
        typeId: selectedType.id,
        category: selectedType.category,
        condition: (values.durum as AssetCondition) ?? editing?.condition ?? 'good',
        quantity,
        unit: selectedType.unit,
        attributes: values,
        components: [],
        lots: [
          {
            id: editing?.lots[0]?.id ?? createId('lot'),
            assetId: id,
            acquiredAt: editing?.lots[0]?.acquiredAt ?? nowIso(),
            quantity: 1,
            unitCost: parsedPurchase,
            currency: 'TRY',
            source: purchaseUnknown ? 'unknown' : purchaseSource,
          },
        ],
        declaredSaleValue,
        manualPrices,
        valueUpdatedAt: nowIso(),
        notes: notes.trim() || undefined,
        createdAt: editing?.createdAt ?? nowIso(),
        updatedAt: nowIso(),
        isArchived: false,
      };

      if (editing) {
        await updateAsset(asset);
        navigation.goBack();
        return;
      }

      await addAsset(asset);
      const snapshot = await valuationService.valuateAsset(asset);
      setCelebration(
        snapshot.normalValue > 0 ? pickCelebration(snapshot.normalValue) : UNKNOWN_VALUE_CELEBRATION,
      );
      setCelebratedValue(snapshot.normalValue);
    } finally {
      setSaving(false);
    }
  };

  if (atFreeLimit) {
    return (
      <Screen title="Kasa doldu!" onBack={() => navigation.goBack()}>
        <Card style={styles.limitCard}>
          <Text style={styles.limitEmoji}>🔒</Text>
          <Text style={[typography.heading, styles.limitTitle]}>Bedava sürüm doldu</Text>
          <Text style={[typography.body, styles.muted]}>
            Ücretsiz sürümde {FREE_ASSET_LIMIT} şey ekleyebiliyorsun. Bu kadar malın varsa
            premium'a geçme vaktin gelmiş demektir.
          </Text>
          <Button
            label="Premium'a bakayım"
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
      onBack={() => (step === 'pick' || editing ? navigation.goBack() : setStep(prevStep(step)))}
    >
      <CelebrationOverlay
        visible={celebration != null}
        content={celebration}
        assetName={name.trim()}
        addedValue={celebratedValue}
        newTotal={portfolio?.totals.normal ?? null}
        onDismiss={() => {
          setCelebration(null);
          navigation.goBack();
        }}
      />

      <StepBar current={step} />

      {/* 1 — Ne olduğunu bul */}
      {step === 'pick' ? (
        <View style={styles.section}>
          <Input
            placeholder="🔍 Çeyrek altın, bilezik, arsa, airsoft…"
            value={query}
            onChangeText={setQuery}
            autoCorrect={false}
            autoFocus
          />

          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
            <Chip label="Hepsi" selected={category === 'all'} onPress={() => setCategory('all')} tone="green" />
            {AVAILABLE_CATEGORIES.map((item) => (
              <Chip
                key={item}
                label={`${CATEGORY_EMOJI[item]} ${CATEGORY_LABEL[item]}`}
                selected={category === item}
                onPress={() => setCategory(item)}
                tone="green"
              />
            ))}
          </ScrollView>

          {results.length === 0 ? (
            <Card>
              <Text style={[typography.body, styles.muted]}>
                Öyle bir şey bulamadık. “Diğer (ne olursa)” seçip kendin yazabilirsin —
                fiyatını da sen belirlersin.
              </Text>
            </Card>
          ) : (
            <View style={styles.list}>
              {results.map((type) => (
                <Pressable
                  key={type.id}
                  accessibilityRole="button"
                  accessibilityLabel={type.label}
                  onPress={() => chooseType(type)}
                  style={({ pressed }) => [styles.typeRow, pressed && styles.pressed]}
                >
                  <Text style={styles.typeEmoji}>{type.emoji}</Text>
                  <View style={styles.typeBody}>
                    <Text style={[typography.bodyStrong, styles.typeName]}>{type.label}</Text>
                    <Text style={[typography.caption, styles.muted]} numberOfLines={1}>
                      {type.hint ?? PRICING_HINT[type.pricing]}
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={16} color={colors.textFaint} />
                </Pressable>
              ))}
            </View>
          )}
        </View>
      ) : null}

      {/* 2 — Türe özel sorular */}
      {step === 'details' && selectedType ? (
        <View style={styles.section}>
          <View style={styles.selectedBanner}>
            <Text style={styles.typeEmoji}>{selectedType.emoji}</Text>
            <Text style={[typography.bodyStrong, styles.typeName]}>{selectedType.label}</Text>
            {!editing ? (
              <Pressable accessibilityRole="button" onPress={() => setStep('pick')}>
                <Text style={[typography.caption, styles.link]}>Değiştir</Text>
              </Pressable>
            ) : null}
          </View>

          <Input
            label="Sen buna ne diyorsun?"
            placeholder="Annemin bileziği, kırmızı araba…"
            value={name}
            onChangeText={setName}
          />

          <DynamicForm
            fields={selectedType.fields}
            values={values}
            errors={fieldErrors}
            onChange={(key, value) => {
              setValues((current) => ({ ...current, [key]: value }));
              if (fieldErrors[key]) setFieldErrors((e) => ({ ...e, [key]: '' }));
            }}
          />

          <Input
            label="Not (isteğe bağlı)"
            placeholder="Faturası var, kutusu duruyor…"
            value={notes}
            onChangeText={setNotes}
            multiline
          />

          <Button label="Devam" onPress={goToPrice} fullWidth />
        </View>
      ) : null}

      {/* 3 — Fiyat */}
      {step === 'price' && selectedType ? (
        <View style={styles.section}>
          <Card style={styles.section}>
            <Text style={[typography.subheading, styles.cardTitle]}>💳 Kaça almıştın?</Text>
            <Text style={[typography.caption, styles.muted]}>
              Bunu kâr mı ettin zarar mı ettin hesaplamak için soruyoruz. Hatırlamıyorsan da
              olur, uydurmayız.
            </Text>

            <Input
              label="Alış fiyatı"
              value={purchaseUnknown ? '' : purchasePrice}
              onChangeText={setPurchasePrice}
              keyboardType="decimal-pad"
              suffix="₺"
              editable={!purchaseUnknown}
              placeholder={purchaseUnknown ? 'Bilinmiyor' : '0'}
              error={priceErrors.purchase}
            />

            <Pressable
              accessibilityRole="checkbox"
              accessibilityState={{ checked: purchaseUnknown }}
              onPress={() => {
                setPurchaseUnknown((v) => !v);
                setPriceErrors((e) => ({ ...e, purchase: '' }));
              }}
              style={({ pressed }) => [styles.checkRow, pressed && styles.pressed]}
            >
              <View style={[styles.checkbox, purchaseUnknown && styles.checkboxChecked]}>
                {purchaseUnknown ? (
                  <Ionicons name="checkmark" size={15} color={colors.background} />
                ) : null}
              </View>
              <Text style={[typography.body, styles.checkLabel]}>Valla hatırlamıyorum</Text>
            </Pressable>

            <View>
              <Text style={[typography.caption, styles.muted]}>Nasıl geldi bu sana?</Text>
              <View style={styles.chipRow}>
                {(Object.keys(SOURCE_LABEL) as AcquisitionSource[]).map((item) => (
                  <Chip
                    key={item}
                    label={SOURCE_LABEL[item]}
                    selected={purchaseSource === item}
                    onPress={() => {
                      setPurchaseSource(item);
                      if (item !== 'purchase') setPurchaseUnknown(true);
                    }}
                    tone="green"
                  />
                ))}
              </View>
            </View>
          </Card>

          {/* Otomatik fiyatlanan: bilgi kartı */}
          {selectedType.pricing === 'metal' ? (
            <Card style={styles.autoCard}>
              <Text style={[typography.subheading, styles.cardTitle]}>📈 Fiyatı biz takip ederiz</Text>
              <Text style={[typography.body, styles.muted]}>
                {selectedType.metal?.metal === 'gold' ? 'Altının' : 'Gümüşün'} güncel gram
                fiyatına göre değerini kendimiz hesaplarız. Sen bir şey güncellemek zorunda
                değilsin.
              </Text>
            </Card>
          ) : null}

          {/* Tek değer soranlar: pırlanta, ev, arsa */}
          {selectedType.pricing === 'manualSale' ? (
            <Card style={styles.section}>
              <Text style={[typography.subheading, styles.cardTitle]}>🏷️ Bugün kaça gider?</Text>
              <Text style={[typography.caption, styles.muted]}>
                Bunun piyasa fiyatını otomatik bulamıyoruz, o yüzden sana soruyoruz.
                Zaman zaman güncellemeni hatırlatacağız.
              </Text>
              <Input
                label="Güncel satış değeri"
                value={saleValue}
                onChangeText={setSaleValue}
                keyboardType="decimal-pad"
                suffix="₺"
                error={priceErrors.sale}
              />
            </Card>
          ) : null}

          {/* Üç fiyat soranlar: araç, elektronik, hobi… */}
          {selectedType.pricing === 'manual3' ? (
            <Card style={styles.section}>
              <Text style={[typography.subheading, styles.cardTitle]}>🎯 Üç fiyat söyle</Text>
              <Text style={[typography.caption, styles.muted]}>
                Marka-model listesi tutmak ciddi bir iş, o yüzden uydurmuyoruz. Sen söyle,
                biz toplayalım.
              </Text>
              <Input
                label="🏃 Acil satarsam"
                value={fastPrice}
                onChangeText={setFastPrice}
                keyboardType="decimal-pad"
                suffix="₺"
              />
              <Input
                label="🤝 Normal satarsam"
                value={normalPrice}
                onChangeText={setNormalPrice}
                keyboardType="decimal-pad"
                suffix="₺"
                hint="Karnende bu rakam kullanılır."
                error={priceErrors.normal}
              />
              <Input
                label="🪑 Alıcıyı beklersem"
                value={patientPrice}
                onChangeText={setPatientPrice}
                keyboardType="decimal-pad"
                suffix="₺"
              />
            </Card>
          ) : null}

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

const PRICING_HINT: Record<string, string> = {
  metal: 'Fiyatını piyasadan biz takip ederiz.',
  manualSale: 'Güncel değerini sen girersin.',
  manual3: 'Üç fiyatı sen belirlersin.',
};

const STEP_SUBTITLE: Record<Step, string> = {
  pick: '1 / 3 · Ne bu?',
  details: '2 / 3 · Detaylar',
  price: '3 / 3 · Fiyat',
};

const STEP_ORDER: Step[] = ['pick', 'details', 'price'];

function prevStep(current: Step): Step {
  const index = STEP_ORDER.indexOf(current);
  return STEP_ORDER[Math.max(0, index - 1)];
}

function StepBar({ current }: { current: Step }) {
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
  const normalized = input.replace(/\s/g, '').replace(/\./g, '').replace(',', '.');
  if (!normalized) return null;
  const value = Number(normalized);
  return Number.isFinite(value) ? value : null;
}

const styles = StyleSheet.create({
  section: { gap: spacing.md },
  cardTitle: { color: colors.text },
  muted: { color: colors.textMuted },
  link: { color: colors.green, fontFamily: fonts.bodySemi },
  pressed: { opacity: 0.7 },

  steps: { flexDirection: 'row', gap: spacing.xs },
  stepBar: { flex: 1, height: 4, borderRadius: 2, backgroundColor: colors.border },
  stepBarActive: { backgroundColor: colors.green },

  chips: { gap: spacing.sm, paddingRight: spacing.md },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: spacing.xs },

  list: { gap: spacing.sm },
  typeRow: {
    minHeight: TOUCH_TARGET + 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radius.lg,
    backgroundColor: colors.card,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  typeEmoji: { fontSize: 24, lineHeight: 30 },
  typeBody: { flex: 1, gap: 2 },
  typeName: { color: colors.text },

  selectedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.lg,
    backgroundColor: colors.cardElevated,
  },

  autoCard: { gap: spacing.sm, backgroundColor: colors.greenSoft, borderColor: colors.green },

  checkRow: { minHeight: TOUCH_TARGET, flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: radius.sm,
    borderWidth: 2,
    borderColor: colors.borderStrong,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: { backgroundColor: colors.green, borderColor: colors.green },
  checkLabel: { color: colors.text, flex: 1 },

  limitCard: { gap: spacing.md, alignItems: 'flex-start' },
  limitEmoji: { fontSize: 40, lineHeight: 48 },
  limitTitle: { color: colors.text },
});
