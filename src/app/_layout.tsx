import { useEffect, useMemo, useState } from 'react';

import { Measure, MeasureConfig } from '@measuresh/react-native';
import * as Font from 'expo-font';
import { Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import * as SystemUI from 'expo-system-ui';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Provider as PaperProvider } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { DeepLinkHandler } from '@/src/components/DeepLinkHandler';
import { CalendarProvider } from '@/src/context/CalendarContext';
import { loadSettings, SettingsProvider, type Settings } from '@/src/context/SettingsContext';
import { getNavigationTheme, loadThemePreference, useAppTheme } from '@/src/theme';

// l'écran de lancement natif reste affiché pendant le chargement
SplashScreen.preventAutoHideAsync();
SplashScreen.setOptions({ fade: true });

async function prepare(): Promise<Settings> {
  const [settings] = await Promise.all([
    loadSettings(),
    loadThemePreference(),
    Font.loadAsync({ Bahnschrift: require('../assets/bahnschrift.ttf') }),
    // une erreur de Measure ne doit pas bloquer le démarrage
    Measure.init({ config: new MeasureConfig({}) }).catch(console.warn),
  ]);
  return settings;
}

export default function RootLayout() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const theme = useAppTheme();
  const navigationTheme = useMemo(() => getNavigationTheme(theme), [theme]);

  useEffect(() => {
    prepare().then(setSettings);
  }, []);

  useEffect(() => {
    if (settings) SplashScreen.hide();
  }, [settings]);

  // fond de la fenêtre native, derrière le Stack
  useEffect(() => {
    SystemUI.setBackgroundColorAsync(theme.colors.background).catch(console.warn);
  }, [theme.colors.background]);

  if (!settings) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <PaperProvider theme={theme}>
          <ThemeProvider value={navigationTheme}>
            <SettingsProvider initial={settings}>
              <CalendarProvider>
                <DeepLinkHandler />
                <Stack screenOptions={{ headerShown: false }}>
                  <Stack.Screen name="index" />
                  <Stack.Screen name="oobe" options={{ gestureEnabled: false }} />
                  <Stack.Screen name="home" options={{ gestureEnabled: false }} />
                  {/* le calendrier se fait défiler à l'horizontale : pas de retour par glissement */}
                  <Stack.Screen name="timetable" options={{ gestureEnabled: false }} />
                  <Stack.Screen name="free-rooms" />
                  <Stack.Screen name="settings" />
                  <Stack.Screen name="ent" options={{ presentation: 'modal' }} />
                  <Stack.Screen name="appearance" options={{ presentation: 'modal' }} />
                  <Stack.Screen name="servers" options={{ presentation: 'modal' }} />
                  <Stack.Screen name="edt-config" options={{ presentation: 'modal' }} />
                </Stack>
                <StatusBar style="auto" />
              </CalendarProvider>
            </SettingsProvider>
          </ThemeProvider>
        </PaperProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
