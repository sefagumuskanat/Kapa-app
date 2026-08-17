import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Button, Card, Input } from '@/components';
import { Screen } from '@/components/Screen';
import type { RootStackParamList } from '@/navigation/types';
import { authService } from '@/services';
import { useApp } from '@/store/AppContext';
import { colors, radius, spacing, typography } from '@/theme';

type Props = NativeStackScreenProps<RootStackParamList, 'VerifyEmail'>;

export function VerifyEmailScreen({ route }: Props) {
  const { profile, verifyEmail, resendCode, signOut } = useApp();
  const [code, setCode] = useState('');
  const [demoCode, setDemoCode] = useState(route.params?.demoCode ?? '');

  /**
   * Kodu depodan oku. Kayıt sonrası ekran koşullu olarak değiştiği için
   * navigasyon parametresi güvenilir değil; tek doğru kaynak depo.
   */
  useEffect(() => {
    if (demoCode) return;
    let active = true;
    void authService.peekDemoCode().then((code) => {
      if (active && code) setDemoCode(code);
    });
    return () => {
      active = false;
    };
  }, [demoCode]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    setBusy(true);
    setError(null);
    try {
      const result = await verifyEmail(code);
      // Başarılıysa RootNavigator koşullu olarak Tabs'a geçer, burada iş kalmaz.
      if (!result.ok) setError(result.message);
    } finally {
      setBusy(false);
    }
  };

  const resend = async () => {
    setBusy(true);
    try {
      const next = await resendCode();
      setDemoCode(next);
      setError(null);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen title="E-postanı doğrula" subtitle={profile?.email ?? ''}>
      <View style={styles.iconWrap}>
        <Text style={styles.emoji}>📬</Text>
      </View>

      {/* Dürüstlük: sunucu yok, mail gitmiyor. Bunu saklamıyoruz. */}
      <Card style={styles.demoCard}>
        <Text style={[typography.subheading, styles.demoTitle]}>Demo doğrulama</Text>
        <Text style={[typography.body, styles.muted]}>
          Bu sürümde sunucu olmadığı için gerçekten e-posta göndermiyoruz. Kodu burada
          gösteriyoruz — “mail attık” deyip seni bekletmek olmazdı.
        </Text>
        <View style={styles.codeBox}>
          <Text style={[typography.display, styles.code]}>{demoCode || '——————'}</Text>
        </View>
      </Card>

      <Input
        label="Koddaki 6 haneyi gir"
        value={code}
        onChangeText={(value) => {
          setCode(value.replace(/\D/g, '').slice(0, 6));
          if (error) setError(null);
        }}
        keyboardType="number-pad"
        placeholder="000000"
        error={error}
      />

      <Button
        label="Doğrula"
        onPress={() => void submit()}
        loading={busy}
        disabled={code.length !== 6}
        size="lg"
        fullWidth
      />

      <Pressable accessibilityRole="button" onPress={() => void resend()} style={styles.linkRow}>
        <Text style={[typography.caption, styles.link]}>Kodu yenile</Text>
      </Pressable>

      <Pressable accessibilityRole="button" onPress={() => void signOut()} style={styles.linkRow}>
        <Text style={[typography.caption, styles.muted]}>Bilgileri yanlış girdim, baştan alayım</Text>
      </Pressable>
    </Screen>
  );
}

const styles = StyleSheet.create({
  iconWrap: { alignItems: 'center', paddingVertical: spacing.md },
  emoji: { fontSize: 56, lineHeight: 68 },
  demoCard: { gap: spacing.sm, backgroundColor: colors.goldSoft, borderColor: colors.gold },
  demoTitle: { color: colors.gold },
  muted: { color: colors.textMuted },
  codeBox: {
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderRadius: radius.lg,
    backgroundColor: colors.background,
  },
  code: { color: colors.gold, letterSpacing: 6 },
  linkRow: { minHeight: 44, alignItems: 'center', justifyContent: 'center' },
  link: { color: colors.green },
});
