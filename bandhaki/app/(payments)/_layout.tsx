import { Stack } from 'expo-router';
import { ScreenErrorBoundary } from '../../src/components/ScreenErrorBoundary';

// expo-router renders this instead of crashing when a screen in this group throws.
export { ScreenErrorBoundary as ErrorBoundary };

export default function PaymentsLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="new" />
    </Stack>
  );
}
