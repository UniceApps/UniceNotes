import { formatIsoDate } from '@/src/utils/date';

export interface Holiday {
  // "2026-11-11"
  date: string;
  name: string;
}

// dimanche de pâques, algorithme de meeus (calendrier grégorien)
// source claude merci
function getEaster(year: number): Date {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const h = (19 * a + b - Math.floor(b / 4) - Math.floor((b - Math.floor((b + 8) / 25) + 1) / 3) + 15) % 30;
  const l = (32 + 2 * (b % 4) + 2 * Math.floor(c / 4) - h - (c % 4)) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const n = h + l - 7 * m + 114;
  return new Date(year, Math.floor(n / 31) - 1, (n % 31) + 1);
}

// les 11 jours fériés de métropole, dans l'ordre
export function getHolidays(year: number): Holiday[] {
  const easter = getEaster(year);
  const fixed = (month: number, day: number) => formatIsoDate(new Date(year, month - 1, day));
  const afterEaster = (days: number) => formatIsoDate(new Date(year, easter.getMonth(), easter.getDate() + days));

  return [
    { date: fixed(1, 1), name: "Jour de l'an" },
    { date: afterEaster(1), name: 'Lundi de Pâques' },
    { date: fixed(5, 1), name: 'Fête du Travail' },
    { date: fixed(5, 8), name: 'Victoire 1945' },
    { date: afterEaster(39), name: 'Ascension' },
    { date: afterEaster(50), name: 'Lundi de Pentecôte' },
    { date: fixed(7, 14), name: 'Fête nationale' },
    { date: fixed(8, 15), name: 'Assomption' },
    { date: fixed(11, 1), name: 'Toussaint' },
    { date: fixed(11, 11), name: 'Armistice 1918' },
    { date: fixed(12, 25), name: 'Noël' },
  ].sort((x, y) => x.date.localeCompare(y.date));
}

export function getHoliday(date: Date): Holiday | undefined {
  const iso = formatIsoDate(date);
  return getHolidays(date.getFullYear()).find((holiday) => holiday.date === iso);
}

// rappel de l'accueil : férié aujourd'hui, sinon demain
export function formatHolidayReminder(now: Date): string | null {
  const today = getHoliday(now);
  if (today) return `Jour férié aujourd'hui : ${today.name}`;
  const tomorrow = getHoliday(new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1));
  return tomorrow ? `Demain, jour férié : ${tomorrow.name}` : null;
}
