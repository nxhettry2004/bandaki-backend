import React from 'react';
import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  StyleSheet,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { useTheme } from '../../hooks/useTheme';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  disabled?: boolean;
  icon?: React.ReactNode;
  style?: ViewStyle;
  textStyle?: TextStyle;
  fullWidth?: boolean;
}

export function Button({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  icon,
  style,
  textStyle,
  fullWidth = false,
}: ButtonProps) {
  const { colors, isDark } = useTheme();

  const getButtonStyle = (): ViewStyle => {
    const base: ViewStyle = {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 12,
      ...(fullWidth && { width: '100%' }),
    };

    // Size
    switch (size) {
      case 'sm':
        Object.assign(base, { paddingHorizontal: 12, paddingVertical: 8 });
        break;
      case 'lg':
        Object.assign(base, { paddingHorizontal: 24, paddingVertical: 16 });
        break;
      default:
        Object.assign(base, { paddingHorizontal: 20, paddingVertical: 12 });
    }

    // Variant
    switch (variant) {
      case 'primary':
        Object.assign(base, { backgroundColor: colors.primary });
        break;
      case 'secondary':
        Object.assign(base, { backgroundColor: colors.surfaceSecondary });
        break;
      case 'outline':
        Object.assign(base, {
          backgroundColor: 'transparent',
          borderWidth: 1,
          borderColor: colors.border,
        });
        break;
      case 'danger':
        Object.assign(base, {
          backgroundColor: 'transparent',
          borderWidth: 1,
          borderColor: colors.errorBorder,
        });
        break;
      case 'ghost':
        Object.assign(base, { backgroundColor: 'transparent' });
        break;
    }

    if (disabled || loading) {
      base.opacity = 0.6;
    }

    return base;
  };

  const getTextStyle = (): TextStyle => {
    const base: TextStyle = {
      fontWeight: '600',
    };

    switch (size) {
      case 'sm':
        base.fontSize = 13;
        break;
      case 'lg':
        base.fontSize = 16;
        break;
      default:
        base.fontSize = 14;
    }

    switch (variant) {
      case 'primary':
        base.color = '#FFFFFF';
        break;
      case 'secondary':
        base.color = colors.text;
        break;
      case 'outline':
        base.color = colors.text;
        break;
      case 'danger':
        base.color = colors.error;
        break;
      case 'ghost':
        base.color = colors.textSecondary;
        break;
    }

    return base;
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      style={[getButtonStyle(), style]}
      activeOpacity={0.7}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={variant === 'primary' ? '#FFFFFF' : colors.primary}
          style={{ marginRight: title ? 8 : 0 }}
        />
      ) : icon ? (
        <>{icon}</>
      ) : null}
      {title ? <Text style={[getTextStyle(), textStyle]}>{title}</Text> : null}
    </TouchableOpacity>
  );
}
