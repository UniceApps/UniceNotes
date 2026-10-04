// emploi du temps

// start / end au format attendu par calendar-kit
export interface CalendarEvent {
  id: string;
  title: string;
  room: string;
  // description ADE : groupes, enseignants…
  notes: string;
  color: string;
  start: { dateTime: string };
  end: { dateTime: string };
}

// projet ADE, un par année scolaire
export interface AdeProject {
  id: string;
  name: string;
}

// cursus trouvé par la recherche ADE
export interface AdeProgram {
  id: string;
  name: string;
}

// widgets et Live Activity

export interface WidgetClass {
  title: string;
  room: string;
  startTime: string;
  endTime: string;
  color?: string;
  // fin du cours en ms
  endsAt?: number;
}

export interface NextClassWidgetProps {
  courses: WidgetClass[];
  configured?: boolean;
}

export interface WidgetTimelineEntry {
  date: Date;
  props: NextClassWidgetProps;
}

export interface ClassActivityProps {
  title: string;
  room: string;
  // début et fin en ms
  start: number;
  end: number;
  color?: string;
  // cours suivant le même jour
  next?: { title: string; room: string; startTime: string };
}

// salles libres

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

export type RoomStatusCounts = Record<RoomStatus, number>;

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
