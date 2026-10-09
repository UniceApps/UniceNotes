export const MINUTE_MS = 60 * 1000;
export const DAY_MS = 24 * 60 * MINUTE_MS;

const DAYS = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'];
const MONTHS = [
  'janvier',
  'février',
  'mars',
  'avril',
  'mai',
  'juin',
  'juillet',
  'août',
  'septembre',
  'octobre',
  'novembre',
  'décembre',
];

const pad = (n: number) => String(n).padStart(2, '0');

export function capitalize(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

// jours calendaires entre deux dates (0 = même jour)
export function daysBetween(from: Date, to: Date): number {
  const a = new Date(from.getFullYear(), from.getMonth(), from.getDate());
  const b = new Date(to.getFullYear(), to.getMonth(), to.getDate());
  return Math.round((b.getTime() - a.getTime()) / DAY_MS);
}

// minutes entamées, au moins 1
export function minutesUntil(from: Date, to: Date): number {
  return Math.max(1, Math.ceil((to.getTime() - from.getTime()) / MINUTE_MS));
}

// numéro de semaine ISO, comme dans l'emploi du temps
export function getIsoWeek(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
  const yearStart = Date.UTC(d.getUTCFullYear(), 0, 1);
  return Math.ceil(((d.getTime() - yearStart) / DAY_MS + 1) / 7);
}

// 845 -> "14:05"
export function formatTime(minutes: number): string {
  return `${pad(Math.floor(minutes / 60) % 24)}:${pad(minutes % 60)}`;
}

// "14:05"
export function formatClock(date: Date): string {
  return formatTime(date.getHours() * 60 + date.getMinutes());
}

// 30 -> "30 min", 60 -> "1 h", 90 -> "1 h 30"
export function formatDuration(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m} min`;
  return m === 0 ? `${h} h` : `${h} h ${pad(m)}`;
}

// "Jeudi 1er octobre"
export function formatLongDate(date: Date): string {
  const day = date.getDate();
  return capitalize(`${DAYS[date.getDay()]} ${day === 1 ? '1er' : day} ${MONTHS[date.getMonth()]}`);
}

export function formatIsoDate(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

// "Octobre 2026"
export function formatMonth(date: Date): string {
  return capitalize(`${MONTHS[date.getMonth()]} ${date.getFullYear()}`);
}

// « Aujourd'hui », « Demain », « Lundi », « Lundi 13 octobre »
export function formatDay(date: Date, now: Date): string {
  const days = daysBetween(now, date);
  if (days === 0) return "Aujourd'hui";
  if (days === 1) return 'Demain';
  if (days > 1 && days < 7) return capitalize(DAYS[date.getDay()]);
  return formatLongDate(date);
}

// « à 18:02 », « le 30/09 à 18:02 »
export function formatSyncTime(ms: number, now: Date): string {
  const date = new Date(ms);
  if (daysBetween(date, now) === 0) return `à ${formatClock(date)}`;
  return `le ${pad(date.getDate())}/${pad(date.getMonth() + 1)} à ${formatClock(date)}`;
}
