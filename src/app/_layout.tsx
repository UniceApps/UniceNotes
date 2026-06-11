import React, { useState, useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Provider as PaperProvider } from 'react-native-paper';
import { Stack } from 'expo-router';
import * as Font from 'expo-font';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AppProvider } from '@/src/context/AppContext';
import { useChoosenTheme, updateFontConfig } from '@/src/constants/theme';
import 'react-native-reanimated';

export default function RootLayout() {
  const [isReady, setIsReady] = useState(false);
  const theme = useChoosenTheme();

  useEffect(() => {
    async function loadFonts() {
      await Font.loadAsync({
        Bahnschrift: require('../assets/bahnschrift.ttf'),
      });
      updateFontConfig();
      setIsReady(true);
    }

    loadFonts();
  }, []);

  if (!isReady) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <PaperProvider theme={theme}>
          <AppProvider>
            <Stack screenOptions={{ headerShown: false, gestureEnabled: false }}>
              <Stack.Screen name="index" />
              <Stack.Screen name="splash" />
              <Stack.Screen name="oobe" options={{ presentation: 'modal' }} />
              <Stack.Screen name="home" />
              <Stack.Screen name="show-edt" />
              <Stack.Screen
                name="show-ent"
                options={{ presentation: 'modal', gestureEnabled: true }}
              />
              <Stack.Screen name="settings" />
              <Stack.Screen
                name="icon-config"
                options={{ presentation: 'modal', gestureEnabled: true }}
              />
              <Stack.Screen
                name="server-config"
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
