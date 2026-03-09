import { Stack } from 'expo-router';

export default function BandhakiLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="new" />
      <Stack.Screen name="all" />
      <Stack.Screen name="[id]" />
      <Stack.Screen name="update/[id]" />
      <Stack.Screen name="customer-loans" />
    </Stack>
  );
}
