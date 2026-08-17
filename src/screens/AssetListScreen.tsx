import { Ionicons } from '@expo/vector-icons';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import {
  AdSlotView,
  AssetRow,
  Chip,
  EmptyState,
  ErrorState,
  Input,
  ListSkeleton,
  SegmentedControl,
} from '@/components';
import { Screen } from '@/components/Screen';
import type { RootStackParamList, TabParamList } from '@/navigation/types';
import { useApp } from '@/store/AppContext';
import { colors, spacing, typography } from '@/theme';
import { AssetCategory } from '@/types';
import { CATEGORY_EMOJI, EMPTY } from '@/content/vibes';
import { CATEGORY_LABEL, formatCurrency, formatSignedCurrency, SCENARIO_LABEL } from '@/utils/format';

type Props = BottomTabScreenProps<TabParamList, 'Assets'>;

type SortKey = 'value-desc' | 'value-asc' | 'recent';

export function AssetListScreen({}: Props) {
  const root = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { status, error, offline, revaluating, assets, valuations, reload, revaluate, loadDemoData } =
    useApp();

  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<AssetCategory | 'all'>('all');
  const [sort, setSort] = useState<SortKey>('value-desc');

  const categories = useMemo(() => {
    const present = Array.from(new Set(assets.map((asset) => asset.category)));
    return present.sort((a, b) => CATEGORY_LABEL[a].localeCompare(CATEGORY_LABEL[b], 'tr'));
  }, [assets]);

  const filtered = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase('tr-TR');
    const result = assets.filter((asset) => {
      if (category !== 'all' && asset.category !== category) return false;
      if (!normalized) return true;
      return (
        asset.name.toLocaleLowerCase('tr-TR').includes(normalized) ||
        CATEGORY_LABEL[asset.category].toLocaleLowerCase('tr-TR').includes(normalized)
      );
    });

    return result.sort((a, b) => {
      if (sort === 'recent') {
        return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
      }
      const aValue = valuations[a.id]?.normalValue ?? 0;
      const bValue = valuations[b.id]?.normalValue ?? 0;
      return sort === 'value-desc' ? bValue - aValue : aValue - bValue;
    });
  }, [assets, valuations, query, category, sort]);

  const visibleTotal = useMemo(
    () => filtered.reduce((sum, asset) => sum + (valuations[asset.id]?.normalValue ?? 0), 0),
    [filtered, valuations],
  );

  /**
   * Kâr/zarar yalnızca alış fiyatı bilinen kalemler üzerinden toplanır.
   * Hiçbirinin maliyeti yoksa rakam uydurmak yerine hiç göstermiyoruz.
   */
  const visibleGain = useMemo(() => {
    const known = filtered
      .map((asset) => valuations[asset.id])
      .filter((v) => v != null && v.unrealizedGain != null);
    if (known.length === 0) return null;
    return known.reduce((sum, v) => sum + (v!.unrealizedGain as number), 0);
  }, [filtered, valuations]);

  if (status === 'error') {
    return (
      <Screen title="Mal Varlığım">
        <ErrorState description={error ?? 'Liste yüklenemedi.'} onRetry={() => void reload()} />
      </Screen>
    );
  }

  if (status === 'loading') {
    return (
      <Screen title="Mal Varlığım">
        <ListSkeleton rows={5} />
      </Screen>
    );
  }

  if (assets.length === 0) {
    return (
      <Screen title="Mal Varlığım" offline={offline}>
        <EmptyState
          emoji={EMPTY.assets.emoji}
          title={EMPTY.assets.title}
          description={EMPTY.assets.line}
          actionLabel="Hadi bir şeyler ekle"
          onAction={() => root.navigate('AddAsset')}
        />
      </Screen>
    );
  }

  return (
    <Screen
      title="Mal Varlığım"
      subtitle={`${filtered.length} parça · ${formatCurrency(visibleTotal, 'TRY', true)} eder${
        visibleGain != null ? ` · ${formatSignedCurrency(visibleGain)}` : ''
      }`}
      offline={offline}
      onRefresh={() => void revaluate()}
      refreshing={revaluating}
      headerRight={
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Varlık ekle"
          onPress={() => root.navigate('AddAsset')}
          style={styles.headerAction}
        >
          <Ionicons name="add" size={22} color={colors.green} />
        </Pressable>
      }
    >
      <Input
        placeholder="🔍 Ne arıyorsun?"
        value={query}
        onChangeText={setQuery}
        autoCorrect={false}
        returnKeyType="search"
        accessibilityLabel="Varlık ara"
      />

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chips}
      >
        <Chip
          label="Hepsi"
          selected={category === 'all'}
          onPress={() => setCategory('all')}
          tone="green"
        />
        {categories.map((item) => (
          <Chip
            key={item}
            label={`${CATEGORY_EMOJI[item]} ${CATEGORY_LABEL[item]}`}
            selected={category === item}
            onPress={() => setCategory(item)}
            tone="green"
          />
        ))}
      </ScrollView>

      <SegmentedControl<SortKey>
        value={sort}
        onChange={setSort}
        segments={[
          { value: 'value-desc', label: '💰 Pahalıdan' },
          { value: 'value-asc', label: '🪶 Ucuzdan' },
          { value: 'recent', label: '🆕 Yeniden' },
        ]}
      />

      <Text style={[typography.caption, styles.sortHint]}>
        Sıralama {SCENARIO_LABEL.normal.toLocaleLowerCase('tr-TR')} rakamına göre.
      </Text>

      {filtered.length === 0 ? (
        <EmptyState
          emoji={EMPTY.search.emoji}
          title={EMPTY.search.title}
          description={EMPTY.search.line}
          actionLabel="Filtreleri temizle"
          onAction={() => {
            setQuery('');
            setCategory('all');
          }}
        />
      ) : (
        <View style={styles.list}>
          {filtered.map((asset) => (
            <AssetRow
              key={asset.id}
              asset={asset}
              valuation={valuations[asset.id] ?? null}
              onPress={() => root.navigate('AssetDetail', { assetId: asset.id })}
            />
          ))}
        </View>
      )}

      <AdSlotView
        slot="asset-list-footer"
        onPressCta={() => root.navigate('Paywall', { source: 'assets' })}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  headerAction: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  chips: { gap: spacing.sm, paddingRight: spacing.md },
  sortHint: { color: colors.textFaint },
  list: { gap: spacing.sm },
});
