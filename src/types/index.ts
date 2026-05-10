export interface CalendarEvent {
  id: string;
  start: { dateTime: string };
  end: { dateTime: string };
  title: string;
  subtitle: string;
  description: string;
  color: string;
}

export interface SearchResult {
  id: string;
  text: string;
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
}

export type HapticIntensity =
  | 'light'
  | 'medium'
  | 'heavy'
  | 'error'
  | 'success'
  | 'warning'
  | 'selection';
