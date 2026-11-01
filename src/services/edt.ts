import ICAL from 'ical.js';

import type { AdeProgram, CalendarEvent } from '@/src/types';
import { parsePrograms, type ProgramEntry } from '@/src/utils/ade-xml';
import { isValidEdtCode } from '@/src/utils/deeplink';
import { withTimeout } from '@/src/utils/network';

import { ADE_URL, adeRequest, closeSession, getCurrentProject, getProjectYear, openSession } from './ade';

const CALENDAR_TIMEOUT_MS = 10000;
const PROGRAMS_TIMEOUT_MS = 15000;
const MAX_RESULTS = 50;

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

function normalize(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[‘’]/g, "'")
    .toLowerCase();
}

async function fetchPrograms(projectId: string, signal: AbortSignal): Promise<ProgramEntry[] | null> {
  const sessionId = await openSession(signal);
  if (!sessionId) return null;

  try {
    const project = await adeRequest(sessionId, { function: 'setProject', projectId }, signal);
    if (!project.includes('<setProject')) return null;

    const xml = await adeRequest(
      sessionId,
      { function: 'getResources', category: 'trainee', type: 'VET', detail: '11' },
      signal,
    );
    const entries = parsePrograms(xml);
    if (entries.length === 0) return null;
    return entries
      .map(({ program, text }) => ({ program, text: normalize(text) }))
      .sort((a, b) => a.program.name.localeCompare(b.program.name, 'fr', { numeric: true, sensitivity: 'base' }));
  } finally {
    closeSession(sessionId);
  }
}

let programsRequest: { projectId: string; promise: Promise<ProgramEntry[] | null> } | null = null;

// gardés le temps de la session de l'app, redemandés après un échec ou un changement d'année
function getPrograms(projectId: string): Promise<ProgramEntry[] | null> {
  if (programsRequest?.projectId !== projectId) {
    const promise = withTimeout(PROGRAMS_TIMEOUT_MS, (signal) => fetchPrograms(projectId, signal)).then((entries) => {
      if (!entries && programsRequest?.promise === promise) programsRequest = null;
      return entries;
    });
    programsRequest = { projectId, promise };
  }
  return programsRequest.promise;
}

export function preloadPrograms(): void {
  getCurrentProject().then((project) => project && getPrograms(project.id));
}

// null si ADE est injoignable, [] si rien ne correspond ; tous les mots doivent apparaître
export async function searchPrograms(term: string): Promise<AdeProgram[] | null> {
  const project = await getCurrentProject();
  if (!project) return null;
  const entries = await getPrograms(project.id);
  if (!entries) return null;

  const words = normalize(term).split(/\s+/).filter(Boolean);
  return entries
    .filter(({ text }) => words.every((word) => text.includes(word)))
    .slice(0, MAX_RESULTS)
    .map(({ program }) => program);
}
