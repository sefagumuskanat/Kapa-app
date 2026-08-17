import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useRef, useState } from 'react';
import { Alert, Platform, StyleSheet, Text, View } from 'react-native';

import { Button, Card } from '@/components';
import { buildShareMessage, ShareCard, shareText } from '@/components/ShareCard';
import { Screen } from '@/components/Screen';
import { resolveKapaTier } from '@/content/vibes';
import type { RootStackParamList } from '@/navigation/types';
import { useApp } from '@/store/AppContext';
import { colors, spacing, typography } from '@/theme';

type Props = NativeStackScreenProps<RootStackParamList, 'Share'>;

export function ShareScreen({ navigation }: Props) {
  const { portfolio } = useApp();
  const cardRef = useRef<View>(null);
  const [busy, setBusy] = useState(false);

  const normalValue = portfolio?.totals.normal ?? 0;
  const tier = resolveKapaTier(normalValue);

  /**
   * Önce görseli paylaşmayı dener; ortam desteklemiyorsa metne düşer.
   * Böylece hiçbir platformda buton "ölü" kalmıyor.
   */
  const share = async () => {
    setBusy(true);
    try {
      const image = await captureCard(cardRef);
      if (image) {
        const shared = await shareImage(image);
        if (shared) return;
      }
      const ok = await shareText(buildShareMessage(normalValue, tier));
      if (!ok && Platform.OS === 'web') {
        Alert.alert(
          'Paylaşım penceresi açılmadı',
          'Tarayıcın paylaşımı desteklemiyor olabilir. Kartın ekran görüntüsünü alıp paylaşabilirsin.',
        );
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen title="Düşman çatlat" subtitle="Karneni paylaş" onBack={() => navigation.goBack()}>
      <ShareCard ref={cardRef} tier={tier} normalValue={normalValue} />

      <Button
        label="Paylaş 🚀"
        onPress={() => void share()}
        loading={busy}
        size="lg"
        fullWidth
      />
      <Text style={[typography.caption, styles.subLabel]}>
        Düşman çatlatacaksan buradan paylaş
      </Text>

      <Card style={styles.noteCard}>
        <Text style={[typography.caption, styles.muted]}>
          🔒 Paylaşılan görselde sadece toplam rakamın ve seviyen var. Neyin olduğu, listendeki
          hiçbir kalem görselde geçmiyor.
        </Text>
      </Card>
    </Screen>
  );
}

/** react-native-view-shot varsa kartı görsele çevirir. */
async function captureCard(ref: React.RefObject<View | null>): Promise<string | null> {
  if (!ref.current) return null;
  try {
    const mod = await import('react-native-view-shot');
    const capture = mod.captureRef ?? mod.default?.captureRef;
    if (!capture) return null;
    return await capture(ref, { format: 'png', quality: 1, result: 'tmpfile' });
  } catch {
    return null;
  }
}

async function shareImage(uri: string): Promise<boolean> {
  try {
    const sharing = await import('expo-sharing');
    if (!(await sharing.isAvailableAsync())) return false;
    await sharing.shareAsync(uri, { mimeType: 'image/png', dialogTitle: 'Karneni paylaş' });
    return true;
  } catch {
    return false;
  }
}

const styles = StyleSheet.create({
  subLabel: { color: colors.textMuted, textAlign: 'center' },
  muted: { color: colors.textMuted },
  noteCard: { backgroundColor: colors.card },
});
