import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { AppState } from 'react-native';

import { useExams } from '@/src/hooks/useExams';
import { readCalendarCache, writeCalendarCache } from '@/src/services/calendar-cache';
import { fetchCalendar } from '@/src/services/edt';
import { updateExamReminders } from '@/src/services/reminders';
import { updateClassActivity, updateWidgets } from '@/src/services/widgets';
import type { CalendarEvent } from '@/src/types';
import { MINUTE_MS } from '@/src/utils/date';

import { useSettings } from './SettingsContext';

// au retour dans l'app, l'edt est retéléchargé au-delà de ce délai
const STALE_AFTER_MS = 15 * MINUTE_MS;

interface CalendarData {
  // identifiant ADE auquel appartiennent ces cours
  code: string;
  events: CalendarEvent[];
  // true si ADE est injoignable : events vient du cache
  offline: boolean;
  syncedAt: number | null;
}

interface CalendarContextValue {
  events: CalendarEvent[];
  offline: boolean;
  syncedAt: number | null;
  // téléchargement en cours
  loading: boolean;
  // « tirer pour actualiser » en cours
  refreshing: boolean;
  reload: () => void;
  refresh: () => void;
}

const CalendarContext = createContext<CalendarContextValue | null>(null);

// seul endroit qui télécharge l'edt : l'accueil, l'emploi du temps et les widgets partagent ces données
export function CalendarProvider({ children }: { children: ReactNode }) {
  const { adeid, liveActivities, notifications } = useSettings();
  const exams = useExams();
  const [data, setData] = useState<CalendarData | null>(null);
  const [fetchKey, setFetchKey] = useState(0);
  // dernière synchro terminée
  const [doneKey, setDoneKey] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const lastSyncAt = useRef(0);
  const loadedCode = useRef<string | null>(null);

  const requestKey = `${adeid}:${fetchKey}`;
  const current = data && data.code === adeid ? data : null;

  useEffect(() => {
    if (!adeid) {
      updateWidgets(null);
      return;
    }
    let cancelled = false;
    lastSyncAt.current = Date.now();

    async function sync(code: string) {
      // premier affichage : le cache, le temps qu'ADE réponde
      if (loadedCode.current !== code) {
        const cached = await readCalendarCache(code);
        if (cancelled) return;
        if (cached) setData({ code, events: cached.events, offline: false, syncedAt: cached.savedAt });
        loadedCode.current = code;
      }

      const events = await fetchCalendar(code);
      if (cancelled) return;
      if (events) {
        const syncedAt = Date.now();
        writeCalendarCache({ code, savedAt: syncedAt, events });
        updateWidgets(events);
        setData({ code, events, offline: false, syncedAt });
      } else {
        setData((previous) =>
          previous?.code === code
            ? { ...previous, offline: true }
            : { code, events: [], offline: true, syncedAt: null },
        );
      }
      setDoneKey(`${code}:${fetchKey}`);
      setRefreshing(false);
    }

    sync(adeid);
    return () => {
      cancelled = true;
    };
  }, [adeid, fetchKey]);

  // la Live Activity suit l'edt affiché, une fois le cache lu
  useEffect(() => {
    if (adeid && !current) return;
    updateClassActivity(liveActivities && current ? current.events : null);
  }, [adeid, current, liveActivities]);

  // rappels des DS, même hors ligne avec l'edt en cache
  useEffect(() => {
    if (adeid && !current) return;
    updateExamReminders(notifications && current ? current.events : null, exams);
  }, [adeid, current, notifications, exams]);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (state) => {
      if (state !== 'active') return;
      if (adeid && Date.now() - lastSyncAt.current > STALE_AFTER_MS) setFetchKey((key) => key + 1);
      else if (current) {
        updateClassActivity(liveActivities ? current.events : null);
        updateExamReminders(notifications ? current.events : null, exams);
      }
    });
    return () => subscription.remove();
  }, [adeid, current, liveActivities, notifications, exams]);

  const value: CalendarContextValue = {
    events: current?.events ?? [],
    offline: current?.offline ?? false,
    syncedAt: current?.syncedAt ?? null,
    loading: adeid !== null && doneKey !== requestKey,
    refreshing,
    reload: () => setFetchKey((key) => key + 1),
    refresh: () => {
      setRefreshing(true);
      setFetchKey((key) => key + 1);
    },
  };

  return <CalendarContext.Provider value={value}>{children}</CalendarContext.Provider>;
}

export function useCalendar(): CalendarContextValue {
  const context = useContext(CalendarContext);
  if (!context) throw new Error('useCalendar must be used within CalendarProvider');
  return context;
}
