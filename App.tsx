import { useFonts } from 'expo-font';
import { StatusBar } from 'expo-status-bar';
import React from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { BRAND } from '@/content/vibes';
import { RootNavigator } from '@/navigation/RootNavigator';
import { AppProvider } from '@/store/AppContext';
import { colors, spacing } from '@/theme';
import {
  Baloo2_600SemiBold,
  Baloo2_700Bold,
  Baloo2_800ExtraBold,
  Nunito_400Regular,
  Nunito_600SemiBold,
  Nunito_700Bold,
} from '@/theme/typography';

export default function App() {
  const [fontsLoaded] = useFonts({
    Baloo2_600SemiBold,
    Baloo2_700Bold,
    Baloo2_800ExtraBold,
    Nunito_400Regular,
    Nunito_600SemiBold,
    Nunito_700Bold,
  });

  return (
    <SafeAreaProvider>
      <View style={styles.root}>
        <StatusBar style="light" backgroundColor={colors.background} />
        {fontsLoaded ? (
          <AppProvider>
            <RootNavigator />
          </AppProvider>
        ) : (
          <SplashPlaceholder />
        )}
      </View>
    </SafeAreaProvider>
  );
}

/** Yazı tipleri yüklenene kadar gösterilen açılış ekranı. */
function SplashPlaceholder() {
  return (
    <View style={styles.splash}>
      <Text style={styles.splashEmoji}>🪙</Text>
      {/* Marka yazı tipi henüz hazır değil; sistem fontuyla gösterilir. */}
      <Text style={styles.splashWordmark}>{BRAND.name}</Text>
      <Text style={styles.splashTagline}>{BRAND.tagline}</Text>
      <ActivityIndicator color={colors.green} style={styles.splashSpinner} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  splash: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    backgroundColor: colors.background,
  },
  splashEmoji: { fontSize: 56, lineHeight: 68 },
  splashWordmark: {
    color: colors.text,
    fontSize: 30,
    fontWeight: '800',
    letterSpacing: 1,
  },
  splashTagline: { color: colors.green, fontSize: 15 },
  splashSpinner: { marginTop: spacing.lg },
});
