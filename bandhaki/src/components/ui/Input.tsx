import React from 'react';
import { View, Text, TextInput as RNTextInput, TextInputProps, StyleSheet, ViewStyle } from 'react-native';
import { useTheme } from '../../hooks/useTheme';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  containerStyle?: ViewStyle;
  required?: boolean;
}

export function Input({ label, error, containerStyle, required, style, ...props }: InputProps) {
  const { colors } = useTheme();

  return (
    <View style={[{ marginBottom: 16 }, containerStyle]}>
      {label && (
        <Text style={[styles.label, { color: colors.text }]}>
          {label}
          {required && <Text style={{ color: colors.error }}> *</Text>}
        </Text>
      )}
      <RNTextInput
        style={[
          styles.input,
          {
            backgroundColor: colors.surface,
            borderColor: error ? colors.error : colors.border,
            color: colors.text,
          },
          style,
        ]}
        placeholderTextColor={colors.textTertiary}
        {...props}
      />
      {error && (
        <Text style={[styles.error, { color: colors.error }]}>{error}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  label: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
  },
  error: {
    fontSize: 12,
    marginTop: 4,
  },
});
