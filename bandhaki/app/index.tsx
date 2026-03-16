import { Redirect } from 'expo-router';

// Expo Router requires a root index route.
// AuthGate in _layout.tsx will immediately redirect to the correct screen
// based on auth state (login or dashboard), so this redirect is just a
// safe default that AuthGate overrides before it is ever rendered.
export default function Index() {
  return <Redirect href="/(auth)/login" />;
}
