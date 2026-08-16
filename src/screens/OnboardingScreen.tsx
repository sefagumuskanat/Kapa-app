import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button, Card, Disclaimer, ToggleRow } from '@/components';
import type { RootStackParamList } from '@/navigation/types';
import { useApp } from '@/store/AppContext';
import { colors, radius, spacing, TOUCH_TARGET, typography } from '@/theme';

type Props = NativeStackScreenProps<RootStackParamList, 'Onboarding'>;

interface Slide {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  body: string;
}

const SLIDES: Slide[] = [
  {
    icon: 'list-outline',
    title: 'Varlıklarını yaz',
    body: 'Altın, elektronik, mücevher, bisiklet… Fotoğraf yok, form yok gibi kısa metinle ekle. Ne kadara aldığını hatırlamıyorsan da sorun değil.',
  },
  {
    icon: 'options-outline',
    title: 'Üç senaryoda gör',
    body: 'Her varlık için Hızlı Satış, Normal Satış ve Tok Satıcı değeri hesaplanır. Normal Satış ana metriktir; toplamın ve sıralaman onu kullanır.',
  },
  {
    icon: 'lock-closed-outline',
    title: 'Veri cihazında kalır',
    body: 'Varlık listen şifreli olarak cihazında tutulur. Sunucuya yalnızca kategori ve birim düzeyinde fiyat sorgusu gider.',
  },
];

export function OnboardingScreen({}: Props) {
  const { completeOnboarding, setRankConsent, loadDemoData } = useApp();
  const [step, setStep] = useState(0);
  const [ageConfirmed, setAgeConfirmed] = useState(false);
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
      await loadDemoData();
      // Onboarding ekranı stack'ten koşullu olarak kalkar; manuel reset gerekmez.
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
          <Text style={[typography.display, styles.wordmark]}>KAPAMETRE</Text>
          <Text style={[typography.subheading, styles.tagline]}>Varlığını ölç.</Text>
        </View>

        {!isGateStep && slide ? (
          <View style={styles.slide}>
            <View style={styles.iconCircle}>
              <Ionicons name={slide.icon} size={30} color={colors.green} />
            </View>
            <Text style={[typography.title, styles.slideTitle]}>{slide.title}</Text>
            <Text style={[typography.body, styles.slideBody]}>{slide.body}</Text>
          </View>
        ) : (
          <View style={styles.gate}>
            <Card style={styles.gateCard}>
              <Text style={[typography.heading, styles.gateTitle]}>Yaş doğrulaması</Text>
              <Text style={[typography.body, styles.gateBody]}>
                KAPAMETRE 13 yaş ve üzeri içindir. Devam etmek için onayla.
              </Text>
              <Pressable
                accessibilityRole="checkbox"
                accessibilityState={{ checked: ageConfirmed }}
                onPress={() => setAgeConfirmed((value) => !value)}
                style={({ pressed }) => [styles.checkRow, pressed && styles.pressed]}
              >
                <View style={[styles.checkbox, ageConfirmed && styles.checkboxChecked]}>
                  {ageConfirmed ? (
                    <Ionicons name="checkmark" size={14} color={colors.background} />
                  ) : null}
                </View>
                <Text style={[typography.body, styles.checkLabel]}>13 yaşından büyüğüm.</Text>
              </Pressable>
            </Card>

            <Card padded={false} style={styles.gateCard}>
              <ToggleRow
                icon="trending-up-outline"
                title="Sıralamaya katıl"
                description="İsteğe bağlı ve ayrıdır. Yalnızca Normal Satış toplamın takma bir kimlikle paylaşılır. Kullanıcı listesi veya profil yoktur; istediğin an kapatabilirsin."
                value={rankOptIn}
                onValueChange={setRankOptIn}
              />
            </Card>

            <Disclaimer text="KAPAMETRE banka değildir, yatırım tavsiyesi vermez ve satış garantisi sunmaz. Gösterilen değerler tahminidir." />
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
          label={isGateStep ? 'Başla' : 'Devam'}
          onPress={handleNext}
          size="lg"
          fullWidth
          loading={submitting}
          disabled={isGateStep && !ageConfirmed}
        />
        {!isGateStep ? (
          <Pressable
            accessibilityRole="button"
            onPress={() => setStep(SLIDES.length)}
            style={styles.skip}
          >
            <Text style={[typography.caption, styles.skipText]}>Geç</Text>
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
    paddingTop: spacing.xl,
    gap: spacing.xl,
  },
  brand: { gap: spacing.xs },
  wordmark: { color: colors.text, letterSpacing: 1 },
  tagline: { color: colors.green },

  slide: { gap: spacing.md, paddingTop: spacing.lg },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: radius.pill,
    backgroundColor: colors.greenSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
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
    width: 22,
    height: 22,
    borderRadius: radius.sm,
    borderWidth: 1.5,
    borderColor: colors.borderStrong,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: { backgroundColor: colors.green, borderColor: colors.green },
  checkLabel: { color: colors.text, flex: 1 },
  pressed: { opacity: 0.7 },

  dots: { flexDirection: 'row', gap: spacing.sm, marginTop: 'auto', paddingTop: spacing.lg },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.border },
  dotActive: { backgroundColor: colors.green, width: 20 },

  footer: { padding: spacing.lg, gap: spacing.sm },
  skip: { minHeight: TOUCH_TARGET, alignItems: 'center', justifyContent: 'center' },
  skipText: { color: colors.textMuted },
});
