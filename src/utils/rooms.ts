import type {
  AdeRoom,
  RoomAvailability,
  RoomBooking,
  RoomEntry,
  RoomNode,
  RoomNodeView,
  RoomStatus,
  RoomStatusCounts,
} from '../types';

// Durées proposées
export const DURATION_OPTIONS = [30, 60, 90, 120, 180, 240];

// Marge exigée en plus de la durée voulue pour qu'une salle soit « libre » (sinon « juste »)
export const ROOM_MARGIN_MIN = 30;

// Deux réservations séparées d'au plus ce délai forment un seul bloc
const CHANGEOVER_MIN = 15;

const OTHER_ROOMS = 'Autres salles';
const KEY_SEPARATOR = '\u001f';

// ---
// Heure de Paris : ADE écrit les heures des événements dans le fuseau du campus
// ---

export interface ParisClock {
  // minutes depuis minuit
  minutes: number;
  // MM/JJ/AAAA, format attendu par getEvents
  apiDate: string;
  // JJ/MM/AAAA, format des événements renvoyés
  eventDate: string;
}

export function getParisClock(now: Date = new Date()): ParisClock {
  const pad = (n: number) => String(n).padStart(2, '0');
  let year = now.getFullYear();
  let month = now.getMonth() + 1;
  let day = now.getDate();
  let hour = now.getHours();
  let minute = now.getMinutes();

  try {
    const parts = new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Europe/Paris',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hourCycle: 'h23',
    }).formatToParts(now);
    const read = (type: string) => Number(parts.find((p) => p.type === type)?.value);
    const paris = [read('year'), read('month'), read('day'), read('hour') % 24, read('minute')];
    if (paris.every(Number.isFinite)) [year, month, day, hour, minute] = paris;
  } catch {
    // Intl indisponible : heure de l'appareil
  }

  return {
    minutes: hour * 60 + minute,
    apiDate: `${pad(month)}/${pad(day)}/${year}`,
    eventDate: `${pad(day)}/${pad(month)}/${year}`,
  };
}

// 845 -> "14:05"
export function formatTime(minutes: number): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${pad(Math.floor(minutes / 60) % 24)}:${pad(minutes % 60)}`;
}

// 30 -> "30 min", 60 -> "1 h", 90 -> "1 h 30"
export function formatDuration(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m} min`;
  return m === 0 ? `${h} h` : `${h} h ${String(m).padStart(2, '0')}`;
}

// ---
// Arbre campus -> bâtiment -> sous-bâtiment -> salle, d'après le chemin ADE
// ---

function compareNames(a: string, b: string): number {
  return a.localeCompare(b, 'fr', { numeric: true, sensitivity: 'base' });
}

function sortNode(node: RoomNode): void {
  node.children.sort((a, b) => compareNames(a.name, b.name));
  node.rooms.sort((a, b) => compareNames(a.name, b.name));
  node.children.forEach(sortNode);
}

export function buildRoomTree(rooms: AdeRoom[]): RoomNode[] {
  const roots: RoomNode[] = [];
  const nodes = new Map<string, RoomNode>();

  for (const room of rooms) {
    let siblings = roots;
    let node: RoomNode | undefined;
    let key = '';

    for (const name of room.path.length > 0 ? room.path : [OTHER_ROOMS]) {
      key = key ? key + KEY_SEPARATOR + name : name;
      node = nodes.get(key);
      if (!node) {
        node = { key, name, children: [], rooms: [] };
        nodes.set(key, node);
        siblings.push(node);
      }
      siblings = node.children;
    }
    node?.rooms.push(room);
  }

  roots.sort((a, b) => compareNames(a.name, b.name));
  roots.forEach(sortNode);
  return roots;
}

// ---
// Disponibilité
// ---

export function groupBookingsByRoom(bookings: RoomBooking[]): Map<string, RoomBooking[]> {
  const byRoom = new Map<string, RoomBooking[]>();
  for (const booking of bookings) {
    const list = byRoom.get(booking.roomId);
    if (list) list.push(booking);
    else byRoom.set(booking.roomId, [booking]);
  }
  byRoom.forEach((list) => list.sort((a, b) => a.start - b.start));
  return byRoom;
}

interface Block {
  start: number;
  end: number;
  bookings: RoomBooking[];
}

function mergeBookings(sorted: RoomBooking[]): Block[] {
  const blocks: Block[] = [];
  for (const booking of sorted) {
    const last = blocks[blocks.length - 1];
    if (last && booking.start - last.end <= CHANGEOVER_MIN) {
      last.end = Math.max(last.end, booking.end);
      last.bookings.push(booking);
    } else {
      blocks.push({ start: booking.start, end: booking.end, bookings: [booking] });
    }
  }
  return blocks;
}

