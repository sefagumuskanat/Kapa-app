import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Chip } from './Chip';
import { Input } from './Input';
import { FieldDef } from '@/catalog';
import { colors, spacing, typography } from '@/theme';

interface DynamicFormProps {
  fields: FieldDef[];
  values: Record<string, string>;
  errors?: Record<string, string>;
  onChange: (key: string, value: string) => void;
}

/**
 * Türe özel soruları basan form.
 *
 * Her varlık türü kendi alanlarını tanımlar (gram/ayar, m²/oda, karat…),
 * bu bileşen de onları ekrana döker. Böylece yeni bir ürün tipi eklemek
 * için yeni ekran yazmak gerekmiyor.
 */
export function DynamicForm({ fields, values, errors = {}, onChange }: DynamicFormProps) {
  return (
    <View style={styles.wrapper}>
      {fields.map((field) => {
        const value = values[field.key] ?? '';
        const error = errors[field.key];

        if (field.type === 'select') {
          return (
            <View key={field.key} style={styles.block}>
              <Text style={[typography.caption, styles.label]}>
                {field.label}
                {field.required ? ' *' : ''}
              </Text>
              <View style={styles.chipRow}>
                {(field.options ?? []).map((option) => (
                  <Chip
                    key={option.value}
                    label={option.label}
                    selected={value === option.value}
                    onPress={() => onChange(field.key, option.value)}
                    tone="green"
                  />
                ))}
              </View>
              {error ? <Text style={[typography.caption, styles.error]}>{error}</Text> : null}
              {field.hint ? (
                <Text style={[typography.caption, styles.hint]}>{field.hint}</Text>
              ) : null}
            </View>
          );
        }

        return (
          <Input
            key={field.key}
            label={`${field.label}${field.required ? ' *' : ''}`}
            value={value}
            onChangeText={(next) => onChange(field.key, next)}
            keyboardType={field.type === 'number' ? 'decimal-pad' : 'default'}
            placeholder={field.placeholder}
            suffix={field.suffix}
            hint={field.hint}
            error={error}
          />
        );
      })}
    </View>
  );
}

/** Zorunlu alanlar dolduruldu mu? Dolmayanlar için hata haritası döner. */
export function validateFields(
  fields: FieldDef[],
  values: Record<string, string>,
): Record<string, string> {
  const errors: Record<string, string> = {};
  for (const field of fields) {
    const value = (values[field.key] ?? '').trim();
    if (field.required && !value) {
      errors[field.key] = 'Bunu doldurman lazım.';
      continue;
    }
    if (field.type === 'number' && value) {
      const parsed = Number(value.replace(',', '.'));
      if (!Number.isFinite(parsed) || parsed <= 0) {
        errors[field.key] = 'Sıfırdan büyük bir sayı yaz.';
      }
    }
  }
  return errors;
}

/** Alan tanımlarından başlangıç değerlerini üretir. */
export function initialValues(
  fields: FieldDef[],
  existing?: Record<string, string>,
): Record<string, string> {
  const values: Record<string, string> = {};
  for (const field of fields) {
    values[field.key] =
      existing?.[field.key] ?? field.defaultValue ?? (field.type === 'select' ? '' : '');
  }
  return values;
}

const styles = StyleSheet.create({
  wrapper: { gap: spacing.md },
  block: { gap: spacing.xs },
  label: { color: colors.textMuted },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  hint: { color: colors.textFaint },
  error: { color: colors.red },
});
