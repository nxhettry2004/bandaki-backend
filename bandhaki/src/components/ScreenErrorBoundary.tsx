import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { AlertTriangle } from 'lucide-react-native';
import { useTheme } from '../hooks/useTheme';
import { Button } from './ui/Button';

// Matches expo-router's ErrorBoundaryProps. Re-export this as `ErrorBoundary`
// from a layout file and expo-router renders it instead of crashing the app
// when a screen throws — including throws during module evaluation.
export interface ScreenErrorBoundaryProps {
  error: Error;
  retry: () => Promise<void>;
}

export function ScreenErrorBoundary({ error, retry }: ScreenErrorBoundaryProps) {
  const { colors } = useTheme();
  const router = useRouter();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={[styles.icon, { backgroundColor: colors.errorLight || '#FEE2E2' }]}>
          <AlertTriangle size={32} color={colors.error} />
        </View>
        <Text style={[styles.title, { color: colors.text }]}>Something went wrong</Text>
        <Text style={[styles.desc, { color: colors.textSecondary }]}>
          This screen could not be displayed. You can retry or go back.
        </Text>
        <Text style={[styles.detail, { color: colors.textTertiary }]} numberOfLines={6}>
          {error?.message || String(error)}
        </Text>
        <Button title="Try Again" onPress={() => retry()} fullWidth style={styles.action} />
        <Button
          title="Go Back"
          variant="outline"
          fullWidth
          style={styles.action}
          onPress={() => (router.canGoBack() ? router.back() : router.replace('/(tabs)/dashboard'))}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { flexGrow: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  icon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  title: { fontSize: 18, fontWeight: '600', marginBottom: 8 },
  desc: { fontSize: 14, textAlign: 'center', marginBottom: 12 },
  detail: { fontSize: 12, textAlign: 'center', marginBottom: 24 },
  action: { marginTop: 8, borderRadius: 6 },
});
