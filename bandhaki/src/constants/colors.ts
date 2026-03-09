export const Colors = {
  light: {
    primary: '#D97706', // amber-600
    primaryDark: '#B45309', // amber-700
    primaryLight: '#FEF3C7', // amber-100
    background: '#F9FAFB', // gray-50
    surface: '#FFFFFF',
    surfaceSecondary: '#F3F4F6', // gray-100
    text: '#111827', // gray-900
    textSecondary: '#6B7280', // gray-500
    textTertiary: '#9CA3AF', // gray-400
    border: '#E5E7EB', // gray-200
    borderLight: '#F3F4F6', // gray-100
    error: '#DC2626', // red-600
    errorLight: '#FEF2F2', // red-50
    errorBorder: '#FECACA', // red-200
    success: '#16A34A', // green-600
    successLight: '#F0FDF4', // green-50
    successBorder: '#BBF7D0', // green-200
    warning: '#EA580C', // orange-600
    warningLight: '#FFF7ED', // orange-50
    info: '#2563EB', // blue-600
    infoLight: '#EFF6FF', // blue-50
    infoBorder: '#BFDBFE', // blue-200
    purple: '#9333EA',
    purpleLight: '#FAF5FF',
    purpleBorder: '#E9D5FF',
    tabIconDefault: '#9CA3AF',
    tabIconSelected: '#D97706',
  },
  dark: {
    primary: '#F59E0B', // amber-500
    primaryDark: '#D97706',
    primaryLight: '#78350F', // amber-900/30 approximation
    background: '#030712', // gray-950
    surface: '#111827', // gray-900
    surfaceSecondary: '#1F2937', // gray-800
    text: '#F9FAFB', // gray-50
    textSecondary: '#9CA3AF', // gray-400
    textTertiary: '#6B7280', // gray-500
    border: '#374151', // gray-700
    borderLight: '#1F2937', // gray-800
    error: '#EF4444', // red-500
    errorLight: '#450A0A', // red-950
    errorBorder: '#7F1D1D', // red-900
    success: '#22C55E', // green-500
    successLight: '#052E16', // green-950
    successBorder: '#14532D', // green-900
    warning: '#F97316', // orange-500
    warningLight: '#431407', // orange-950
    info: '#3B82F6', // blue-500
    infoLight: '#172554', // blue-950
    infoBorder: '#1E3A5F', // blue-900
    purple: '#A855F7',
    purpleLight: '#3B0764',
    purpleBorder: '#581C87',
    tabIconDefault: '#6B7280',
    tabIconSelected: '#F59E0B',
  },
};

export type ColorScheme = keyof typeof Colors;
