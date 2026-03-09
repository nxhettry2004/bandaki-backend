import React from 'react';
import { View, Text, StyleSheet,StyleProp, ViewStyle } from 'react-native';
import { useTheme } from '../../hooks/useTheme';

interface CardProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  variant?: 'default' | 'success' | 'warning' | 'info' | 'error' | 'purple';
}

export function Card({ children, style, variant = 'default' }: CardProps) {
  const { colors } = useTheme();

  const getVariantStyle = (): ViewStyle => {
    switch (variant) {
      case 'success':
        return { backgroundColor: colors.successLight, borderColor: colors.successBorder };
      case 'warning':
        return { backgroundColor: colors.warningLight, borderColor: colors.warning };
      case 'info':
        return { backgroundColor: colors.infoLight, borderColor: colors.infoBorder };
      case 'error':
        return { backgroundColor: colors.errorLight, borderColor: colors.errorBorder };
      case 'purple':
        return { backgroundColor: colors.purpleLight, borderColor: colors.purpleBorder };
      default:
        return { backgroundColor: colors.surface, borderColor: colors.borderLight };
    }
  };

  return (
    <View
      style={[
        styles.card,
        getVariantStyle(),
        style,
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
  },
});
