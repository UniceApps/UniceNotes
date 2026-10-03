import { useEffect, useRef, useSyncExternalStore } from 'react';
import { Platform } from 'react-native';

import * as QuickActions from 'expo-quick-actions';
import { useQuickActionCallback } from 'expo-quick-actions/hooks';
import { useGlobalSearchParams, usePathname, useRouter, type Href } from 'expo-router';

import { LINKS } from '@/src/constants/config';
import { useSettings } from '@/src/context/SettingsContext';
import { openURL } from '@/src/utils/browser';
import { emitDeepLink, parseDeepLink, peekDeepLink, subscribeDeepLink, takeDeepLink } from '@/src/utils/deeplink';

const icon = (symbol: string) => (Platform.OS === 'ios' ? `symbol:${symbol}` : null);

const QUICK_ACTIONS: QuickActions.Action[] = [
  { id: 'edt', title: 'Emploi du temps', icon: icon('calendar'), params: { href: 'unicenotes://edt' } },
  {
    id: 'notes',
    title: 'Notes',
    subtitle: 'PronoteCampus',
    icon: icon('graduationcap'),
    params: { href: 'unicenotes://notes' },
  },
  {
    id: 'ent',
    title: 'ENT',
    subtitle: 'Intranet étudiant',
    icon: icon('briefcase'),
    params: { href: 'unicenotes://ent' },
  },
];

function onQuickAction(action: QuickActions.Action) {
  const link = parseDeepLink(action.params?.href);
  if (link) emitDeepLink(link);
}

// liens profonds, widgets et raccourcis de l'icône : traités une fois l'accueil affiché
export function DeepLinkHandler() {
  const router = useRouter();
  const pathname = usePathname();
  const { code: currentCode } = useGlobalSearchParams<{ code?: string }>();
  const { adeid, oobeCompleted } = useSettings();

  const link = useSyncExternalStore(subscribeDeepLink, peekDeepLink);
  const landed = useRef(false);

  useQuickActionCallback(onQuickAction);

  useEffect(() => {
    QuickActions.setItems(oobeCompleted ? QUICK_ACTIONS : []);
  }, [oobeCompleted]);

  useEffect(() => {
    if (pathname === '/home') landed.current = true;
    if (!link || !landed.current || !oobeCompleted) return;

    const target = takeDeepLink();
    if (!target) return;

    // repart toujours de l'accueil
    const open = (href: Href) => {
      if (router.canDismiss()) router.dismissAll();
      router.push(href);
    };

    switch (target.kind) {
      case 'notes':
        openURL(LINKS.pronote);
        break;
      case 'ent':
        if (pathname !== '/ent') open('/ent');
        break;
      case 'edt':
        if (target.code) {
          // edt temporaire : lecture seule, l'edt enregistré n'est jamais modifié
          if (pathname !== '/timetable' || currentCode !== target.code) {
            open({ pathname: '/timetable', params: { code: target.code } });
          }
        } else if (!adeid) {
          if (pathname !== '/edt-config') open('/edt-config');
        } else if (pathname !== '/timetable' || currentCode) {
          open('/timetable');
        }
        break;
    }
  }, [link, pathname, currentCode, oobeCompleted, adeid, router]);

  return null;
}
