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

// ---
// Salles libres
// ---

export interface AdeRoom {
  id: string;
  name: string;
  // chemin ADE : campus, bâtiment, sous-bâtiment… (["INSPE", "Liégeard"])
  path: string[];
}

export interface RoomBooking {
  roomId: string;
  title: string;
  // minutes depuis minuit, heure de Paris
  start: number;
  end: number;
}

export interface RoomsSnapshot {
  rooms: AdeRoom[];
  bookings: RoomBooking[];
  date: string;
  fetchedAt: number;
}

export interface RoomNode {
  key: string;
  name: string;
  children: RoomNode[];
  // salles rattachées directement à ce niveau
  rooms: AdeRoom[];
}

export type RoomStatus = 'free' | 'tight' | 'busy';

export interface RoomAvailability {
  status: RoomStatus;
  // busy : réservation en cours (ou qui commence dans la foulée), free / tight : prochaine réservation
  booking: RoomBooking | null;
  // busy : heure à partir de laquelle la salle est libre pour la durée voulue
  freeFrom: number | null;
  // free / tight : début de la prochaine réservation, null s'il n'y en a plus aujourd'hui
  freeUntil: number | null;
}

export interface RoomStatusCounts {
  free: number;
  tight: number;
  busy: number;
}

export interface RoomEntry {
  room: AdeRoom;
  availability: RoomAvailability;
}

export interface RoomNodeView {
  key: string;
  name: string;
  counts: RoomStatusCounts;
  children: RoomNodeView[];
  rooms: RoomEntry[];
}

export type HapticIntensity =
  | 'light'
  | 'medium'
  | 'heavy'
  | 'error'
  | 'success'
  | 'warning'
  | 'selection';
