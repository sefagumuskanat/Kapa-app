import { Ionicons } from '@expo/vector-icons';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';

import { ActionRow, Card, Disclaimer, Section, ToggleRow } from '@/components';
import { Screen } from '@/components/Screen';
import type { RootStackParamList, TabParamList } from '@/navigation/types';
import { marketPriceService, privacyService } from '@/services';
import { useApp } from '@/store/AppContext';
import { colors, spacing, typography } from '@/theme';

type Props = BottomTabScreenProps<TabParamList, 'Settings'>;

export function SettingsScreen({}: Props) {
  const root = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const {
    preferences,
    consent,
    entitlement,
    isPremium,
    assets,
    documents,
    offline,
    updatePreferences,
    setRankConsent,
    deleteAllData,
    loadDemoData,
    setOffline,
  } = useApp();

  const [busy, setBusy] = useState(false);
  const encryption = privacyService.getEncryptionStatus();
  const inventory = privacyService.getDataInventory();
  const samplePayload = marketPriceService.describeOutboundPayload({
    category: 'gold',
    unit: 'gram',
    currency: 'TRY',
  });

  const confirmDeleteAll = () => {
    Alert.alert(
      'Tüm verimi sil',
      `${assets.length} varlık ve ${documents.length} belge cihazından kalıcı olarak silinecek. Bu işlem geri alınamaz.`,
      [
        { text: 'Vazgeç', style: 'cancel' },
        {
          text: 'Kalıcı olarak sil',
          style: 'destructive',
          onPress: () => {
            setBusy(true);
            void deleteAllData()
              .then((removed) =>
                Alert.alert('Silindi', `${removed} yerel kayıt anahtarı cihazından kaldırıldı.`),
              )
              .finally(() => setBusy(false));
          },
        },
      ],
    );
  };

  const toggleBiometric = (value: boolean) => {
    if (!value) {
      void updatePreferences({ biometricLockEnabled: false });
      return;
    }
    setBusy(true);
    void privacyService
      .authenticateWithBiometrics()
      .then((result) => {
        if (result.success) void updatePreferences({ biometricLockEnabled: true });
        else Alert.alert('Doğrulanamadı', result.reason);
      })
      .finally(() => setBusy(false));
  };

  return (
    <Screen title="Ayarlar" subtitle="Gizlilik merkezi" offline={offline}>
      <Section title="Abonelik">
        <ActionRow
          icon="sparkles-outline"
          title={isPremium ? 'Premium etkin' : 'Ücretsiz kademe'}
          description={
            isPremium
              ? `Ürün: ${entitlement.productId ?? '—'} (demo mağaza)`
              : 'Detaylı sıralama, geçmiş ve reklamsız kullanım için premium.'
          }
          onPress={() => root.navigate('Paywall', { source: 'settings' })}
        />
      </Section>

      <Section
        title="Gizlilik"
        footer="Sıralama katılımı yaş onayından ve diğer ayarlardan bağımsızdır; istediğin an kapatabilirsin."
      >
        <ToggleRow
          icon="trending-up-outline"
          title="Sıralamaya katıl"
          description="Yalnızca Normal Satış toplamının kova etiketi takma kimlikle paylaşılır."
          value={consent.granted}
          onValueChange={(value) => void setRankConsent(value)}
        />
        <ToggleRow
          icon="megaphone-outline"
          title="Reklamlar"
          description="Reklam isteği finansal veri taşımaz. Premium ile tamamen kapanır."
          value={preferences.adsEnabled && !isPremium}
          onValueChange={(value) => void updatePreferences({ adsEnabled: value })}
          disabled={isPremium}
        />
        <ToggleRow
          icon="finger-print-outline"
          title="Biyometrik kilit"
          description="Uygulama açılışında cihaz doğrulaması istenir. (Demo: simüle edilir)"
          value={preferences.biometricLockEnabled}
          onValueChange={toggleBiometric}
          disabled={busy}
        />
        <ToggleRow
          icon="bar-chart-outline"
          title="Anonim tanılama"
          description="Çökme ve performans verisi. Varlık verisi asla dahil edilmez."
          value={preferences.anonymousDiagnosticsEnabled}
          onValueChange={(value) => void updatePreferences({ anonymousDiagnosticsEnabled: value })}
        />
      </Section>

      <Card style={styles.card}>
        <Text style={[typography.subheading, styles.cardTitle]}>Verin nerede duruyor?</Text>
        {inventory.map((entry) => (
          <View key={entry.key} style={styles.inventoryRow}>
            <Ionicons
              name={entry.location === 'device' ? 'phone-portrait-outline' : 'cloud-outline'}
              size={16}
              color={entry.location === 'device' ? colors.green : colors.gold}
            />
            <View style={styles.inventoryBody}>
              <Text style={[typography.bodyStrong, styles.inventoryTitle]}>{entry.label}</Text>
              <Text style={[typography.caption, styles.muted]}>{entry.description}</Text>
            </View>
          </View>
        ))}

        <View style={styles.divider} />

        <Text style={[typography.caption, styles.muted]}>
          Fiyat sorgusunda sunucuya giden payload'ın tamamı:
        </Text>
        {Object.entries(samplePayload).map(([key, value]) => (
          <View key={key} style={styles.payloadRow}>
            <Text style={[typography.mono, styles.payloadKey]}>{key}</Text>
            <Text style={[typography.mono, styles.payloadValue]}>{value}</Text>
          </View>
        ))}
      </Card>

      <Card style={styles.card}>
        <Text style={[typography.subheading, styles.cardTitle]}>Şifreleme</Text>
        <View style={styles.metaRow}>
          <Text style={[typography.body, styles.muted]}>Algoritma</Text>
          <Text style={[typography.bodyStrong, styles.metaValue]}>{encryption.algorithm}</Text>
        </View>
        <View style={styles.metaRow}>
          <Text style={[typography.body, styles.muted]}>Anahtar</Text>
          <Text style={[typography.bodyStrong, styles.metaValue]}>{encryption.keyLocation}</Text>
        </View>
        {encryption.isStub ? (
          <Text style={[typography.caption, styles.warning]}>
            Bu demo sürümde şifreleme katmanı yer tutucudur ve kriptografik güvence sağlamaz.
            Üretimde platform keystore ile AES-GCM kullanılır.
          </Text>
        ) : null}
      </Card>

      <Section title="Belgeler">
        <ActionRow
          icon="scan-outline"
          title="Belge tara"
          description={`${documents.length} belge cihazında saklanıyor.`}
          onPress={() => root.navigate('Ocr')}
        />
      </Section>

      <Section title="Demo" footer="Bu bölüm yalnızca demo sürümünde görünür.">
        <ActionRow
          icon="download-outline"
          title="Demo veriyi yükle"
          description="Örnek 5 varlığı yükler ve mevcut listeyi değiştirir."
          onPress={() => void loadDemoData()}
        />
        <ToggleRow
          icon="cloud-offline-outline"
          title="Çevrimdışı modu simüle et"
          description="Ekranlardaki çevrimdışı davranışını test et."
          value={offline}
          onValueChange={setOffline}
        />
      </Section>

      <Section title="Veri" footer="Silme işlemi yalnızca bu cihazı etkiler ve geri alınamaz.">
        <ActionRow
          icon="trash-outline"
          title="Tüm yerel verimi sil"
          description="Varlıklar, belgeler, tercihler ve sıralama rızası dahil."
          onPress={confirmDeleteAll}
          tone="danger"
        />
      </Section>

      <Card style={styles.card}>
        <Text style={[typography.subheading, styles.cardTitle]}>KAPAMETRE nedir, ne değildir?</Text>
        {NOT_LIST.map((item) => (
          <View key={item} style={styles.bulletRow}>
            <Ionicons name="close-circle-outline" size={16} color={colors.red} />
            <Text style={[typography.caption, styles.muted]}>{item}</Text>
          </View>
        ))}
        <View style={styles.bulletRow}>
          <Ionicons name="checkmark-circle-outline" size={16} color={colors.green} />
          <Text style={[typography.caption, styles.muted]}>
            Varlıklarını metin tabanlı kaydeder ve üç senaryoda değerler. Hepsi bu.
          </Text>
        </View>
      </Card>

      <Disclaimer />
    </Screen>
  );
}

const NOT_LIST = [
  'Banka veya ödeme kuruluşu değildir.',
  'Yatırım tavsiyesi vermez.',
  'Pazar yeri değildir; alım satım yapılmaz.',
  'Sosyal platform değildir; kullanıcı listesi yoktur.',
  'Fotoğraf tabanlı envanter uygulaması değildir.',
];

const styles = StyleSheet.create({
  card: { gap: spacing.sm },
  cardTitle: { color: colors.text },
  muted: { color: colors.textMuted },
  warning: { color: colors.gold },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: colors.border, marginVertical: spacing.xs },
  inventoryRow: { flexDirection: 'row', gap: spacing.sm, alignItems: 'flex-start' },
  inventoryBody: { flex: 1, gap: 2 },
  inventoryTitle: { color: colors.text },
  metaRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  metaValue: { color: colors.text },
  payloadRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 2 },
  payloadKey: { color: colors.textFaint },
  payloadValue: { color: colors.green },
  bulletRow: { flexDirection: 'row', gap: spacing.sm, alignItems: 'flex-start' },
});
