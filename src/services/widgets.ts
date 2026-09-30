import { AppState, Platform } from 'react-native';

import type { CalendarEvent, ClassActivityProps, NextClassWidgetProps, WidgetClass } from '../types';
import { getCalendarFromCache } from '../utils/calendar';
import { ClassActivity } from '../widgets/ClassActivity';
import { NextClassWidgetInstance } from '../widgets/NextClassWidget';

// plateformes dont le widget est alimenté par l'app
export const WIDGETS_SUPPORTED = Platform.OS === 'ios' || Platform.OS === 'android';

// la timeline couvre les 3 prochains jours
const TIMELINE_SPAN_MS = 3 * 24 * 60 * 60 * 1000;
// la Live Activity apparaît 15 min avant le cours
const ACTIVITY_LEAD_MS = 15 * 60 * 1000;

export interface WidgetTimelineEntry {
  date: Date;
  props: NextClassWidgetProps;
}

function formatHour(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function toWidgetClass(event: CalendarEvent): WidgetClass {
  return {
    title: event.title,
    room: event.description, // description = location dans CalendarEvent
    startTime: formatHour(new Date(event.start.dateTime)),
    endTime: formatHour(new Date(event.end.dateTime)),
    color: event.color,
    endsAt: new Date(event.end.dateTime).getTime(),
  };
}

export function buildWidgetTimeline(events: CalendarEvent[]): WidgetTimelineEntry[] {
  if (events.length === 0) {
    return [{ date: new Date(), props: { courses: [], configured: false } }];
  }

  const now = new Date();
  const cutoff = new Date(now.getTime() + TIMELINE_SPAN_MS);

  // Tous les cours futurs triés par heure de début
  const allFuture = events
    .filter((e) => new Date(e.end.dateTime) > now)
    .sort((a, b) => new Date(a.start.dateTime).getTime() - new Date(b.start.dateTime).getTime());

  const getCoursesAt = (from: Date): WidgetClass[] =>
    allFuture
      .filter((e) => new Date(e.end.dateTime) > from)
      .slice(0, 3)
      .map(toWidgetClass);

  const seen = new Set<number>([now.getTime()]);
  const timeline: WidgetTimelineEntry[] = [
    { date: now, props: { courses: getCoursesAt(now), configured: true } },
  ];

  for (const event of allFuture) {
    const endDate = new Date(event.end.dateTime);
    const ms = endDate.getTime();
    if (endDate <= cutoff && !seen.has(ms)) {
      seen.add(ms);
      timeline.push({ date: endDate, props: { courses: getCoursesAt(endDate), configured: true } });
    }
  }

  return timeline;
}

// ---
// Live Activity (iOS)
// ---

export const LIVE_ACTIVITIES_SUPPORTED = Platform.OS === 'ios';

let liveActivitiesEnabled = true;

export function setLiveActivitiesEnabled(value: boolean): void {
  liveActivitiesEnabled = value;
}

// cours en cours ou qui commence bientôt, null sinon
function buildClassActivity(events: CalendarEvent[], now = new Date()): ClassActivityProps | null {
  const [current, next] = events
    .filter((e) => new Date(e.end.dateTime) > now)
    .sort((a, b) => new Date(a.start.dateTime).getTime() - new Date(b.start.dateTime).getTime());
  if (!current) return null;

  const start = new Date(current.start.dateTime);
  const end = new Date(current.end.dateTime);
  if (start.getTime() - now.getTime() > ACTIVITY_LEAD_MS) return null;

  const nextStart = next ? new Date(next.start.dateTime) : null;
  return {
    title: current.title,
    room: current.description,
    start: start.getTime(),
    end: end.getTime(),
    color: current.color,
    next:
      next && nextStart && nextStart.toDateString() === end.toDateString()
        ? { title: next.title, room: next.description, startTime: formatHour(nextStart) }
        : undefined,
  };
}

// démarre, met à jour ou arrête la Live Activity selon l'edt
async function updateClassActivity(events: CalendarEvent[]): Promise<void> {
  if (!LIVE_ACTIVITIES_SUPPORTED) return;
  try {
    // désactivée dans les paramètres : on arrête celle en cours
    const props = liveActivitiesEnabled ? buildClassActivity(events) : null;
    const [running, ...extra] = ClassActivity.getInstances();
    await Promise.all(extra.map((activity) => activity.end('immediate')));

    if (!props) {
      await running?.end('immediate');
      return;
    }
    // à la fin du cours, la Live Activity passe en « Cours terminé »
    const staleDate = new Date(props.end);
    if (running) await running.update(props, staleDate);
    else ClassActivity.start(props, 'unicenotes://edt', staleDate);
  } catch {
    // Live Activities désactivées dans les réglages
  }
}

// aligne la Live Activity sur l'edt en cache
export function refreshClassActivity(): void {
  if (!LIVE_ACTIVITIES_SUPPORTED) return;
  getCalendarFromCache().then(updateClassActivity);
}

// au retour dans l'app, la Live Activity suit l'edt en cache
export function watchClassActivity(): () => void {
  if (!LIVE_ACTIVITIES_SUPPORTED) return () => {};
  const subscription = AppState.addEventListener('change', (state) => {
    if (state === 'active') refreshClassActivity();
  });
  return () => subscription.remove();
}

// met à jour les widgets avec l'edt de l'utilisateur
export function updateWidgets(events: CalendarEvent[]): void {
  if (!WIDGETS_SUPPORTED) return;
  try {
    NextClassWidgetInstance.updateTimeline(buildWidgetTimeline(events));
  } catch {
    // widget non installé ou extension indisponible
  }
  updateClassActivity(events);
}
