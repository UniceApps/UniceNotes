import { useEffect, useRef, useSyncExternalStore } from 'react';
import { Platform } from 'react-native';

import * as QuickActions from 'expo-quick-actions';
import { useQuickActionCallback } from 'expo-quick-actions/hooks';
import { usePathname, useRouter } from 'expo-router';

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

// useQuickActionCallback rejoue l'action initiale à chaque changement de callback
function onQuickAction(action: QuickActions.Action) {
  const link = parseDeepLink(action.params?.href);
  if (link) emitDeepLink(link);
}

// Ouvre les liens profonds (raccourcis d'icône et URL du système) une fois l'app prête.
// Au démarrage à froid le splash finit par un router.replace('/home') : ouvrir avant serait écrasé.
export function DeepLinkHandler() {
  const router = useRouter();
  const pathname = usePathname();
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

    switch (target.kind) {
      case 'notes':
        handleURL(PRONOTE_URL);
        break;
      case 'ent':
        router.push('/ent');
        break;
      case 'edt':
        if (target.code) {
          // EDT temporaire : lecture seule, l'EDT enregistré n'est jamais modifié
          router.push({ pathname: '/timetable', params: { code: target.code } });
        } else if (!adeid || adeid === 'demo') {
          router.push('/edt-config');
        } else {
          router.push({ pathname: '/timetable', params: { fresh: '1' } });
        }
        break;
    }
  }, [link, pathname, isInitialized, oobeCompleted, adeid, router]);

  return null;
}
