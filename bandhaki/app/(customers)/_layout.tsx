import { Stack } from 'expo-router';

export default function CustomersLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="new" />
      <Stack.Screen name="[id]" />
      <Stack.Screen name="update/[id]" />
    </Stack>
  );
}
