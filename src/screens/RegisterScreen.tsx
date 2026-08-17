import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useMemo, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button, Card, Input } from '@/components';
import { Screen } from '@/components/Screen';
import { BRAND } from '@/content/vibes';
import { findProfession, PROFESSIONS } from '@/data/professions';
import type { RootStackParamList } from '@/navigation/types';
import { authService } from '@/services';
import { useApp } from '@/store/AppContext';
import { colors, radius, spacing, TOUCH_TARGET, typography } from '@/theme';

type Props = NativeStackScreenProps<RootStackParamList, 'Register'>;

export function RegisterScreen({}: Props) {
  const { registerAccount } = useApp();

  const [firstName, setFirstName] = useState('');
  const [birthYear, setBirthYear] = useState('');
  const [professionId, setProfessionId] = useState('');
  // Soru bir kez üretilir; her tuşta değişirse kullanıcı çıldırır.
  const [humanCheck, setHumanCheck] = useState(() => authService.createHumanCheck());
  const [humanAnswer, setHumanAnswer] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [pickerOpen, setPickerOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const profession = findProfession(professionId);

  const submit = async () => {
    const input = { firstName, birthYear, professionId };
    const found = authService.validate(input);

    if (!authService.verifyHumanCheck(humanCheck, humanAnswer)) {
      found.human = 'Sonuç tutmadı, bir daha bak.';
    }

    setErrors(found);
    if (Object.keys(found).length > 0) {
      // Yanlış cevapta yeni soru ver, aynı soruyu deneyip durmasın.
      if (found.human) {
        setHumanCheck(authService.createHumanCheck());
        setHumanAnswer('');
      }
      return;
    }

    setSubmitting(true);
    try {
      await registerAccount(input);
    } catch (error) {
      setErrors({ firstName: error instanceof Error ? error.message : 'Kayıt olmadı.' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Screen title="Hoş geldin" subtitle="Üç soru, bitti">
      <View style={styles.brand}>
        <Text style={styles.coin}>🪙</Text>
        <Text style={[typography.title, styles.wordmark]}>{BRAND.name}</Text>
        <Text style={[typography.body, styles.tagline]}>{BRAND.tagline}</Text>
      </View>

      <Input
        label="Adın ne?"
        value={firstName}
        onChangeText={setFirstName}
        error={errors.firstName}
        placeholder="Mehmet"
        autoCapitalize="words"
      />

      <Input
        label="Doğum yılın"
        value={birthYear}
        onChangeText={(value) => setBirthYear(value.replace(/\D/g, '').slice(0, 4))}
        error={errors.birthYear}
        placeholder="1990"
        keyboardType="number-pad"
        hint="Sadece yıl. Yaşını kontrol etmek için, başka bir şey için değil."
      />

      <View style={styles.block}>
        <Text style={[typography.caption, styles.label]}>Ne iş yapıyorsun?</Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Meslek seç"
          onPress={() => setPickerOpen(true)}
          style={({ pressed }) => [styles.picker, pressed && styles.pressed]}
        >
          <Text style={[typography.body, profession ? styles.pickerValue : styles.pickerPlaceholder]}>
            {profession ? profession.label : 'Listeden seç'}
          </Text>
          <Ionicons name="chevron-down" size={18} color={colors.textMuted} />
        </Pressable>
        {errors.professionId ? (
          <Text style={[typography.caption, styles.error]}>{errors.professionId}</Text>
        ) : null}
      </View>

      {/* Basit insan doğrulaması — üçüncü tarafa veri gitmez. */}
      <Card style={styles.humanCard}>
        <Text style={[typography.subheading, styles.humanTitle]}>🤖 Robot değilsin, değil mi?</Text>
        <Input
          label={humanCheck.question}
          value={humanAnswer}
          onChangeText={(value) => setHumanAnswer(value.replace(/\D/g, '').slice(0, 3))}
          keyboardType="number-pad"
          placeholder="?"
          error={errors.human}
        />
      </Card>

      <Button label="Başlayalım" onPress={() => void submit()} loading={submitting} size="lg" fullWidth />

      <Card style={styles.noteCard}>
        <Text style={[typography.caption, styles.muted]}>
          🔒 E-posta sormuyoruz, şifre yok, doğrulama yok. Bu üç bilgi de telefonunda kalıyor.
        </Text>
      </Card>

      <ProfessionPicker
        visible={pickerOpen}
        selected={professionId}
        onSelect={(id) => {
          setProfessionId(id);
          setPickerOpen(false);
          setErrors((e) => ({ ...e, professionId: '' }));
        }}
        onClose={() => setPickerOpen(false)}
      />
    </Screen>
  );
}

/* ------------------------------------------------------------------ */
/* Aramalı meslek seçici                                               */
/* ------------------------------------------------------------------ */

interface PickerProps {
  visible: boolean;
  selected: string;
  onSelect: (id: string) => void;
  onClose: () => void;
}

function normalize(input: string): string {
  return input
    .toLocaleLowerCase('tr-TR')
    .replace(/ı/g, 'i')
    .replace(/ğ/g, 'g')
    .replace(/ü/g, 'u')
    .replace(/ş/g, 's')
    .replace(/ö/g, 'o')
    .replace(/ç/g, 'c');
}

export function ProfessionPicker({ visible, selected, onSelect, onClose }: PickerProps) {
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    const q = normalize(query).trim();
    if (!q) return PROFESSIONS;
    return PROFESSIONS.filter((p) => normalize(`${p.label} ${p.group}`).includes(q));
  }, [query]);

  const grouped = useMemo(() => {
    const map = new Map<string, typeof PROFESSIONS>();
    for (const item of filtered) {
      const list = map.get(item.group) ?? [];
      list.push(item);
      map.set(item.group, list);
    }
    return Array.from(map.entries());
  }, [filtered]);

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={styles.modalSafe} edges={['top', 'left', 'right']}>
        <View style={styles.modalHeader}>
          <Text style={[typography.heading, styles.modalTitle]}>Ne iş yapıyorsun?</Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Kapat"
            onPress={onClose}
            style={styles.closeButton}
          >
            <Ionicons name="close" size={22} color={colors.text} />
          </Pressable>
        </View>

        <View style={styles.searchWrap}>
          <Input
            placeholder="🔍 Meslek ara (doktor, kaynakçı, öğrenci…)"
            value={query}
            onChangeText={setQuery}
            autoFocus
            autoCorrect={false}
          />
        </View>

        <ScrollView contentContainerStyle={styles.modalList} keyboardShouldPersistTaps="handled">
          {filtered.length === 0 ? (
            <Text style={[typography.body, styles.muted]}>
              Bulamadık. “Serbest Meslek” ya da “Diğer” altındakilere bakabilirsin.
            </Text>
          ) : (
            grouped.map(([group, items]) => (
              <View key={group} style={styles.group}>
                <Text style={[typography.label, styles.groupTitle]}>
                  {group.toLocaleUpperCase('tr-TR')}
                </Text>
                {items.map((item) => (
                  <Pressable
                    key={item.id}
                    accessibilityRole="button"
                    accessibilityLabel={item.label}
                    onPress={() => onSelect(item.id)}
                    style={({ pressed }) => [styles.optionRow, pressed && styles.pressed]}
                  >
                    <Text style={[typography.body, styles.optionLabel]}>{item.label}</Text>
                    {selected === item.id ? (
                      <Ionicons name="checkmark-circle" size={20} color={colors.green} />
                    ) : null}
                  </Pressable>
                ))}
              </View>
            ))
          )}
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  brand: { alignItems: 'center', gap: spacing.xs, marginBottom: spacing.sm },
  coin: { fontSize: 44, lineHeight: 54 },
  wordmark: { color: colors.text },
  tagline: { color: colors.green },

  block: { gap: spacing.xs },
  label: { color: colors.textMuted },
  picker: {
    minHeight: TOUCH_TARGET,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  pickerValue: { color: colors.text },
  pickerPlaceholder: { color: colors.textFaint },
  pressed: { opacity: 0.7 },
  error: { color: colors.red },
  muted: { color: colors.textMuted },
  humanCard: { gap: spacing.sm },
  humanTitle: { color: colors.text },
  noteCard: { backgroundColor: colors.card },

  modalSafe: { flex: 1, backgroundColor: colors.background },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  modalTitle: { flex: 1, color: colors.text },
  closeButton: {
    width: TOUCH_TARGET,
    height: TOUCH_TARGET,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchWrap: { paddingHorizontal: spacing.md, paddingBottom: spacing.sm },
  modalList: { paddingHorizontal: spacing.md, paddingBottom: spacing.xxxl, gap: spacing.lg },
  group: { gap: spacing.xs },
  groupTitle: { color: colors.gold, paddingVertical: spacing.xs },
  optionRow: {
    minHeight: TOUCH_TARGET,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    backgroundColor: colors.card,
  },
  optionLabel: { flex: 1, color: colors.text },
});
