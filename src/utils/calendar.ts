import { File, Paths } from 'expo-file-system';
import type { CalendarEvent } from '../types';

const CALENDAR_FILE = new File(Paths.document, 'calendar.json');

export async function getCalendarFromCache(): Promise<CalendarEvent[]> {
  try {
    const json = await CALENDAR_FILE.text();
    return JSON.parse(json) as CalendarEvent[];
  } catch {
    return [];
  }
}

export async function saveCalendarToFile(data: CalendarEvent[]): Promise<void> {
  try {
    CALENDAR_FILE.write(JSON.stringify(data));
  } catch {}
}

// date de la dernière synchronisation réussie, null sans cache
export function getCalendarCacheTime(): number | null {
  try {
    return CALENDAR_FILE.exists ? (CALENDAR_FILE.info().modificationTime ?? null) : null;
  } catch {
    return null;
  }
}

// l'edt en cache appartient à l'ancien identifiant
export function clearCalendarCache(): void {
  try {
    if (CALENDAR_FILE.exists) CALENDAR_FILE.delete();
  } catch {}
}
