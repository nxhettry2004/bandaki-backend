import React, { useEffect, useState } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import Toast from 'react-native-toast-message';
import { useColorScheme } from 'react-native';
import { getToken } from '../src/api/axiosClient';
import 'react-native-reanimated';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      gcTime: 10 * 60 * 1000,
      refetchOnWindowFocus: false,
      refetchOnMount: false,
      refetchOnReconnect: false,
      retry: 1,
      retryDelay: 500,
    },
    mutations: {
      retry: 0,
    },
  },
});

function AuthGate({ children }: { children: React.ReactNode }) {
  const segments = useSegments();
  const router = useRouter();
  const [isReady, setIsReady] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    checkAuth();
  }, []);

  async function checkAuth() {
    const token = await getToken();
    setIsAuthenticated(!!token);
    setIsReady(true);
  }

  useEffect(() => {
    if (!isReady) return;

    const inAuthGroup = segments[0] === '(auth)';

    if (!isAuthenticated && !inAuthGroup) {
      router.replace('/(auth)/login');
    } else if (isAuthenticated && inAuthGroup) {
      router.replace('/(tabs)/dashboard');
    }
  }, [isReady, isAuthenticated, segments]);

  return <>{children}</>;
}

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <QueryClientProvider client={queryClient}>
        <AuthGate>
          <Stack
            screenOptions={{
              headerShown: false,
              animation: 'slide_from_right',
            }}
          >
            <Stack.Screen name="(auth)" options={{ headerShown: false }} />
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="(bandhaki)" options={{ headerShown: false }} />
            <Stack.Screen name="(customers)" options={{ headerShown: false }} />
            <Stack.Screen name="(payments)" options={{ headerShown: false }} />
          </Stack>
        </AuthGate>
        <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
        <Toast />
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
}
