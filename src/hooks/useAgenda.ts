import { useMemo } from 'react';

import { useCalendar } from '@/src/context/CalendarContext';
import { useSettings } from '@/src/context/SettingsContext';
import { buildAgenda, findNextExams, toAgendaClasses } from '@/src/utils/agenda';

import { useExams } from './useExams';
import { useNow } from './useNow';

// « dans 12 min » et la progression du cours se recalculent sans requête
export function useAgenda() {
  const { adeid } = useSettings();
  const calendar = useCalendar();
  const now = useNow();
  const examIds = useExams();

  const classes = useMemo(() => toAgendaClasses(calendar.events), [calendar.events]);
  const agenda = useMemo(() => buildAgenda(classes, now), [classes, now]);
  const exams = useMemo(() => findNextExams(classes, examIds, now), [classes, examIds, now]);

  return { ...calendar, ...agenda, configured: adeid !== null, classes, exams, now };
}

export type AgendaState = ReturnType<typeof useAgenda>;
