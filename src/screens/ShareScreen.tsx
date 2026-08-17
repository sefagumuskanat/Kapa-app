import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useRef, useState } from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';

import { Button, Card } from '@/components';
import { buildShareMessage, ShareCard } from '@/components/ShareCard';
import { Screen } from '@/components/Screen';
import { resolveKapaTier } from '@/content/vibes';
import type { RootStackParamList } from '@/navigation/types';
import { useApp } from '@/store/AppContext';
import { colors, fonts, radius, spacing, typography } from '@/theme';

type Props = NativeStackScreenProps<RootStackParamList, 'Share'>;

type Status =
  | { kind: 'idle' }
  | { kind: 'ok'; text: string }
  | { kind: 'copied'; text: string }
  | { kind: 'manual'; text: string };

export function ShareScreen({ navigation }: Props) {
  const { portfolio } = useApp();
  const cardRef = useRef<View>(null);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<Status>({ kind: 'idle' });

  const normalValue = portfolio?.totals.normal ?? 0;
  const tier = resolveKapaTier(normalValue);
  const message = buildShareMessage(normalValue, tier);

  /**
   * Paylaşım zinciri — her adım bir öncekinin çalışmadığı durumda devreye girer:
   *   1. Görseli paylaş (telefonda çalışır)
   *   2. Metni sistem paylaşım penceresiyle paylaş
   *   3. Panoya kopyala
   *   4. Ekranda göster, kullanıcı elle kopyalasın
   *
   * Not: tarayıcıda `file://` ile açıldığında sistem paylaşımı yoktur
   * (navigator.share güvenli olmayan bağlamda tanımsız). Eskiden burada
   * Alert gösteriliyordu ama Alert web'de hiç çıkmıyor; buton ölü görünüyordu.
   * Bu yüzden durum artık ekranda yazıyor.
   */
  const share = async () => {
    setBusy(true);
    setStatus({ kind: 'idle' });
    try {
      const image = await captureCard(cardRef);
      if (image && (await shareImage(image))) {
        setStatus({ kind: 'ok', text: 'Paylaşım penceresi açıldı.' });
        return;
      }

      if (await shareViaSystem(message)) {
        setStatus({ kind: 'ok', text: 'Paylaşım penceresi açıldı.' });
        return;
      }

      if (await copyToClipboard(message)) {
        setStatus({
          kind: 'copied',
          text: 'Metin panoya kopyalandı. Instagram/WhatsApp’a yapıştır, kartın ekran görüntüsünü de ekle.',
        });
        return;
      }

      setStatus({
        kind: 'manual',
        text: 'Bu ortamda paylaşım penceresi açılmıyor. Aşağıdaki metni elle kopyalayabilirsin.',
      });
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen title="Düşman çatlat" subtitle="Karneni paylaş" onBack={() => navigation.goBack()}>
      <ShareCard ref={cardRef} tier={tier} normalValue={normalValue} />

      <Button label="Paylaş 🚀" onPress={() => void share()} loading={busy} size="lg" fullWidth />
      <Text style={[typography.caption, styles.subLabel]}>
        Düşman çatlatacaksan buradan paylaş
      </Text>

      {status.kind !== 'idle' ? (
        <Card style={[styles.statusCard, status.kind === 'ok' ? styles.okCard : styles.warnCard]}>
          <View style={styles.statusRow}>
            <Ionicons
              name={status.kind === 'ok' ? 'checkmark-circle' : 'information-circle-outline'}
              size={18}
              color={status.kind === 'ok' ? colors.green : colors.gold}
            />
            <Text style={[typography.caption, styles.statusText]}>{status.text}</Text>
          </View>

          {status.kind !== 'ok' ? (
            <View style={styles.messageBox}>
              {/* selectable: kullanıcı hiçbir şey çalışmazsa elle seçip kopyalayabilsin */}
              <Text selectable style={[typography.body, styles.message]}>
                {message}
              </Text>
            </View>
          ) : null}
        </Card>
      ) : null}

      {Platform.OS === 'web' ? (
        <Card style={styles.noteCard}>
          <Text style={[typography.caption, styles.muted]}>
            💡 Tarayıcıda çalıştırdığın için sistem paylaşım penceresi açılmayabilir. Telefona
            kurduğunda Instagram, WhatsApp ve story paylaşımı normal şekilde çıkar.
          </Text>
        </Card>
      ) : null}

      <Card style={styles.noteCard}>
        <Text style={[typography.caption, styles.muted]}>
          🔒 Paylaşılan görselde sadece toplam rakamın ve seviyen var. Neyin olduğu, listendeki
          hiçbir kalem görselde geçmiyor.
        </Text>
      </Card>
    </Screen>
  );
}

/* ------------------------------------------------------------------ */
/* Paylaşım yardımcıları — hepsi hata durumunda sessizce false döner   */
/* ------------------------------------------------------------------ */

async function captureCard(ref: React.RefObject<View | null>): Promise<string | null> {
  if (!ref.current) return null;
  try {
    const mod: any = await import('react-native-view-shot');
    const capture = mod.captureRef ?? mod.default?.captureRef;
    if (!capture) return null;
    return await capture(ref, { format: 'png', quality: 1, result: 'tmpfile' });
  } catch {
    return null;
  }
}

async function shareImage(uri: string): Promise<boolean> {
  try {
    const sharing: any = await import('expo-sharing');
    if (!(await sharing.isAvailableAsync())) return false;
    await sharing.shareAsync(uri, { mimeType: 'image/png', dialogTitle: 'Karneni paylaş' });
    return true;
  } catch {
    return false;
  }
}

async function shareViaSystem(message: string): Promise<boolean> {
  try {
    const { Share } = await import('react-native');
    const result = await Share.share(
      Platform.OS === 'ios' ? { message } : { message, title: 'KAPAMETRE' },
    );
    return result.action !== Share.dismissedAction;
  } catch {
    // Web'de navigator.share yoksa react-native-web burada reddeder.
    return false;
  }
}

async function copyToClipboard(message: string): Promise<boolean> {
  try {
    const clipboard: any = await import('expo-clipboard');
    await clipboard.setStringAsync(message);
    return true;
  } catch {
    /* aşağıdaki tarayıcı yoluna düş */
  }
  try {
    const nav: any = globalThis.navigator;
    if (nav?.clipboard?.writeText) {
      await nav.clipboard.writeText(message);
      return true;
    }
  } catch {
    /* yoksay */
  }
  return false;
}

const styles = StyleSheet.create({
  subLabel: { color: colors.textMuted, textAlign: 'center' },
  muted: { color: colors.textMuted },
  noteCard: { backgroundColor: colors.card },
  statusCard: { gap: spacing.sm },
  okCard: { backgroundColor: colors.greenSoft, borderColor: colors.green },
  warnCard: { backgroundColor: colors.goldSoft, borderColor: colors.gold },
  statusRow: { flexDirection: 'row', gap: spacing.sm, alignItems: 'flex-start' },
  statusText: { flex: 1, color: colors.text },
  messageBox: {
    padding: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.background,
  },
  message: { color: colors.text, fontFamily: fonts.body },
});
