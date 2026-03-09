import React from 'react';
import { View, ActivityIndicator, StyleSheet, Text } from 'react-native';
import { useTheme } from '../../hooks/useTheme';

interface LoadingScreenProps {
  message?: string;
}

export function LoadingScreen({ message }: LoadingScreenProps) {
  const { colors } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.indicator, { backgroundColor: colors.primaryLight }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
      {message && (
        <Text style={[styles.message, { color: colors.textSecondary }]}>
          {message}
        </Text>
      )}
    </View>
  );
}

export function LoadingSkeleton() {
  const { colors } = useTheme();

  return (
    <View style={styles.skeletonContainer}>
      {[1, 2, 3].map((i) => (
        <View
          key={i}
          style={[
            styles.skeletonCard,
            { backgroundColor: colors.surfaceSecondary },
          ]}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  indicator: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  message: {
    marginTop: 16,
    fontSize: 14,
  },
  skeletonContainer: {
    paddingHorizontal: 16,
    gap: 12,
  },
  skeletonCard: {
    height: 80,
    borderRadius: 16,
  },
});
