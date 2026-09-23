import { Platform } from 'react-native';

import type { CalendarEvent, NextClassWidgetProps, WidgetClass } from '../types';
import { NextClassWidgetInstance } from '../widgets/NextClassWidget';

// plateformes dont le widget est alimenté par l'app
export const WIDGETS_SUPPORTED = Platform.OS === 'ios' || Platform.OS === 'android';

// la timeline couvre les 3 prochains jours
const TIMELINE_SPAN_MS = 3 * 24 * 60 * 60 * 1000;

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

// met à jour les widgets avec l'edt de l'utilisateur
export function updateWidgets(events: CalendarEvent[]): void {
  if (!WIDGETS_SUPPORTED) return;
  try {
    NextClassWidgetInstance.updateTimeline(buildWidgetTimeline(events));
  } catch {
    // widget non installé ou extension indisponible
  }
}
