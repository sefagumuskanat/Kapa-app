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
import { CATEGORY_LABEL, formatCurrency, SCENARIO_LABEL } from '@/utils/format';

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

  if (status === 'error') {
    return (
      <Screen title="Varlıklar">
        <ErrorState description={error ?? 'Varlıklar yüklenemedi.'} onRetry={() => void reload()} />
      </Screen>
    );
  }

  if (status === 'loading') {
    return (
      <Screen title="Varlıklar">
        <ListSkeleton rows={5} />
      </Screen>
    );
  }

  if (assets.length === 0) {
    return (
      <Screen title="Varlıklar" offline={offline}>
        <EmptyState
          icon="layers-outline"
          title="Liste boş"
          description="Eklediğin her varlık burada Normal Satış değeriyle listelenir."
          actionLabel="Varlık ekle"
          onAction={() => root.navigate('AddAsset')}
          secondaryActionLabel="Demo veriyi yükle"
          onSecondaryAction={() => void loadDemoData()}
        />
      </Screen>
    );
  }

  return (
    <Screen
      title="Varlıklar"
      subtitle={`${filtered.length} varlık · ${formatCurrency(visibleTotal, 'TRY', true)}`}
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
        placeholder="Varlık ara"
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
          label="Tümü"
          selected={category === 'all'}
          onPress={() => setCategory('all')}
          tone="green"
        />
        {categories.map((item) => (
          <Chip
            key={item}
            label={CATEGORY_LABEL[item]}
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
          { value: 'value-desc', label: 'Yüksek → Düşük' },
          { value: 'value-asc', label: 'Düşük → Yüksek' },
          { value: 'recent', label: 'Son eklenen' },
        ]}
      />

      <Text style={[typography.caption, styles.sortHint]}>
        Sıralama {SCENARIO_LABEL.normal} değerine göre yapılır.
      </Text>

      {filtered.length === 0 ? (
        <EmptyState
          icon="search-outline"
          title="Sonuç yok"
          description="Aramanı veya kategori filtresini değiştirmeyi dene."
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
