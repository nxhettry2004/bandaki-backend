import { useColorScheme as useRNColorScheme } from 'react-native';
import { Colors } from '../constants/colors';

export function useTheme() {
  const colorScheme = useRNColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const isDark = colorScheme === 'dark';

  return { colors, isDark, colorScheme };
}
