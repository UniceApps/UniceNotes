import { useEffect, useRef, useSyncExternalStore } from 'react';
import { Platform } from 'react-native';

import * as QuickActions from 'expo-quick-actions';
import { useQuickActionCallback } from 'expo-quick-actions/hooks';
import { useGlobalSearchParams, usePathname, useRouter } from 'expo-router';

import { getEntApp } from '@/src/constants/ent';
import { useSettings } from '@/src/context/SettingsContext';
import { usePinnedApps } from '@/src/hooks/usePinnedApps';
import { emitDeepLink, parseDeepLink, peekDeepLink, subscribeDeepLink, takeDeepLink } from '@/src/utils/deeplink';

const icon = (symbol: string) => (Platform.OS === 'ios' ? `symbol:${symbol}` : null);

// l'écran d'accueil d'iOS n'affiche que les 4 premiers raccourcis
const MAX_QUICK_ACTIONS = 4;

const EDT_ACTION: QuickActions.Action = {
  id: 'edt',
  title: 'Emploi du temps',
  icon: icon('calendar'),
  params: { href: 'unicenotes://edt' },
};

const ENT_ACTION: QuickActions.Action = {
  id: 'ent',
  title: 'ENT',
  subtitle: 'Toutes les apps',
  icon: icon('square.grid.2x2'),
  params: { href: 'unicenotes://ent' },
};

// raccourcis de l'icône : l'EDT, les apps épinglées à l'accès rapide puis l'ENT
function buildQuickActions(pinned: string[]): QuickActions.Action[] {
  const apps = pinned.flatMap((id): QuickActions.Action[] => {
    const app = getEntApp(id);
    if (!app) return [];
    return [
      {
        id: `app-${app.id}`,
        title: app.label,
        subtitle: app.subtitle,
        icon: icon(app.symbol),
        params: { href: `unicenotes://app/${app.id}` },
      },
    ];
  });
  return [EDT_ACTION, ...apps, ENT_ACTION].slice(0, MAX_QUICK_ACTIONS);
}

function onQuickAction(action: QuickActions.Action) {
  const link = parseDeepLink(action.params?.href);
  if (link) emitDeepLink(link);
}

// liens profonds, widgets et raccourcis de l'icône : traités une fois l'accueil affiché
export function DeepLinkHandler() {
  const router = useRouter();
  const pathname = usePathname();
  const { code: currentCode, app: currentApp } = useGlobalSearchParams<{ code?: string; app?: string }>();
  const { adeid, oobeCompleted } = useSettings();
  const pinned = usePinnedApps();

  const link = useSyncExternalStore(subscribeDeepLink, peekDeepLink);
  const landed = useRef(false);

  useQuickActionCallback(onQuickAction);

  useEffect(() => {
    QuickActions.setItems(oobeCompleted ? buildQuickActions(pinned) : []);
  }, [oobeCompleted, pinned]);

  useEffect(() => {
    if (pathname === '/home') landed.current = true;
    if (!link || !landed.current || !oobeCompleted) return;

    const target = takeDeepLink();
    if (!target) return;

    // repart toujours des onglets
    const reset = () => {
      if (router.canDismiss()) router.dismissAll();
    };

    // seulement un service du catalogue, jamais une adresse venue du lien
    const openApp = (id: string) => {
      if (!getEntApp(id) || (pathname === '/browser' && currentApp === id)) return;
      reset();
      router.push({ pathname: '/browser', params: { app: id } });
    };

    switch (target.kind) {
      case 'notes':
        openApp('pronote');
        break;
      case 'app':
        openApp(target.id);
        break;
      case 'ent':
        if (pathname !== '/ent') {
          reset();
          router.navigate('/ent');
        }
        break;
      case 'edt':
        if (target.code) {
          // edt temporaire : lecture seule, l'edt enregistré n'est jamais modifié
          if (!pathname.startsWith('/edt/') || currentCode !== target.code) {
            reset();
            router.push({ pathname: '/edt/[code]', params: { code: target.code } });
          }
        } else if (!adeid) {
          if (pathname !== '/edt-config') {
            reset();
            router.push('/edt-config');
          }
        } else if (pathname !== '/timetable') {
          reset();
          router.navigate('/timetable');
        }
        break;
    }
  }, [link, pathname, currentCode, currentApp, oobeCompleted, adeid, router]);

  return null;
}
