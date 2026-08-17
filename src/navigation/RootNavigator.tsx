import { DarkTheme, NavigationContainer, Theme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { TabNavigator } from './TabNavigator';
import type { RootStackParamList } from './types';
import { AddAssetScreen } from '@/screens/AddAssetScreen';
import { AssetDetailScreen } from '@/screens/AssetDetailScreen';
import { OnboardingScreen } from '@/screens/OnboardingScreen';
import { PaywallScreen } from '@/screens/PaywallScreen';
import { RegisterScreen } from '@/screens/RegisterScreen';
import { ShareScreen } from '@/screens/ShareScreen';
import { useApp } from '@/store/AppContext';
import { colors } from '@/theme';

const Stack = createNativeStackNavigator<RootStackParamList>();

const navigationTheme: Theme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    background: colors.background,
    card: colors.card,
    text: colors.text,
    primary: colors.green,
    border: colors.border,
    notification: colors.red,
  },
};

export function RootNavigator() {
  const { status, onboarding, isAuthenticated } = useApp();

  if (status === 'idle' || status === 'loading') {
    return (
      <View style={styles.splash}>
        <ActivityIndicator color={colors.green} size="large" />
      </View>
    );
  }

  return (
    <NavigationContainer theme={navigationTheme}>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.background },
          animation: 'slide_from_right',
        }}
      >
        {/*
          Akış sırası: tanıtım → kayıt → e-posta doğrulama → uygulama.
          Kayıt zorunlu olduğu için doğrulanmamış kullanıcı sekmelere ulaşamaz.
        */}
        {!onboarding.completed ? (
          <Stack.Screen name="Onboarding" component={OnboardingScreen} />
        ) : !isAuthenticated ? (
          <Stack.Screen name="Register" component={RegisterScreen} />
        ) : null}
        <Stack.Screen name="Tabs" component={TabNavigator} />
        <Stack.Screen
          name="AddAsset"
          component={AddAssetScreen}
          options={{ presentation: 'modal', animation: 'slide_from_bottom' }}
        />
        <Stack.Screen name="AssetDetail" component={AssetDetailScreen} />
        <Stack.Screen
          name="Paywall"
          component={PaywallScreen}
          options={{ presentation: 'modal', animation: 'slide_from_bottom' }}
        />
        <Stack.Screen
          name="Share"
          component={ShareScreen}
          options={{ presentation: 'modal', animation: 'slide_from_bottom' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  splash: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
  },
});
