import ICAL from 'ical.js';

import type { AdeProgram, CalendarEvent } from '@/src/types';
import { colorFromString } from '@/src/utils/color';
import { isValidEdtCode } from '@/src/utils/deeplink';
import { withTimeout } from '@/src/utils/network';

import { ADE_URL, getCurrentProject, getProjectYear } from './ade';

const CALENDAR_TIMEOUT_MS = 10000;
const SEARCH_TIMEOUT_MS = 5000;
const SEARCH_URL = 'https://ade-consult.univ-cotedazur.fr/?action=search-vet&term=';

// suffixe ADE d'un emploi du temps de cursus (VET)
export const PROGRAM_SUFFIX = '-VET';

function parseCalendar(ics: string): CalendarEvent[] | null {
  try {
    const calendar = new ICAL.Component(ICAL.parse(ics));
    return calendar.getAllSubcomponents('vevent').map((vevent, index) => {
      const event = new ICAL.Event(vevent);
      const title = event.summary?.trim() ?? '';
      return {
        id: event.uid ?? String(index),
        title,
        room: event.location?.trim() ?? '',
        notes: event.description?.trim() ?? '',
        color: colorFromString(title),
        start: { dateTime: event.startDate.toJSDate().toISOString() },
        end: { dateTime: event.endDate.toJSDate().toISOString() },
      };
    });
  } catch {
    return null;
  }
}

// null si ADE est injoignable ou renvoie autre chose qu'un calendrier
export async function fetchCalendar(code: string): Promise<CalendarEvent[] | null> {
  if (!isValidEdtCode(code)) return null;
  const project = await getCurrentProject();
  if (!project) return null;

  const year = getProjectYear(project);
  const url =
    `${ADE_URL}/jsp/custom/modules/plannings/anonymous_cal.jsp?calType=ical` +
    `&code=${encodeURIComponent(code)}&projectId=${project.id}` +
    `&firstDate=${year}-09-01&lastDate=${year + 1}-08-31`;

  return withTimeout(CALENDAR_TIMEOUT_MS, async (signal) => {
    const res = await fetch(url, { signal });
    return res.ok ? parseCalendar(await res.text()) : null;
  });
}

// null en cas d'erreur réseau, [] si rien ne correspond
export function searchPrograms(term: string): Promise<AdeProgram[] | null> {
  return withTimeout(SEARCH_TIMEOUT_MS, async (signal) => {
    const res = await fetch(SEARCH_URL + encodeURIComponent(term), { signal });
    if (!res.ok) return null;
    const data = (await res.json()) as { results?: { id: string; text: string }[] };
    return (data.results ?? []).map(({ id, text }) => ({ id, name: text }));
  });
}
