import { Ionicons } from '@expo/vector-icons';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';

import { ActionRow, Card, Disclaimer, Section, ToggleRow } from '@/components';
import { Screen } from '@/components/Screen';
import type { RootStackParamList, TabParamList } from '@/navigation/types';
import { FREQUENCY_LABEL, privacyService } from '@/services';
import { useApp } from '@/store/AppContext';
import { colors, spacing, typography } from '@/theme';
import { DELETE_ALL, NOT_A_BANK, WHAT_WE_DO } from '@/content/vibes';
import { findProfession } from '@/data/professions';

type Props = BottomTabScreenProps<TabParamList, 'Settings'>;

export function SettingsScreen({}: Props) {
  const root = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const {
    preferences,
    consent,
    entitlement,
    isPremium,
    assets,
    offline,
    profile,
    reminders,
    setReminderFrequency,
    signOut,
    updatePreferences,
    setRankConsent,
    deleteAllData,
    loadDemoData,
    setOffline,
  } = useApp();

  const [busy, setBusy] = useState(false);
  const encryption = privacyService.getEncryptionStatus();
  const inventory = privacyService.getDataInventory();

  const confirmDeleteAll = () => {
    Alert.alert(
      DELETE_ALL.title,
      DELETE_ALL.body(assets.length, 0),
      [
        { text: DELETE_ALL.cancel, style: 'cancel' },
        {
          text: DELETE_ALL.confirm,
          style: 'destructive',
          onPress: () => {
            setBusy(true);
            void deleteAllData()
              .then(() => Alert.alert('Tertemiz 🧹', 'Her şey silindi. Sıfırdan başlayabilirsin.'))
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
        else Alert.alert('Olmadı', result.reason);
      })
      .finally(() => setBusy(false));
  };

  return (
    <Screen title="Ayarlar" subtitle="Ne nerede duruyor, kim ne görüyor" offline={offline}>
      <Section title="Hesap">
        <ActionRow
          emoji="🙋"
          title={profile ? profile.firstName : 'Hesap yok'}
          description={
            profile
              ? `${profile.birthYear} doğumlu · ${findProfession(profile.professionId)?.label ?? '—'}`
              : '—'
          }
          onPress={() => {}}
        />
        <ActionRow
          emoji="🚪"
          title="Çıkış yap"
          description="Hesabı bu cihazdan çıkarır. Varlıkların silinmez."
          onPress={() =>
            Alert.alert('Çıkış', 'Hesabından çıkmak istediğine emin misin?', [
              { text: 'Vazgeç', style: 'cancel' },
              { text: 'Çıkış yap', style: 'destructive', onPress: () => void signOut() },
            ])
          }
          tone="danger"
        />
      </Section>

      <Section title="Abonelik">
        <ActionRow
          emoji={isPremium ? '👑' : '🎟️'}
          title={isPremium ? 'Premium sende' : 'Bedava sürümdesin'}
          description={
            isPremium
              ? `Aktif · ${entitlement.productId ?? '—'} (demo)`
              : 'Sıralamada tam yerini gör, reklamlardan kurtul.'
          }
          onPress={() => root.navigate('Paywall', { source: 'settings' })}
        />
      </Section>

      <Section
        title="Gizlilik"
        footer="Sıralama tamamen sana kalmış. İstediğin an kapatırsın, kimse arayıp sormaz."
      >
        <ToggleRow
          emoji="🏆"
          title="Sıralamaya katıl"
          description="Sadece toplamının hangi aralıkta olduğu, uydurma bir adla gider."
          value={consent.granted}
          onValueChange={(value) => void setRankConsent(value)}
        />
        <ActionRow
          emoji="📢"
          title={isPremium ? 'Reklam yok' : 'Reklamlar açık'}
          description={
            isPremium
              ? 'Premium olduğun için reklam gösterilmiyor. Açmak diye bir şey yok.'
              : 'Bedava sürümde reklamlar kapanmıyor — uygulamayı bunlar döndürüyor. Premium tek çıkış yolu.'
          }
          onPress={() => root.navigate('Paywall', { source: 'settings-ads' })}
        />
        <ToggleRow
          emoji="🔐"
          title="Parmak izi kilidi"
          description="Meraklı gözlere karşı. (Demoda taklidini yapıyoruz)"
          value={preferences.biometricLockEnabled}
          onValueChange={toggleBiometric}
          disabled={busy}
        />
        <ToggleRow
          emoji="🩺"
          title="Anonim hata raporu"
          description="Uygulama çökerse haberimiz olsun diye. Neyin olduğu asla gitmez."
          value={preferences.anonymousDiagnosticsEnabled}
          onValueChange={(value) => void updatePreferences({ anonymousDiagnosticsEnabled: value })}
        />
      </Section>

      <Card style={styles.card}>
        <Text style={[typography.subheading, styles.cardTitle]}>📍 Neyin nerede duruyor</Text>
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

      </Card>

      <Card style={styles.card}>
        <Text style={[typography.subheading, styles.cardTitle]}>🔒 Şifreleme</Text>
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
Dürüst olalım: bu demoda şifreleme katmanı taklit. Gerçek sürümde telefonun kendi güvenli deposu kullanılacak. Şimdilik telefonunu birine verirken dikkat et.
          </Text>
        ) : null}
      </Card>

      <Section
        title="Fiyat hatırlatması"
        footer="Altın ve gümüşü biz takip ediyoruz. Ev, arsa, pırlanta, araba gibi kalemlerin fiyatını sen giriyorsun — o yüzden ara ara dürtüyoruz. Kapatılmıyor, sadece sıklığı değişiyor."
      >
        {(Object.keys(FREQUENCY_LABEL) as Array<keyof typeof FREQUENCY_LABEL>).map((key) => (
          <ActionRow
            key={key}
            emoji={reminders.frequency === key ? '✅' : '⏰'}
            title={FREQUENCY_LABEL[key]}
            description={reminders.frequency === key ? 'Şu an bu seçili' : undefined}
            onPress={() => void setReminderFrequency(key)}
          />
        ))}
      </Section>

      <Section title="Demo" footer="Burası sadece demo sürümünde var.">
        <ActionRow
          emoji="🎁"
          title="Örnek listeyi yükle"
          description="5 örnek eşya yükler. Mevcut listenin üstüne yazar."
          onPress={() => void loadDemoData()}
        />
        <ToggleRow
          emoji="📡"
          title="İnternetsiz gibi yap"
          description="Uygulama internetsizken nasıl davranıyor, gör."
          value={offline}
          onValueChange={setOffline}
        />
      </Section>

      <Section title="Veri" footer="Silince gerçekten gidiyor. Yedek falan tutmuyoruz.">
        <ActionRow
          emoji="🔥"
          title="Her şeyi sil"
          description="Ne varsa gider. Geri dönüşü yok."
          onPress={confirmDeleteAll}
          tone="danger"
        />
      </Section>

      <Card style={styles.card}>
        <Text style={[typography.subheading, styles.cardTitle]}>🤨 Biz ne değiliz</Text>
        {NOT_A_BANK.map((item) => (
          <View key={item.text} style={styles.bulletRow}>
            <Text style={styles.bulletEmoji}>{item.emoji}</Text>
            <Text style={[typography.caption, styles.muted]}>{item.text}</Text>
          </View>
        ))}
        <View style={styles.divider} />
        <View style={styles.bulletRow}>
          <Text style={styles.bulletEmoji}>{WHAT_WE_DO.emoji}</Text>
          <Text style={[typography.caption, styles.muted]}>{WHAT_WE_DO.text}</Text>
        </View>
      </Card>

      <Disclaimer />
    </Screen>
  );
}

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
  bulletEmoji: { fontSize: 14, lineHeight: 19 },
});
