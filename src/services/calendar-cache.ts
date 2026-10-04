import { File, Paths } from 'expo-file-system';

import type { CalendarEvent } from '@/src/types';

const CACHE_FILE = new File(Paths.document, 'calendar.json');

export interface CachedCalendar {
  // identifiant ADE auquel appartient l'edt
  code: string;
  savedAt: number;
  events: CalendarEvent[];
}

// null si le cache appartient à un autre identifiant (ou date d'une version < 3.4)
export async function readCalendarCache(code: string): Promise<CachedCalendar | null> {
  try {
    const cache = JSON.parse(await CACHE_FILE.text()) as Partial<CachedCalendar>;
    const valid = cache.code === code && typeof cache.savedAt === 'number' && Array.isArray(cache.events);
    return valid ? (cache as CachedCalendar) : null;
  } catch {
    return null;
  }
}

export function writeCalendarCache(cache: CachedCalendar): void {
  try {
    CACHE_FILE.write(JSON.stringify(cache));
  } catch {
    // stockage plein : l'edt reste affiché, il ne sera juste pas dispo hors ligne
  }
}

export function clearCalendarCache(): void {
  try {
    if (CACHE_FILE.exists) CACHE_FILE.delete();
  } catch {}
}
