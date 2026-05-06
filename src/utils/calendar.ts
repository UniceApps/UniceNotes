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
