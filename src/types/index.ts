export interface CalendarEvent {
  id: string;
  start: { dateTime: string };
  end: { dateTime: string };
  title: string;
  subtitle: string;
  description: string;
  color: string;
}

export interface EDTResult {
  events: CalendarEvent[];
  // true si les événements proviennent du cache
  offline: boolean;
}

export interface SearchResult {
  id: string;
  text: string;
}

export interface AdeProject {
  id: string;
  name: string;
}

export interface NextEvent {
  summary: string;
  location: string;
}

export interface WidgetClass {
  title: string;
  room: string;
  startTime: string;
  endTime: string;
}

export interface NextClassWidgetProps {
  courses: WidgetClass[];
  configured?: boolean;
}

export type HapticIntensity =
  | 'light'
  | 'medium'
  | 'heavy'
  | 'error'
  | 'success'
  | 'warning'
  | 'selection';
