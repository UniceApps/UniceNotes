import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, AppState, BackHandler, Linking, Platform, Share, View } from 'react-native';

import { useLocalSearchParams, useRouter } from 'expo-router';
import { Portal, Snackbar } from 'react-native-paper';
import { WebView, type WebViewNavigation } from 'react-native-webview';
import type {
  FileDownloadEvent,
  ShouldStartLoadRequest,
  WebViewProgressEvent,
} from 'react-native-webview/lib/WebViewTypes';

import { BrowserError } from '@/src/components/browser/BrowserError';
import { BrowserHeader } from '@/src/components/browser/BrowserHeader';
import { BROWSER_TOOLBAR_HEIGHT, BrowserToolbar } from '@/src/components/browser/BrowserToolbar';
import { getEntApp, type EntApp } from '@/src/constants/ent';
import { MAX_PINNED_APPS, togglePinnedApp, usePinnedApps } from '@/src/hooks/usePinnedApps';
import { downloadAndShare } from '@/src/services/downloads';
import { persistWebSession, restoreWebSession } from '@/src/services/webSession';
import { useAppTheme } from '@/src/theme';
import { getIntentFallback, isWebViewUrl } from '@/src/utils/browser';
import { haptics } from '@/src/utils/haptics';

interface PageState {
  url: string;
  title: string;
  canGoBack: boolean;
  canGoForward: boolean;
  loading: boolean;
}

// navigateur de l'app : les services de l'ENT gardent leur connexion d'un lancement à l'autre,
// contrairement aux onglets Safari / Chrome ouverts par le système
export default function BrowserScreen() {
  const router = useRouter();
  const { app: appId } = useLocalSearchParams<{ app?: string }>();
  const app = getEntApp(appId);

  // lien vers un service inconnu
  useEffect(() => {
    if (app) return;
    if (router.canGoBack()) router.back();
    else router.replace('/home');
  }, [app, router]);

  function close() {
    haptics('light');
    if (router.canGoBack()) router.back();
    else router.replace('/home');
  }

  if (!app) return null;
  // un autre service repart d'une page et d'un historique vierges
  return <Browser key={app.id} app={app} onClose={close} />;
}

