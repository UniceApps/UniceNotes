import { useEffect, useRef, useSyncExternalStore } from 'react';
import { Platform } from 'react-native';

import * as QuickActions from 'expo-quick-actions';
import { useQuickActionCallback } from 'expo-quick-actions/hooks';
import { useGlobalSearchParams, usePathname, useRouter, type Href } from 'expo-router';

import { PRONOTE_URL } from '@/src/constants/config';
import { useApp } from '@/src/context/AppContext';
import { handleURL } from '@/src/utils/api';
import {
    emitDeepLink,
    parseDeepLink,
    peekDeepLink,
    subscribeDeepLink,
    takeDeepLink,
} from '@/src/utils/deeplink';

const icon = (symbol: string) => (Platform.OS === 'ios' ? `symbol:${symbol}` : null);

const QUICK_ACTIONS: QuickActions.Action[] = [
  {
    id: 'edt',
    title: 'Emploi du temps',
    icon: icon('calendar'),
    params: { href: 'unicenotes://edt' },
  },
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

// rejoue l'action à chaque changement de callback
function onQuickAction(action: QuickActions.Action) {
  const link = parseDeepLink(action.params?.href);
  if (link) emitDeepLink(link);
}

export function DeepLinkHandler() {
  const router = useRouter();
  const pathname = usePathname();
  const { code: currentCode } = useGlobalSearchParams<{ code?: string }>();
  const { adeid, isInitialized, oobeCompleted } = useApp();

  const link = useSyncExternalStore(subscribeDeepLink, peekDeepLink);
  const landed = useRef(false);

  useQuickActionCallback(onQuickAction);

  useEffect(() => {
    if (!isInitialized) return;
    QuickActions.setItems(oobeCompleted ? QUICK_ACTIONS : []);
  }, [isInitialized, oobeCompleted]);

  useEffect(() => {
    if (pathname === '/home') landed.current = true;
    if (!link || !landed.current || !isInitialized || !oobeCompleted) return;

    const target = takeDeepLink();
    if (!target) return;

    // repart toujours de l'accueil
    const open = (href: Href) => {
      if (router.canDismiss()) router.dismissAll();
      router.push(href);
    };

    switch (target.kind) {
      case 'notes':
        handleURL(PRONOTE_URL);
        break;
      case 'ent':
        if (pathname !== '/ent') open('/ent');
        break;
      case 'edt':
        if (target.code) {
          // EDT temporaire : lecture seule, l'EDT enregistré n'est jamais modifié
          if (pathname !== '/timetable' || currentCode !== target.code) {
            open({ pathname: '/timetable', params: { code: target.code } });
          }
        } else if (!adeid || adeid === 'demo') {
          if (pathname !== '/edt-config') open('/edt-config');
        } else if (pathname !== '/timetable' || currentCode) {
          open({ pathname: '/timetable', params: { fresh: '1' } });
        }
        break;
    }
  }, [link, pathname, currentCode, isInitialized, oobeCompleted, adeid, router]);

  return null;
}
