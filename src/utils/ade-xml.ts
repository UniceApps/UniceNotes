import type { AdeProgram, AdeRoom, RoomBooking } from '@/src/types';
import { isValidEdtCode } from '@/src/utils/deeplink';

const TAG_BODY = '((?:"[^"]*"|[^>"])*)';
const ROOM_TAG = new RegExp(`<room\\b${TAG_BODY}>`, 'g');
const TRAINEE_TAG = new RegExp(`<trainee\\b${TAG_BODY}>`, 'g');
const EVENT_TAG = new RegExp(`<event\\b${TAG_BODY}>`, 'g');
const RESOURCE_TAG = new RegExp(`<resource\\b${TAG_BODY}>`, 'g');

// entrées de l'arbre ADE qui ne sont pas des salles utilisables : corbeille, cours en ligne…
const NOT_A_ROOM =
  /corbeille|virtuel|distanciel|en ligne|online|zoom|[àa] distance|[àa] attribuer|r[ée]serve|\(test\)|ext[ée]rieur|hors campus/i;

const XML_ENTITIES: Record<string, string> = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'" };

function decodeXmlEntities(value: string): string {
  if (!value.includes('&')) return value;
  return value.replace(/&(#x[0-9a-f]+|#\d+|amp|lt|gt|quot|apos);/gi, (match, entity: string) => {
    if (entity[0] !== '#') return XML_ENTITIES[entity.toLowerCase()] ?? match;
    const hex = entity[1] === 'x' || entity[1] === 'X';
    const code = parseInt(entity.slice(hex ? 2 : 1), hex ? 16 : 10);
    return code <= 0x10ffff ? String.fromCodePoint(code) : match;
  });
}

function parseAttributes(source: string): Record<string, string> {
  const attributes: Record<string, string> = {};
  for (const [, key, value] of source.matchAll(/([\w:.-]+)="([^"]*)"/g)) {
    attributes[key] = decodeXmlEntities(value);
  }
  return attributes;
}

function assertNoAdeError(xml: string): void {
  if (xml.includes('<error')) throw new Error('ADE a renvoyé une erreur');
}

// "Valrose.Bâtiment. Fizeau." -> ["Valrose", "Bâtiment", "Fizeau"]
function splitPath(path: string | undefined): string[] {
  return (path ?? '')
    .split('.')
    .map((segment) => segment.trim())
    .filter(Boolean);
}

function parseHour(value: string | undefined): number | null {
  const match = value ? /^(\d{1,2}):(\d{2})$/.exec(value) : null;
  return match ? Number(match[1]) * 60 + Number(match[2]) : null;
}

// isGroup="true" (detail >= 4) distingue les dossiers (campus, bâtiments) des vraies salles
export function parseRooms(xml: string): AdeRoom[] {
  assertNoAdeError(xml);
  const rooms: AdeRoom[] = [];
  for (const [, source] of xml.matchAll(ROOM_TAG)) {
    const attributes = parseAttributes(source);
    const name = attributes.name?.trim();
    if (!attributes.id || !name || attributes.isGroup === 'true') continue;

    const path = splitPath(attributes.path);
    if (NOT_A_ROOM.test(name) || path.some((segment) => NOT_A_ROOM.test(segment))) continue;
    rooms.push({ id: attributes.id, name, path });
  }
  return rooms;
}

export interface ProgramEntry {
  program: AdeProgram;
  text: string;
}

function parseFaculty(path: string | undefined, parent: string | undefined): string | undefined {
  const suffix = `${parent}.`;
  if (!path || !parent || !path.endsWith(suffix)) return undefined;
  const faculty = path.slice(0, -suffix.length).replace(/\.$/, '').replace(/\.(?=\S)/g, ' › ').trim();
  return faculty || undefined;
}

export function parsePrograms(xml: string): ProgramEntry[] {
  assertNoAdeError(xml);
  const entries: ProgramEntry[] = [];
  for (const [, source] of xml.matchAll(TRAINEE_TAG)) {
    const { id, code, name: rawName, fatherName, path } = parseAttributes(source);
    const name = rawName?.trim();
    if (!id || !name || !isValidEdtCode(code)) continue;

    const faculty = parseFaculty(path, fatherName);
    entries.push({ program: { id, code, name, faculty }, text: [name, fatherName, faculty, code].join(' ') });
  }
  return entries;
}

// une réservation par salle d'un événement ; date au format JJ/MM/AAAA
export function parseBookings(xml: string, date: string): RoomBooking[] {
  assertNoAdeError(xml);
  const bookings: RoomBooking[] = [];
  let events = 0;
  let usable = 0;

  for (const match of xml.matchAll(EVENT_TAG)) {
    events++;
    const attributes = parseAttributes(match[1]);
    const start = parseHour(attributes.startHour);
    const end = parseHour(attributes.endHour);
    if (start === null || end === null || end <= start || attributes.date !== date) continue;
    usable++;

    // <event …/> sans ressources : rien à rattacher à une salle
    if (match[1].endsWith('/')) continue;
    const bodyStart = match.index + match[0].length;
    const bodyEnd = xml.indexOf('</event>', bodyStart);
    const body = xml.slice(bodyStart, bodyEnd === -1 ? undefined : bodyEnd);
    if (!body.includes('category="classroom"')) continue;

    const title = attributes.name?.trim() || 'Réservation';
    for (const [, resourceSource] of body.matchAll(RESOURCE_TAG)) {
      const resource = parseAttributes(resourceSource);
      if (resource.category === 'classroom' && resource.id) {
        bookings.push({ roomId: resource.id, title, start, end });
      }
    }
  }

  // ADE renvoie parfois des <event/> vides
  if (events > 0 && usable === 0) throw new Error('Événements ADE incomplets');
  return bookings;
}
