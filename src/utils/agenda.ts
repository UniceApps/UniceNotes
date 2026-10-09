import type { CalendarEvent } from '@/src/types';

import { daysBetween, formatClock, formatDay, formatDuration, minutesUntil } from './date';

export interface AgendaClass {
  id: string;
  title: string;
  room: string;
  color: string;
  start: Date;
  end: Date;
}

export interface Agenda {
  // cours en cours, sinon le prochain
  next: AgendaClass | null;
  // cours suivants, le même jour que next
  later: AgendaClass[];
  // fin du dernier cours de ce jour-là
  dayEnd: Date | null;
}

export interface ClassStatus {
  ongoing: boolean;
  // « En cours », « Dans 25 min », « Demain »…
  label: string;
  // cours en cours : avancement (0 à 1) et temps restant
  progress: number;
  remaining: string;
}

// "08:00 – 10:00 · 2 h"
export function formatSchedule(item: { start: Date; end: Date }): string {
  const length = Math.round((item.end.getTime() - item.start.getTime()) / 60000);
  return `${formatClock(item.start)} – ${formatClock(item.end)} · ${formatDuration(length)}`;
}

// cours valides, triés par heure de début
export function toAgendaClasses(events: CalendarEvent[]): AgendaClass[] {
  return events
    .map((event) => ({
      id: event.id,
      title: event.title || 'Cours sans titre',
      room: event.room,
      color: event.color,
      start: new Date(event.start.dateTime),
      end: new Date(event.end.dateTime),
    }))
    .filter((item) => !Number.isNaN(item.start.getTime()) && !Number.isNaN(item.end.getTime()))
    .sort((a, b) => a.start.getTime() - b.start.getTime());
}

const EXAM_HORIZON_DAYS = 7;

// DS du prochain jour qui en compte, dans la semaine à venir ; classes : triées par début
export function findNextExams(classes: AgendaClass[], exams: ReadonlySet<string>, now: Date): AgendaClass[] {
  const upcoming = classes.filter((item) => item.start > now && exams.has(item.id));
  const [first] = upcoming;
  if (!first || daysBetween(now, first.start) >= EXAM_HORIZON_DAYS) return [];
  return upcoming.filter((item) => daysBetween(first.start, item.start) === 0);
}

export function formatExamReminder(exams: AgendaClass[], now: Date): string {
  const [first] = exams;
  const day = formatDay(first.start, now).toLowerCase();
  if (exams.length > 1) return `Tu as ${exams.length} DS ${day}, le premier à ${formatClock(first.start)}`;
  return `Tu as un DS ${day} à ${formatClock(first.start)} : ${first.title}`;
}

// classes : triées par début
export function buildAgenda(classes: AgendaClass[], now: Date): Agenda {
  const [next = null, ...rest] = classes.filter((item) => item.end > now);
  if (!next) return { next: null, later: [], dayEnd: null };

  const later = rest.filter((item) => daysBetween(next.start, item.start) === 0);
  const dayEnd = later.reduce((end, item) => (item.end > end ? item.end : end), next.end);
  return { next, later, dayEnd };
}

export function getClassStatus(item: AgendaClass, now: Date): ClassStatus {
  if (item.start <= now) {
    const total = item.end.getTime() - item.start.getTime();
    return {
      ongoing: true,
      label: 'En cours',
      progress: total > 0 ? Math.min(1, (now.getTime() - item.start.getTime()) / total) : 1,
      remaining: `encore ${formatDuration(minutesUntil(now, item.end))}`,
    };
  }

  const label =
    daysBetween(now, item.start) === 0
      ? `Dans ${formatDuration(minutesUntil(now, item.start))}`
      : formatDay(item.start, now);
  return { ongoing: false, label, progress: 0, remaining: '' };
}