// bookings : réservations d'une seule salle, triées par début.
// now : minutes depuis minuit. duration : durée voulue, en minutes.
export function getRoomAvailability(
  bookings: RoomBooking[],
  now: number,
  duration: number,
): RoomAvailability {
  const blocks = mergeBookings(bookings);
  const currentIndex = blocks.findIndex((b) => b.start <= now && now < b.end);

  if (currentIndex !== -1) {
    const current = blocks[currentIndex];
    // réservation en cours, sinon celle qui suit dans la foulée (changement de cours)
    const booking =
      current.bookings.find((b) => b.start <= now && now < b.end) ??
      current.bookings.find((b) => b.start > now) ??
      current.bookings[current.bookings.length - 1];

    // première plage assez longue après le bloc en cours
    let freeFrom = current.end;
    for (let i = currentIndex + 1; i < blocks.length; i++) {
      if (blocks[i].start - freeFrom >= duration) break;
      freeFrom = blocks[i].end;
    }
    return { status: 'busy', booking, freeFrom, freeUntil: null };
  }

  const next = blocks.find((b) => b.start > now);
  const window = next ? next.start - now : Infinity;
  return {
    status: window >= duration + ROOM_MARGIN_MIN ? 'free' : 'tight',
    booking: next?.bookings[0] ?? null,
    freeFrom: null,
    freeUntil: next?.start ?? null,
  };
}

export function describeAvailability(
  availability: RoomAvailability,
  now: number,
  duration: number,
): { headline: string; detail: string | null } {
  const { status, booking, freeFrom, freeUntil } = availability;

  if (status === 'busy') {
    const detail = !booking
      ? null
      : booking.start > now
        ? `Cours à ${formatTime(booking.start)} · ${booking.title}`
        : booking.title;
    return { headline: `Occupée · libre à ${formatTime(freeFrom ?? now)}`, detail };
  }

  const detail = booking ? `Ensuite : ${booking.title}` : null;
  if (freeUntil === null) return { headline: 'Libre jusqu\'à la fin de la journée', detail };

  const window = freeUntil - now;
  if (status === 'tight' && window < duration) {
    return {
      headline: `Libre ${formatDuration(window)} seulement · jusqu'à ${formatTime(freeUntil)}`,
      detail,
    };
  }
  return {
    headline: `Libre jusqu'à ${formatTime(freeUntil)}${status === 'tight' ? ' · marge courte' : ''}`,
    detail: status === 'tight' ? detail : null,
  };
}

// ---
// Vue affichée : arbre trié par disponibilité, avec le décompte de chaque niveau
// ---

const STATUS_RANK: Record<RoomStatus, number> = { free: 0, tight: 1, busy: 2 };

// libres d'abord (plage la plus longue en premier), puis « justes », puis occupées (bientôt libres en premier)
function compareEntries(a: RoomEntry, b: RoomEntry): number {
  const x = a.availability;
  const y = b.availability;
  if (x.status !== y.status) return STATUS_RANK[x.status] - STATUS_RANK[y.status];

  const diff =
    x.status === 'busy'
      ? (x.freeFrom ?? 0) - (y.freeFrom ?? 0)
      : (y.freeUntil ?? Infinity) - (x.freeUntil ?? Infinity);
  return diff || compareNames(a.room.name, b.room.name);
}

const NO_BOOKINGS: RoomBooking[] = [];

export function buildRoomView(
  tree: RoomNode[],
  bookingsByRoom: Map<string, RoomBooking[]>,
  now: number,
  duration: number,
): RoomNodeView[] {
  const build = (node: RoomNode): RoomNodeView => {
    const counts: RoomStatusCounts = { free: 0, tight: 0, busy: 0 };

    const rooms = node.rooms
      .map((room) => ({
        room,
        availability: getRoomAvailability(bookingsByRoom.get(room.id) ?? NO_BOOKINGS, now, duration),
      }))
      .sort(compareEntries);
    rooms.forEach((entry) => counts[entry.availability.status]++);

    const children = node.children.map(build);
    children.forEach((child) => {
      counts.free += child.counts.free;
      counts.tight += child.counts.tight;
      counts.busy += child.counts.busy;
    });
    return { key: node.key, name: node.name, counts, children, rooms };
  };
  return tree.map(build);
}

// ne garde que les salles libres (pastille verte)
export function keepFree(views: RoomNodeView[]): RoomNodeView[] {
  return views.flatMap((view) => {
    const children = keepFree(view.children);
    const rooms = view.rooms.filter((entry) => entry.availability.status === 'free');
    const counts: RoomStatusCounts = { free: view.counts.free, tight: 0, busy: 0 };
    return children.length + rooms.length > 0 ? [{ ...view, counts, children, rooms }] : [];
  });
}
