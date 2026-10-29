import * as AppIntents from 'expo-app-intents';

import { ENT_APPS } from '@/src/constants/ent';
import type { CalendarEvent } from '@/src/types';
import { emitDeepLink, parseDeepLink } from '@/src/utils/deeplink';
import { DAY_MS } from '@/src/utils/date';

// catalogues lus par les intents Swift sans lancer le js, voir app-intents/
const COURSE_KIND = 'course';
const ENT_APP_KIND = 'entApp';
// « Prochain cours » regarde la semaine à venir
const COURSES_SPAN_MS = 7 * DAY_MS;
const MAX_COURSES = 30;

// cours à venir ; null ou undefined vide le catalogue, Siri invite alors à ouvrir l'app
export function publishCourses(events: CalendarEvent[] | null | undefined): void {
  if (!AppIntents.isAvailable()) return;
  const now = Date.now();
  const seen = new Set<string>();
  const courses = (events ?? [])
    .map((event) => ({
      event,
      start: new Date(event.start.dateTime).getTime(),
      end: new Date(event.end.dateTime).getTime(),
    }))
    .filter(({ start, end }) => end > now && start < now + COURSES_SPAN_MS)
    .sort((a, b) => a.start - b.start)
    // un identifiant vide ou en double fait rejeter tout le catalogue
    .filter(({ event }) => {
      if (!event.id.trim() || seen.has(event.id)) return false;
      seen.add(event.id);
      return true;
    })
    .slice(0, MAX_COURSES)
    .map(({ event, start, end }) => ({
      id: event.id,
      title: event.title.trim() || 'Cours',
      metadata: { start: String(start), end: String(end), room: event.room },
    }));
  AppIntents.setEntityCatalogAsync(COURSE_KIND, courses).catch(() => {});
}

// services proposés par « Ouvrir un service de l'ENT »
export function publishEntApps(): void {
  if (!AppIntents.isAvailable()) return;
  const apps = ENT_APPS.map((app) => ({
    id: app.id,
    title: app.label,
    subtitle: app.subtitle,
    synonyms: [app.subtitle],
  }));
  AppIntents.setEntityCatalogAsync(ENT_APP_KIND, apps).catch(() => {});
}

// intents qui ouvrent l'app : traités comme des liens profonds
export async function handleAppIntents(pending: AppIntents.AppIntentInvocation[]): Promise<void> {
  for (const invocation of pending) {
    let url: string | null = null;
    if (invocation.name === 'openTimetable') url = 'unicenotes://edt';
    else if (invocation.name === 'openEntApp') url = `unicenotes://app/${String(invocation.params.appId)}`;
    if (!url) continue;

    const link = parseDeepLink(url);
    if (link) emitDeepLink(link);
    await AppIntents.removePendingInvocationAsync(invocation.id).catch(() => {});
  }
}
