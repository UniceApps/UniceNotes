import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, AppState, BackHandler, Linking, Platform, View } from 'react-native';

import { Stack, useLocalSearchParams, useNavigation, useRouter } from 'expo-router';
import { IconButton, ProgressBar, Text } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { WebView, type WebViewNavigation } from 'react-native-webview';
import type { ShouldStartLoadRequest } from 'react-native-webview/lib/WebViewTypes';

import { BrowserError } from '@/src/components/browser/BrowserError';
import { EntAppIcon } from '@/src/components/ent/EntAppIcon';
import { HeaderButton } from '@/src/components/ui/ScreenHeader';
import { getEntApp, type EntApp } from '@/src/constants/ent';
import { useTabBarInset } from '@/src/hooks/useTabBarInset';
import { persistWebSession, restoreWebSession } from '@/src/services/webSession';
import { useAppTheme } from '@/src/theme';
import { isWebViewUrl } from '@/src/utils/browser';
import { haptics } from '@/src/utils/haptics';

// navigateur de l'onglet ENT : les services y restent connectés d'un lancement à l'autre
export default function BrowserScreen() {
  const router = useRouter();
  const { app: appId, from } = useLocalSearchParams<{ app?: string; from?: string }>();
  const app = getEntApp(appId);
  const fromHome = from === 'home';

  // lien vers un service inconnu
  useEffect(() => {
    if (app) return;
    if (router.canGoBack()) router.back();
    else router.replace('/ent');
  }, [app, router]);

  const close = useCallback(() => {
    haptics('light');
    if (router.canGoBack()) router.back();
    else router.replace('/ent');
    // ouvert depuis l'accueil : on y retourne, la liste reste dans l'onglet ENT
    if (fromHome) router.navigate('/home');
  }, [router, fromHome]);

  if (!app) return null;
  // un autre service repart d'une page et d'un historique vierges
  return <Browser key={app.id} app={app} fromHome={fromHome} onClose={close} />;
}

function Browser({ app, fromHome, onClose }: { app: EntApp; fromHome: boolean; onClose: () => void }) {
  const navigation = useNavigation();
  const theme = useAppTheme();
  const insets = useSafeAreaInsets();
  const tabBarInset = useTabBarInset();
  const c = theme.colors;
  const webRef = useRef<WebView>(null);

  // cookies de session réinjectés avant la première requête
  const [ready, setReady] = useState(false);
  const [nav, setNav] = useState<WebViewNavigation>();
  const [loadCount, setLoadCount] = useState(0);
  // le processus de rendu Android a planté : nouvelle WebView
  const [webKey, setWebKey] = useState(0);

  const loading = nav?.loading ?? true;
  const canGoBack = nav?.canGoBack ?? false;

  useEffect(() => {
    let mounted = true;
    restoreWebSession().then(() => {
      if (mounted) setReady(true);
    });
    return () => {
      mounted = false;
    };
  }, []);

  // sauvegarde un peu après chaque page : une connexion CAS enchaîne plusieurs redirections
  useEffect(() => {
    if (loadCount === 0) return;
    const timer = setTimeout(persistWebSession, 1000);
    return () => clearTimeout(timer);
  }, [loadCount]);

  // iOS peut tuer l'app dès qu'elle passe en arrière-plan
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (state) => {
      if (state !== 'active') persistWebSession();
    });
    return () => {
      subscription.remove();
      persistWebSession();
    };
  }, []);

  // le bouton retour d'Android remonte l'historique de la page avant de fermer
  useEffect(() => {
    if (Platform.OS !== 'android' || (!canGoBack && !fromHome)) return;
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      // resté ouvert derrière un autre onglet
      if (!navigation.isFocused()) return false;
      if (canGoBack) webRef.current?.goBack();
      else onClose();
      return true;
    });
    return () => subscription.remove();
  }, [canGoBack, fromHome, navigation, onClose]);

  // mailto:, tel:, Teams… confiés au système, jamais depuis une iframe
  function shouldStartLoad({ url, isTopFrame }: ShouldStartLoadRequest): boolean {
    if (isWebViewUrl(url)) return true;
    if (isTopFrame !== false) Linking.openURL(url).catch(() => {});
    return false;
  }

  function tap(action: () => void) {
    haptics('light');
    action();
  }

  // Android renvoie l'URL comme titre pendant le chargement
  const title = nav?.title && !isWebViewUrl(nav.title) ? nav.title : app.label;

  return (
    <View style={{ flex: 1, paddingBottom: tabBarInset, backgroundColor: c.background }}>
      {/* sans historique, le glissement depuis le bord revient à la liste ; ouvert depuis l'accueil, seule la croix ferme */}
      <Stack.Screen options={{ gestureEnabled: !canGoBack && !fromHome }} />
      <View style={{ paddingTop: insets.top, backgroundColor: c.elevation.level2 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingLeft: 12, paddingVertical: 8 }}>
          <HeaderButton icon="close" label="Fermer" onPress={onClose} />
          <EntAppIcon app={app} size={32} />
          <View style={{ flex: 1 }}>
            <Text variant="titleMedium" numberOfLines={1}>
              {title}
            </Text>
            <Text variant="bodySmall" numberOfLines={1} style={{ color: c.onSurfaceVariant }}>
              {nav?.url ?? app.url}
            </Text>
          </View>
          <View style={{ flexDirection: 'row' }}>
            <IconButton
              icon="chevron-left"
              size={22}
              style={{ margin: 0 }}
              disabled={!canGoBack}
              accessibilityLabel="Page précédente"
              onPress={() => tap(() => webRef.current?.goBack())}
            />
            <IconButton
              icon="chevron-right"
              size={22}
              style={{ margin: 0 }}
              disabled={!nav?.canGoForward}
              accessibilityLabel="Page suivante"
              onPress={() => tap(() => webRef.current?.goForward())}
            />
            <IconButton
              icon="refresh"
              size={22}
              style={{ margin: 0, marginRight: 4 }}
              accessibilityLabel="Actualiser"
              onPress={() => tap(() => webRef.current?.reload())}
            />
          </View>
        </View>
        <ProgressBar indeterminate visible={loading} color={c.primary} style={{ backgroundColor: 'transparent' }} />
      </View>

      {ready ? (
        <WebView
          key={webKey}
          ref={webRef}
          source={{ uri: app.url }}
          originWhitelist={['*']}
          onShouldStartLoadWithRequest={shouldStartLoad}
          onNavigationStateChange={setNav}
          onLoadEnd={() => {
            // une erreur ne met pas à jour nav
            setNav((current) => current && { ...current, loading: false });
            setLoadCount((count) => count + 1);
          }}
          onContentProcessDidTerminate={() => webRef.current?.reload()}
          onRenderProcessGone={() => setWebKey((key) => key + 1)}
          renderError={(_domain, code, description) => (
            <BrowserError code={code} description={description} onRetry={() => webRef.current?.reload()} />
          )}
          // pas de voile pendant un rechargement
          renderLoading={() => <View />}
          allowsBackForwardNavigationGestures
          pullToRefreshEnabled
          refreshControlLightMode={theme.dark}
          // inertie de Safari ; la chaîne fait planter Android
          decelerationRate={Platform.OS === 'ios' ? 'normal' : undefined}
          // liens target="_blank" ouverts dans la même page (Android)
          setSupportMultipleWindows={false}
          webviewDebuggingEnabled={__DEV__}
          style={{ flex: 1, backgroundColor: c.background }}
          containerStyle={{ backgroundColor: c.background }}
        />
      ) : (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator color={c.primary} />
        </View>
      )}
    </View>
  );
}
