import type { CalendarEvent } from '../types';
import { formatDuration, formatTime } from './rooms';

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

const DAY_MS = 24 * 60 * 60 * 1000;

const DAYS = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'];
const MONTHS = [
  'janvier', 'février', 'mars', 'avril', 'mai', 'juin',
  'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre',
];

function capitalize(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

// jours calendaires entre deux dates (0 = même jour)
function daysBetween(from: Date, to: Date): number {
  const a = new Date(from.getFullYear(), from.getMonth(), from.getDate());
  const b = new Date(to.getFullYear(), to.getMonth(), to.getDate());
  return Math.round((b.getTime() - a.getTime()) / DAY_MS);
}

// minutes entamées, au moins 1
function minutesUntil(from: Date, to: Date): number {
  return Math.max(1, Math.ceil((to.getTime() - from.getTime()) / 60000));
}

// "08:05"
export function formatClock(date: Date): string {
  return formatTime(date.getHours() * 60 + date.getMinutes());
}

// "Jeudi 1er octobre"
export function formatLongDate(date: Date): string {
  const day = date.getDate();
  return capitalize(`${DAYS[date.getDay()]} ${day === 1 ? '1er' : day} ${MONTHS[date.getMonth()]}`);
}

// « Aujourd'hui », « Demain », « Lundi », « Lundi 13 octobre »
export function formatDay(date: Date, now: Date): string {
  const days = daysBetween(now, date);
  if (days === 0) return "Aujourd'hui";
  if (days === 1) return 'Demain';
  if (days > 1 && days < 7) return capitalize(DAYS[date.getDay()]);
  return formatLongDate(date);
}

// "08:00 – 10:00 · 2 h"
export function formatSchedule(item: AgendaClass): string {
  const length = Math.round((item.end.getTime() - item.start.getTime()) / 60000);
  return `${formatClock(item.start)} – ${formatClock(item.end)} · ${formatDuration(length)}`;
}

// « à 18:02 », « le 30/09 à 18:02 »
export function formatSyncTime(ms: number, now: Date): string {
  const date = new Date(ms);
  if (daysBetween(date, now) === 0) return `à ${formatClock(date)}`;
  const pad = (n: number) => String(n).padStart(2, '0');
  return `le ${pad(date.getDate())}/${pad(date.getMonth() + 1)} à ${formatClock(date)}`;
}

// numéro de semaine ISO, comme dans l'emploi du temps
export function getIsoWeek(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
  const yearStart = Date.UTC(d.getUTCFullYear(), 0, 1);
  return Math.ceil(((d.getTime() - yearStart) / DAY_MS + 1) / 7);
}

// cours valides, triés par heure de début
export function toAgendaClasses(events: CalendarEvent[]): AgendaClass[] {
  return events
    .map((event) => ({
      id: event.id,
      title: event.title.trim() || 'Cours sans titre',
      room: event.description.trim(),
      color: event.color,
      start: new Date(event.start.dateTime),
      end: new Date(event.end.dateTime),
    }))
    .filter((item) => !Number.isNaN(item.start.getTime()) && !Number.isNaN(item.end.getTime()))
    .sort((a, b) => a.start.getTime() - b.start.getTime());
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