function Browser({ app, onClose }: { app: EntApp; onClose: () => void }) {
  const theme = useAppTheme();
  const pinned = usePinnedApps().includes(app.id);
  const webRef = useRef<WebView>(null);

  // cookies de session réinjectés avant la première requête
  const [ready, setReady] = useState(false);
  const [page, setPage] = useState<PageState>({
    url: app.url,
    title: '',
    canGoBack: false,
    canGoForward: false,
    loading: true,
  });
  const [progress, setProgress] = useState(0);
  const [loadCount, setLoadCount] = useState(0);
  // le processus de rendu Android a planté : nouvelle WebView
  const [webKey, setWebKey] = useState(0);
  const [notice, setNotice] = useState<string | null>(null);

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
    if (Platform.OS !== 'android' || !page.canGoBack) return;
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      webRef.current?.goBack();
      return true;
    });
    return () => subscription.remove();
  }, [page.canGoBack]);

  function navigateTo(url: string) {
    webRef.current?.injectJavaScript(`window.location.href = ${JSON.stringify(url)}; true;`);
  }

  function openExternally(url: string) {
    Linking.openURL(url).catch(() => {
      const fallback = getIntentFallback(url);
      if (fallback) navigateTo(fallback);
      else setNotice('Aucune app installée ne peut ouvrir ce lien');
    });
  }

  // mailto:, tel:, Teams… sont confiés au système
  function shouldStartLoad(request: ShouldStartLoadRequest): boolean {
    if (isWebViewUrl(request.url)) return true;
    // une iframe ne lance jamais d'app d'elle-même
    if (request.isTopFrame !== false) openExternally(request.url);
    return false;
  }

  function onNavigationStateChange(event: WebViewNavigation) {
    setPage({
      url: event.url,
      title: event.title,
      canGoBack: event.canGoBack,
      canGoForward: event.canGoForward,
      loading: event.loading,
    });
  }

  function onLoadProgress({ nativeEvent }: WebViewProgressEvent) {
    setProgress(nativeEvent.progress);
  }

  // iOS : fichier joint (cours Moodle…), téléchargé avec la session de la page
  async function onFileDownload({ nativeEvent }: FileDownloadEvent) {
    haptics('light');
    setNotice('Téléchargement…');
    try {
      await downloadAndShare(nativeEvent.downloadUrl);
      setNotice(null);
    } catch (error) {
      console.warn('[browser] téléchargement impossible', error);
      haptics('error');
      setNotice('Téléchargement impossible');
    }
  }

  function togglePin() {
    if (togglePinnedApp(app.id)) {
      haptics('selection');
      setNotice(pinned ? `${app.label} retiré de l'accès rapide` : `${app.label} épinglé à l'accès rapide`);
    } else {
      haptics('warning');
      setNotice(`Accès rapide complet : ${MAX_PINNED_APPS} apps maximum`);
    }
  }

  function share() {
    Share.share(Platform.OS === 'ios' ? { url: page.url } : { message: page.url }).catch(() => {});
  }

  function navigation(action: () => void) {
    haptics('light');
    action();
  }

  function reload() {
    haptics('medium');
    webRef.current?.reload();
  }

  // titre de la page, sinon le nom du service (Android renvoie l'URL pendant le chargement)
  const title = page.title && !isWebViewUrl(page.title) ? page.title : app.label;

  return (
    // les menus Paper s'affichent dans la modale, pas derrière elle
    <Portal.Host>
      <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
        <BrowserHeader
          app={app}
          title={title}
          url={page.url}
          loading={page.loading}
          progress={progress}
          pinned={pinned}
          onClose={onClose}
          onTogglePin={togglePin}
          onShare={share}
          onOpenExternally={() => openExternally(page.url)}
        />

        {ready ? (
          <WebView
            key={webKey}
            ref={webRef}
            source={{ uri: app.url }}
            originWhitelist={['*']}
            onShouldStartLoadWithRequest={shouldStartLoad}
            onNavigationStateChange={onNavigationStateChange}
            onLoadProgress={onLoadProgress}
            onLoadEnd={() => setLoadCount((count) => count + 1)}
            onFileDownload={Platform.OS === 'ios' ? onFileDownload : undefined}
            onContentProcessDidTerminate={() => webRef.current?.reload()}
            onRenderProcessGone={() => setWebKey((key) => key + 1)}
            renderError={(_domain, code, description) => (
              <BrowserError code={code} description={description} onRetry={reload} />
            )}
            // la barre de progression suffit : pas de voile pendant un rechargement
            renderLoading={() => <View />}
            allowsBackForwardNavigationGestures
            pullToRefreshEnabled
            refreshControlLightMode={theme.dark}
            // inertie de Safari ; iOS seulement : sur Android la chaîne arrive telle quelle au
            // composant natif, qui attend un nombre et plante
            decelerationRate={Platform.OS === 'ios' ? 'normal' : undefined}
            allowsInlineMediaPlayback
            allowsFullscreenVideo
            setSupportMultipleWindows={false}
            downloadingMessage="Téléchargement en cours…"
            lackPermissionToDownloadMessage="Autorise l'accès au stockage pour télécharger ce fichier."
            webviewDebuggingEnabled={__DEV__}
            style={{ flex: 1, backgroundColor: theme.colors.background }}
            containerStyle={{ backgroundColor: theme.colors.background }}
          />
        ) : (
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
            <ActivityIndicator color={theme.colors.primary} />
          </View>
        )}

        <BrowserToolbar
          appLabel={app.label}
          canGoBack={page.canGoBack}
          canGoForward={page.canGoForward}
          loading={page.loading}
          onBack={() => navigation(() => webRef.current?.goBack())}
          onForward={() => navigation(() => webRef.current?.goForward())}
          onHome={() => navigation(() => navigateTo(app.url))}
          onReload={reload}
          onStop={() => navigation(() => webRef.current?.stopLoading())}
        />

        <Snackbar
          visible={notice !== null}
          onDismiss={() => setNotice(null)}
          duration={3000}
          wrapperStyle={{ bottom: BROWSER_TOOLBAR_HEIGHT }}
        >
          {notice ?? ''}
        </Snackbar>
      </View>
    </Portal.Host>
  );
}
