import { useEffect, useState } from 'react';

import * as Font from 'expo-font';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

import { Provider as PaperProvider } from 'react-native-paper';
import 'react-native-reanimated';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { loadThemePreference, updateFontConfig, useChoosenTheme } from '@/src/constants/theme';
import { AppProvider } from '@/src/context/AppContext';
import { DeepLinkHandler } from '@/src/context/DeepLinkHandler';
import { watchClassActivity } from '@/src/services/widgets';
import { Measure, MeasureConfig } from '@measuresh/react-native';

export default function RootLayout() {
  const [isReady, setIsReady] = useState(false);
  const theme = useChoosenTheme();

  useEffect(() => {
    async function prepare() {
      // a Measure failure must not block startup
      await Measure.init({ config: new MeasureConfig({}) }).catch(console.warn);
      await Promise.all([
        Font.loadAsync({
          Bahnschrift: require('../assets/bahnschrift.ttf'),
        }),
        loadThemePreference(),
      ]);
      updateFontConfig();
      setIsReady(true);
    }

    prepare();
  }, []);

  useEffect(() => watchClassActivity(), []);

  if (!isReady) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <PaperProvider theme={theme}>
          <AppProvider>
            <DeepLinkHandler />
            <Stack screenOptions={{ headerShown: false, gestureEnabled: false }}>
              <Stack.Screen name="index" />
              <Stack.Screen name="splash" />
              <Stack.Screen name="oobe" />
              <Stack.Screen name="home" />
              <Stack.Screen name="timetable" />
              <Stack.Screen
                name="ent"
                options={{ presentation: 'modal', gestureEnabled: true }}
              />
              <Stack.Screen
                name="free-rooms"
                options={{ gestureEnabled: true }}
              />
              <Stack.Screen
                name="settings"
                options={{ gestureEnabled: true }}
              />
              <Stack.Screen
                name="appearance"
                options={{ presentation: 'modal', gestureEnabled: true }}
              />
              <Stack.Screen
                name="servers"
                options={{ presentation: 'modal', gestureEnabled: true }}
              />
              <Stack.Screen
                name="edt-config"
                options={{ presentation: 'modal', gestureEnabled: true }}
              />
            </Stack>
            <StatusBar style="auto" />
          </AppProvider>
        </PaperProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
