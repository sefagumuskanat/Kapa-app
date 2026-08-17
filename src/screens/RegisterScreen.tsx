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
import { colors, fonts, radius, spacing, TOUCH_TARGET, typography } from '@/theme';

type Props = NativeStackScreenProps<RootStackParamList, 'Register'>;

export function RegisterScreen({ navigation }: Props) {
  const { registerAccount } = useApp();

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [email, setEmail] = useState('');
  const [professionId, setProfessionId] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [pickerOpen, setPickerOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const profession = findProfession(professionId);

  const submit = async () => {
    const input = { firstName, lastName, birthDate, email, professionId };
    const found = authService.validate(input);
    setErrors(found);
    if (Object.keys(found).length > 0) return;

    setSubmitting(true);
    try {
      const code = await registerAccount(input);
      navigation.replace('VerifyEmail', { demoCode: code });
    } catch (error) {
      setErrors({ email: error instanceof Error ? error.message : 'Kayıt olmadı.' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Screen title="Hoş geldin" subtitle="Önce seni tanıyalım">
      <View style={styles.brand}>
        <Text style={styles.coin}>🪙</Text>
        <Text style={[typography.title, styles.wordmark]}>{BRAND.name}</Text>
        <Text style={[typography.body, styles.tagline]}>{BRAND.tagline}</Text>
      </View>

      <Input
        label="Adın"
        value={firstName}
        onChangeText={setFirstName}
        error={errors.firstName}
        placeholder="Mehmet"
        autoCapitalize="words"
      />
      <Input
        label="Soyadın"
        value={lastName}
        onChangeText={setLastName}
        error={errors.lastName}
        placeholder="Yılmaz"
        autoCapitalize="words"
      />
      <Input
        label="Doğum tarihin"
        value={birthDate}
        onChangeText={setBirthDate}
        error={errors.birthDate}
        placeholder="1990-05-17"
        hint="YYYY-AA-GG şeklinde yaz."
        autoCapitalize="none"
      />
      <Input
        label="E-posta"
        value={email}
        onChangeText={setEmail}
        error={errors.email}
        placeholder="mehmet@ornek.com"
        keyboardType="email-address"
        autoCapitalize="none"
        autoCorrect={false}
      />

      {/* Meslek — liste uzun olduğu için aramalı seçici */}
      <View style={styles.block}>
        <Text style={[typography.caption, styles.label]}>Ne iş yapıyorsun?</Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Meslek seç"
          onPress={() => setPickerOpen(true)}
          style={({ pressed }) => [styles.picker, pressed && styles.pressed]}
        >
          <Text style={[typography.body, profession ? styles.pickerValue : styles.pickerPlaceholder]}>
            {profession ? `${profession.label}` : 'Listeden seç'}
          </Text>
          <Ionicons name="chevron-down" size={18} color={colors.textMuted} />
        </Pressable>
        {errors.professionId ? (
          <Text style={[typography.caption, styles.error]}>{errors.professionId}</Text>
        ) : null}
      </View>

      <Button
        label="Devam"
        onPress={() => void submit()}
        loading={submitting}
        size="lg"
        fullWidth
      />

      <Card style={styles.noteCard}>
        <Text style={[typography.caption, styles.muted]}>
          🔒 Bu bilgiler hesabın için. Neyin var, ne kadar ediyor — onlar telefonunda kalıyor,
          kimseyle paylaşmıyoruz.
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

export function ProfessionPicker({ visible, selected, onSelect, onClose }: PickerProps) {
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    const q = query
      .toLocaleLowerCase('tr-TR')
      .replace(/ı/g, 'i')
      .replace(/ğ/g, 'g')
      .replace(/ü/g, 'u')
      .replace(/ş/g, 's')
      .replace(/ö/g, 'o')
      .replace(/ç/g, 'c')
      .trim();
    if (!q) return PROFESSIONS;
    return PROFESSIONS.filter((p) => {
      const hay = `${p.label} ${p.group}`
        .toLocaleLowerCase('tr-TR')
        .replace(/ı/g, 'i')
        .replace(/ğ/g, 'g')
        .replace(/ü/g, 'u')
        .replace(/ş/g, 's')
        .replace(/ö/g, 'o')
        .replace(/ç/g, 'c');
      return hay.includes(q);
    });
  }, [query]);

  // Gruplara böl — arama varken düz liste daha okunur.
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
    <Modal visible={visible} animationType="slide" onRequestClose={onClose} transparent={false}>
      <SafeAreaView style={styles.modalSafe} edges={['top', 'left', 'right']}>
        <View style={styles.modalHeader}>
          <Text style={[typography.heading, styles.modalTitle]}>Ne iş yapıyorsun?</Text>
          <Pressable accessibilityRole="button" accessibilityLabel="Kapat" onPress={onClose} style={styles.closeButton}>
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
  noteCard: { backgroundColor: colors.card },

  modalSafe: { flex: 1, backgroundColor: colors.background },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  modalTitle: { flex: 1, color: colors.text },
  closeButton: { width: TOUCH_TARGET, height: TOUCH_TARGET, alignItems: 'center', justifyContent: 'center' },
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
