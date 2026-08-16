import { Ionicons } from '@expo/vector-icons';
import { BottomTabBarProps, createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type { RootStackParamList, TabParamList } from './types';
import { AssetListScreen } from '@/screens/AssetListScreen';
import { HomeScreen } from '@/screens/HomeScreen';
import { RankingScreen } from '@/screens/RankingScreen';
import { SettingsScreen } from '@/screens/SettingsScreen';
import { colors, radius, spacing, TOUCH_TARGET, typography } from '@/theme';

const Tab = createBottomTabNavigator<TabParamList>();

const ICONS: Record<keyof TabParamList, keyof typeof Ionicons.glyphMap> = {
  Home: 'home-outline',
  Assets: 'layers-outline',
  AddTab: 'add',
  Ranking: 'trending-up-outline',
  Settings: 'settings-outline',
};

const LABELS: Record<keyof TabParamList, string> = {
  Home: 'Ana Sayfa',
  Assets: 'Varlıklar',
  AddTab: 'Ekle',
  Ranking: 'Sıralama',
  Settings: 'Ayarlar',
};

/** Ortada yükseltilmiş "Ekle" butonu olan özel tab bar. */
function TabBar({ state, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const rootNavigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  return (
    <View style={[styles.bar, { paddingBottom: Math.max(insets.bottom, spacing.sm) }]}>
      {state.routes.map((route, index) => {
        const name = route.name as keyof TabParamList;
        const focused = state.index === index;

        if (name === 'AddTab') {
          return (
            <Pressable
              key={route.key}
              accessibilityRole="button"
              accessibilityLabel="Varlık ekle"
              onPress={() => rootNavigation.navigate('AddAsset')}
              style={({ pressed }) => [styles.addButton, pressed && styles.pressed]}
            >
              <Ionicons name="add" size={26} color={colors.background} />
            </Pressable>
          );
        }

        return (
          <Pressable
            key={route.key}
            accessibilityRole="tab"
            accessibilityState={{ selected: focused }}
            accessibilityLabel={LABELS[name]}
            onPress={() => {
              const event = navigation.emit({
                type: 'tabPress',
                target: route.key,
                canPreventDefault: true,
              });
              if (!focused && !event.defaultPrevented) navigation.navigate(route.name);
            }}
            style={({ pressed }) => [styles.tab, pressed && styles.pressed]}
          >
            <Ionicons
              name={focused ? (ICONS[name].replace('-outline', '') as keyof typeof Ionicons.glyphMap) : ICONS[name]}
              size={22}
              color={focused ? colors.green : colors.textFaint}
            />
            <Text
              style={[typography.caption, styles.tabLabel, focused && styles.tabLabelActive]}
              numberOfLines={1}
            >
              {LABELS[name]}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

/** AddTab hiçbir zaman render edilmez; basıldığında modal açılır. */
function AddPlaceholder() {
  return <View style={styles.placeholder} />;
}

export function TabNavigator() {
  return (
    <Tab.Navigator
      tabBar={(props) => <TabBar {...props} />}
      screenOptions={{ headerShown: false, sceneStyle: { backgroundColor: colors.background } }}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Assets" component={AssetListScreen} />
      <Tab.Screen
        name="AddTab"
        component={AddPlaceholder}
        listeners={{ tabPress: (event) => event.preventDefault() }}
      />
      <Tab.Screen name="Ranking" component={RankingScreen} />
      <Tab.Screen name="Settings" component={SettingsScreen} />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingTop: spacing.sm,
    paddingHorizontal: spacing.sm,
    backgroundColor: colors.card,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 12, shadowOffset: { width: 0, height: -4 } },
      android: { elevation: 12 },
      default: {},
    }),
  },
  tab: {
    flex: 1,
    minHeight: TOUCH_TARGET,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  addButton: {
    width: 56,
    height: 56,
    borderRadius: radius.pill,
    backgroundColor: colors.green,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -24,
    marginHorizontal: spacing.xs,
  },
  pressed: { opacity: 0.7 },
  tabLabel: { color: colors.textFaint, fontSize: 11 },
  tabLabelActive: { color: colors.green, fontWeight: '600' },
  placeholder: { flex: 1, backgroundColor: colors.background },
});
