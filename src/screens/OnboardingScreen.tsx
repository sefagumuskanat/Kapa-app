import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button, Card, Disclaimer, ToggleRow } from '@/components';
import { BRAND, RANK_PITCH } from '@/content/vibes';
import type { RootStackParamList } from '@/navigation/types';
import { useApp } from '@/store/AppContext';
import { colors, radius, spacing, TOUCH_TARGET, typography } from '@/theme';

type Props = NativeStackScreenProps<RootStackParamList, 'Onboarding'>;

interface Slide {
  emoji: string;
  title: string;
  body: string;
}

const SLIDES: Slide[] = [
  {
    emoji: '✍️',
    title: 'Neyin var, yaz',
    body: 'Altın, telefon, bisiklet, yüzük… aklına ne geliyorsa. Fotoğraf çekmene gerek yok, iki kelimeyle yaz geç. Ne kadara aldığını hatırlamıyorsan da olur, kimse kızmaz.',
  },
  {
    emoji: '💸',
    title: 'Üç ihtimali gör',
    body: 'Her şey için üç rakam veriyoruz: acil satarsan, normal satarsan, bir de bekleyip iyi fiyata satarsan. Ortadaki rakam senin asıl karneni belirliyor.',
  },
  {
    emoji: '🤫',
    title: 'Kimse görmüyor',
    body: 'Listen telefonunda kalıyor. Biz görmüyoruz, eşin dostun hiç görmüyor. Sunucuya sadece “altın gram kaç para” tarzı bir soru gidiyor, senin adın sanın değil.',
  },
];

export function OnboardingScreen({}: Props) {
  const { completeOnboarding, setRankConsent } = useApp();
  const [step, setStep] = useState(0);
  const [rankOptIn, setRankOptIn] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const isGateStep = step === SLIDES.length;

  const handleNext = () => {
    if (!isGateStep) {
      setStep((current) => current + 1);
      return;
    }
    void finish();
  };

  const finish = async () => {
    setSubmitting(true);
    try {
      // Sıralama rızası yaş kapısından ayrı ve bağımsız olarak alınır.
      if (rankOptIn) await setRankConsent(true);
      // Demo veri yüklemiyoruz: kullanıcı kendi listesini sıfırdan kursun.
      await completeOnboarding(true);
    } finally {
      setSubmitting(false);
    }
  };

  const slide = SLIDES[step];

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.brand}>
          <Text style={styles.coin}>🪙</Text>
          <Text style={[typography.display, styles.wordmark]}>{BRAND.name}</Text>
          <Text style={[typography.heading, styles.tagline]}>{BRAND.tagline}</Text>
          {step === 0 ? (
            <View style={styles.expansionPill}>
              <Text style={[typography.caption, styles.expansion]}>{BRAND.expansion}</Text>
            </View>
          ) : null}
        </View>

        {!isGateStep && slide ? (
          <View style={styles.slide}>
            <View style={styles.emojiCircle}>
              <Text style={styles.slideEmoji}>{slide.emoji}</Text>
            </View>
            <Text style={[typography.title, styles.slideTitle]}>{slide.title}</Text>
            <Text style={[typography.body, styles.slideBody]}>{slide.body}</Text>
          </View>
        ) : (
          <View style={styles.gate}>
            <Card style={styles.gateCard}>
              <Text style={[typography.heading, styles.gateTitle]}>🙋 Sıra sende</Text>
              <Text style={[typography.body, styles.gateBody]}>
                Devam edince kısa bir kayıt var: adın, doğum tarihin, e-postan ve ne iş
                yaptığın. Yaş kontrolünü de doğum tarihinden yapıyoruz.
              </Text>
            </Card>

            <Card padded={false} style={styles.gateCard}>
              <ToggleRow
                emoji={RANK_PITCH.emoji}
                title={RANK_PITCH.title}
                description={RANK_PITCH.line}
                value={rankOptIn}
                onValueChange={setRankOptIn}
              />
            </Card>

            <Disclaimer />
          </View>
        )}

        <View style={styles.dots}>
          {[...SLIDES, null].map((_, index) => (
            <View key={index} style={[styles.dot, index === step && styles.dotActive]} />
          ))}
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <Button
          label={isGateStep ? 'Kayıt olalım' : 'Devam'}
          onPress={handleNext}
          size="lg"
          fullWidth
          loading={submitting}
        />
        {!isGateStep ? (
          <Pressable
            accessibilityRole="button"
            onPress={() => setStep(SLIDES.length)}
            style={styles.skip}
          >
            <Text style={[typography.caption, styles.skipText]}>Boş ver, geç</Text>
          </Pressable>
        ) : (
          <View style={styles.skip} />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  content: {
    flexGrow: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    gap: spacing.lg,
  },
  brand: { gap: spacing.xs, alignItems: 'flex-start' },
  coin: { fontSize: 44, lineHeight: 54 },
  wordmark: { color: colors.text, letterSpacing: 0.5 },
  tagline: { color: colors.green },
  expansionPill: {
    marginTop: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.pill,
    backgroundColor: colors.goldSoft,
  },
  expansion: { color: colors.gold },

  slide: { gap: spacing.md, paddingTop: spacing.sm },
  emojiCircle: {
    width: 84,
    height: 84,
    borderRadius: radius.pill,
    backgroundColor: colors.purpleSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  slideEmoji: { fontSize: 40, lineHeight: 48 },
  slideTitle: { color: colors.text },
  slideBody: { color: colors.textMuted },

  gate: { gap: spacing.md },
  gateCard: { gap: spacing.sm },
  gateTitle: { color: colors.text },
  gateBody: { color: colors.textMuted },
  checkRow: {
    minHeight: TOUCH_TARGET,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: radius.sm,
    borderWidth: 2,
    borderColor: colors.borderStrong,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: { backgroundColor: colors.green, borderColor: colors.green },
  checkLabel: { color: colors.text, flex: 1 },
  pressed: { opacity: 0.7 },

  dots: { flexDirection: 'row', gap: spacing.sm, marginTop: 'auto', paddingTop: spacing.lg },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.border },
  dotActive: { backgroundColor: colors.green, width: 22 },

  footer: { padding: spacing.lg, gap: spacing.sm },
  skip: { minHeight: TOUCH_TARGET, alignItems: 'center', justifyContent: 'center' },
  skipText: { color: colors.textMuted },
});
