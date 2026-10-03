import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AppState } from 'react-native';

import { useApp } from '@/src/context/AppContext';
import { edtService } from '@/src/services/edt';
import { updateWidgets } from '@/src/services/widgets';
import { buildAgenda, toAgendaClasses, type Agenda, type AgendaClass } from '@/src/utils/agenda';
import { getCalendarCacheTime, getCalendarFromCache } from '@/src/utils/calendar';

// « dans 12 min » et la progression sont recalculés sans requête
const TICK_MS = 30 * 1000;
// au retour dans l'app, l'edt est retéléchargé au-delà de ce délai
const STALE_AFTER_MS = 15 * 60 * 1000;

export interface AgendaState extends Agenda {
  configured: boolean;
  // edt affiché (ADE ou cache), trié
  classes: AgendaClass[];
  now: Date;
  fetching: boolean;
  // « tirer pour actualiser » en cours
  refreshing: boolean;
  offline: boolean;
  // date des données affichées, null tant qu'elle est inconnue
  syncedAt: number | null;
  reload: () => void;
  // même chose, avec l'indicateur de « tirer pour actualiser »
  refresh: () => void;
}

export function useAgenda(): AgendaState {
  const { adeid, calendar, setCalendar, calendarOffline, setCalendarOffline } = useApp();
  const configured = !!adeid && adeid !== 'demo';

  const [fetchKey, setFetchKey] = useState(0);
  // dernière requête terminée
  const [synced, setSynced] = useState<{ request: string; at: number | null } | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [now, setNow] = useState(() => new Date());
  // edt vide à l'arrivée : le cache s'affiche pendant le téléchargement
  const [preloadCache] = useState(() => calendar.length === 0);
  const lastRequestAt = useRef(0);

  const request = `${adeid}:${fetchKey}`;
  const fetching = configured && synced?.request !== request;

  useEffect(() => {
    if (!configured || !adeid) return;
    let cancelled = false;
    lastRequestAt.current = Date.now();

    async function load(code: string) {
      if (preloadCache && fetchKey === 0) {
        const cached = await getCalendarFromCache();
        if (cancelled) return;
        if (cached.length > 0) setCalendar(cached);
      }

      const { events, offline } = await edtService.getEDT(code);
      if (cancelled) return;
      setCalendar(events);
      setCalendarOffline(offline);
      updateWidgets(events);
      setSynced({ request: `${code}:${fetchKey}`, at: offline ? getCalendarCacheTime() : Date.now() });
      setRefreshing(false);
    }

    load(adeid);
    return () => {
      cancelled = true;
    };
  }, [adeid, configured, fetchKey, preloadCache, setCalendar, setCalendarOffline]);

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), TICK_MS);
    const subscription = AppState.addEventListener('change', (state) => {
      if (state !== 'active') return;
      setNow(new Date());
      if (Date.now() - lastRequestAt.current > STALE_AFTER_MS) setFetchKey((key) => key + 1);
    });
    return () => {
      clearInterval(timer);
      subscription.remove();
    };
  }, []);

  const reload = useCallback(() => setFetchKey((key) => key + 1), []);

  const refresh = useCallback(() => {
    setRefreshing(true);
    reload();
  }, [reload]);

  const classes = useMemo(() => (configured ? toAgendaClasses(calendar) : []), [calendar, configured]);
  const agenda = useMemo(() => buildAgenda(classes, now), [classes, now]);

  return {
    ...agenda,
    configured,
    classes,
    now,
    fetching,
    refreshing,
    offline: calendarOffline,
    syncedAt: synced?.at ?? null,
    reload,
    refresh,
  };
}
