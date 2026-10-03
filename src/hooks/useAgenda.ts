import { useMemo } from 'react';

import { useCalendar } from '@/src/context/CalendarContext';
import { useSettings } from '@/src/context/SettingsContext';
import { buildAgenda, toAgendaClasses } from '@/src/utils/agenda';

import { useNow } from './useNow';

// « dans 12 min » et la progression du cours se recalculent sans requête
export function useAgenda() {
  const { adeid } = useSettings();
  const calendar = useCalendar();
  const now = useNow();

  const classes = useMemo(() => toAgendaClasses(calendar.events), [calendar.events]);
  const agenda = useMemo(() => buildAgenda(classes, now), [classes, now]);

  return { ...calendar, ...agenda, configured: adeid !== null, classes, now };
}

export type AgendaState = ReturnType<typeof useAgenda>;
