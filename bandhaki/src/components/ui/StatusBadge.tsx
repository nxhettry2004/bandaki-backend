import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ViewStyle, StyleProp } from 'react-native';
import { useTheme } from '../../hooks/useTheme';

interface StatusBadgeProps {
  status: string;
  style?: StyleProp<ViewStyle>;

  size?: 'sm' | 'md';
}

export function StatusBadge({ status, size = 'sm' }: StatusBadgeProps) {
  const { colors } = useTheme();

  const getStatusStyle = () => {
    switch (status.toLowerCase()) {
      case 'active':
        return {
          bg: colors.successLight,
          text: colors.success,
          border: colors.successBorder,
        };
      case 'closed':
      case 'paid':
        return {
          bg: colors.infoLight,
          text: colors.info,
          border: colors.infoBorder,
        };
      case 'defaulted':
        return {
          bg: colors.errorLight,
          text: colors.error,
          border: colors.errorBorder,
        };
      case 'partial':
        return {
          bg: colors.warningLight,
          text: colors.warning,
          border: colors.warning,
        };
      case 'pending':
        return {
          bg: colors.surfaceSecondary,
          text: colors.textSecondary,
          border: colors.border,
        };
      default:
        return {
          bg: colors.surfaceSecondary,
          text: colors.textSecondary,
          border: colors.border,
        };
    }
  };

  const s = getStatusStyle();

  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor: s.bg,
          borderColor: s.border,
          paddingHorizontal: size === 'sm' ? 8 : 12,
          paddingVertical: size === 'sm' ? 2 : 4,
        },
      ]}
    >
      <Text
        style={[
          styles.text,
          {
            color: s.text,
            fontSize: size === 'sm' ? 11 : 13,
          },
        ]}
      >
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    borderRadius: 20,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  text: {
    fontWeight: '600',
    textTransform: 'capitalize',
  },
});
