import { Stack } from 'expo-router';

// la liste reste sous le navigateur, même ouvert depuis un autre onglet
export const unstable_settings = { initialRouteName: 'index' };

export default function EntLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      {/* un seul navigateur dans la pile */}
      <Stack.Screen name="browser" dangerouslySingular={() => 'browser'} />
    </Stack>
  );
}
