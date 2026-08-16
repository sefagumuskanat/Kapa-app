import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';

import { Button, Card, Disclaimer, PaywallCard } from '@/components';
import { Screen } from '@/components/Screen';
import type { RootStackParamList } from '@/navigation/types';
import { PREMIUM_FEATURES, PRODUCTS } from '@/services';
import { useApp } from '@/store/AppContext';
import { colors, radius, spacing, typography } from '@/theme';
import { formatDate } from '@/utils/format';

type Props = NativeStackScreenProps<RootStackParamList, 'Paywall'>;

export function PaywallScreen({ navigation }: Props) {
  const { entitlement, isPremium, purchasePremium, restorePurchases, cancelPremium } = useApp();
  const [selected, setSelected] = useState(PRODUCTS[1]?.productId ?? PRODUCTS[0].productId);
  const [purchasing, setPurchasing] = useState(false);
  const [restoring, setRestoring] = useState(false);

  const handlePurchase = async () => {
    setPurchasing(true);
    try {
      await purchasePremium(selected);
      Alert.alert('Premium sende! 👑', 'Şaka gibi ama demo. Gerçekten para ödemedin.');
    } catch (error) {
      Alert.alert('Olmadı', error instanceof Error ? error.message : 'Bir terslik oldu.');
    } finally {
      setPurchasing(false);
    }
  };

  const handleRestore = async () => {
    setRestoring(true);
    try {
      await restorePurchases();
      Alert.alert(
        'Bakalım…',
        isPremium
          ? 'Zaten premium’sun, ekstra bir şey yok. 🙂'
          : 'Bu telefonda eski bir abonelik bulamadık. (Demo mağaza)',
      );
    } finally {
      setRestoring(false);
    }
  };

  return (
    <Screen
      title="KAPAMETRE Premium"
      subtitle="Demo mağaza · paran gitmiyor, merak etme"
      onBack={() => navigation.goBack()}
    >
      {isPremium ? (
        <Card elevated style={styles.activeCard}>
          <Ionicons name="checkmark-circle" size={28} color={colors.green} />
          <Text style={[typography.heading, styles.activeTitle]}>👑 Premium sende</Text>
          <Text style={[typography.body, styles.muted]}>
            {entitlement.renewsAt
              ? `${formatDate(entitlement.renewsAt)} tarihinde yenilenecek`
              : 'Abonelik açık.'}
          </Text>
          <Button
            label="İptal et (demo)"
            onPress={() => void cancelPremium()}
            variant="danger"
            fullWidth
          />
        </Card>
      ) : (
        <>
          <View style={styles.features}>
            {PREMIUM_FEATURES.map((feature) => (
              <View key={feature.key} style={styles.featureRow}>
                <View style={styles.featureIcon}>
                  <Ionicons name="sparkles-outline" size={16} color={colors.gold} />
                </View>
                <View style={styles.featureBody}>
                  <Text style={[typography.bodyStrong, styles.featureTitle]}>{feature.title}</Text>
                  <Text style={[typography.caption, styles.muted]}>{feature.description}</Text>
                </View>
              </View>
            ))}
          </View>

          <View style={styles.products}>
            {PRODUCTS.map((product) => (
              <PaywallCard
                key={product.productId}
                product={product}
                selected={selected === product.productId}
                onSelect={() => setSelected(product.productId)}
              />
            ))}
          </View>

          <Button
            label="Premium’a geç 🚀"
            onPress={() => void handlePurchase()}
            loading={purchasing}
            size="lg"
            fullWidth
          />

          <Pressable
            accessibilityRole="button"
            onPress={() => void handleRestore()}
            disabled={restoring}
            style={styles.restore}
          >
            <Text style={[typography.caption, styles.restoreText]}>
              {restoring ? 'Bakıyoruz…' : 'Eskiden almıştım, geri yükle'}
            </Text>
          </Pressable>
        </>
      )}

      <Card style={styles.noteCard}>
        <Text style={[typography.caption, styles.muted]}>
🔒 Premium sadece uygulama içi özellikleri açıyor. Paran olsun olmasın, listen yine telefonunda kalıyor — kimseyle paylaşmıyoruz.
        </Text>
      </Card>

      <Disclaimer text="Fiyatlar göstermelik. Bu ekran gerçek bir ödeme başlatmıyor." />
    </Screen>
  );
}

const styles = StyleSheet.create({
  activeCard: { gap: spacing.sm, alignItems: 'flex-start' },
  activeTitle: { color: colors.text },
  muted: { color: colors.textMuted },
  features: { gap: spacing.md },
  featureRow: { flexDirection: 'row', gap: spacing.md, alignItems: 'flex-start' },
  featureIcon: {
    width: 32,
    height: 32,
    borderRadius: radius.md,
    backgroundColor: colors.goldSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureBody: { flex: 1, gap: 2 },
  featureTitle: { color: colors.text },
  products: { gap: spacing.sm },
  restore: { minHeight: 44, alignItems: 'center', justifyContent: 'center' },
  restoreText: { color: colors.textMuted, textDecorationLine: 'underline' },
  noteCard: { backgroundColor: colors.card },
});
