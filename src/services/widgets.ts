import { Platform } from 'react-native';

import type { CalendarEvent, ClassActivityProps, WidgetClass, WidgetTimelineEntry } from '@/src/types';
import { DAY_MS, MINUTE_MS, formatClock } from '@/src/utils/date';
import { ClassActivity } from '@/src/widgets/ClassActivity';
import { NextClassWidgetInstance } from '@/src/widgets/NextClassWidget';

export const LIVE_ACTIVITIES_SUPPORTED = Platform.OS === 'ios';
const WIDGETS_SUPPORTED = Platform.OS === 'ios' || Platform.OS === 'android';

// la timeline des widgets couvre les 3 prochains jours
const TIMELINE_SPAN_MS = 3 * DAY_MS;
// la Live Activity apparaît 15 min avant le cours
const ACTIVITY_LEAD_MS = 15 * MINUTE_MS;

const startOf = (event: CalendarEvent) => new Date(event.start.dateTime);
const endOf = (event: CalendarEvent) => new Date(event.end.dateTime);

function upcoming(events: CalendarEvent[], now: Date): CalendarEvent[] {
  return events.filter((e) => endOf(e) > now).sort((a, b) => startOf(a).getTime() - startOf(b).getTime());
}

function toWidgetClass(event: CalendarEvent): WidgetClass {
  return {
    title: event.title,
    room: event.room,
    startTime: formatClock(startOf(event)),
    endTime: formatClock(endOf(event)),
    color: event.color,
    endsAt: endOf(event).getTime(),
  };
}

// une entrée maintenant, puis une à chaque fin de cours : le widget avance sans l'app
// events null : emploi du temps non configuré
function buildWidgetTimeline(events: CalendarEvent[] | null, now = new Date()): WidgetTimelineEntry[] {
  if (!events) return [{ date: now, props: { courses: [], configured: false } }];

  const future = upcoming(events, now);
  const coursesAt = (date: Date) =>
    future
      .filter((e) => endOf(e) > date)
      .slice(0, 3)
      .map(toWidgetClass);

  const cutoff = now.getTime() + TIMELINE_SPAN_MS;
  const ends = future.map((e) => endOf(e).getTime()).filter((ms) => ms > now.getTime() && ms <= cutoff);

  return [now.getTime(), ...new Set(ends)]
    .sort((a, b) => a - b)
    .map((ms) => {
      const date = new Date(ms);
      return { date, props: { courses: coursesAt(date), configured: true } };
    });
}

// cours en cours ou qui commence bientôt, null sinon
function buildClassActivity(events: CalendarEvent[], now = new Date()): ClassActivityProps | null {
  const [current, next] = upcoming(events, now);
  if (!current || startOf(current).getTime() - now.getTime() > ACTIVITY_LEAD_MS) return null;

  const end = endOf(current);
  const nextStart = next ? startOf(next) : null;
  return {
    title: current.title,
    room: current.room,
    start: startOf(current).getTime(),
    end: end.getTime(),
    color: current.color,
    next:
      next && nextStart && nextStart.toDateString() === end.toDateString()
        ? { title: next.title, room: next.room, startTime: formatClock(nextStart) }
        : undefined,
  };
}

export function updateWidgets(events: CalendarEvent[] | null): void {
  if (!WIDGETS_SUPPORTED) return;
  try {
    NextClassWidgetInstance.updateTimeline(buildWidgetTimeline(events));
  } catch {
    // widget non installé ou extension indisponible
  }
}

// démarre, met à jour ou arrête la Live Activity (events null : l'arrête)
export async function updateClassActivity(events: CalendarEvent[] | null): Promise<void> {
  if (!LIVE_ACTIVITIES_SUPPORTED) return;
  try {
    const props = events ? buildClassActivity(events) : null;
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
    // Live Activities désactivées dans les réglages iOS
  }
}
