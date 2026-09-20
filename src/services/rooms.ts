import type { AdeRoom, RoomsSnapshot } from '../types';

import { parseBookings, parseRooms } from '../utils/ade-xml';
import { getParisClock } from '../utils/rooms';
import { ADE_BASE, disconnectSession, edtService, fetchSessionId } from './edt';

// ADE ne compresse pas ses réponses : les événements d'une journée pèsent environ 2 Mo
export const ROOMS_FETCH_TIMEOUT_MS = 20000;

// l'arbre des salles change rarement : gardé en mémoire pour ne pas le retélécharger à chaque rafraîchissement
let roomsCache: { projectId: string; rooms: AdeRoom[] } | null = null;

async function adeRequest(
  sessionId: string,
  params: Record<string, string>,
  signal: AbortSignal,
): Promise<string> {
  const query = Object.entries({ ...params, sessionId })
    .map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
    .join('&');
  const res = await fetch(`${ADE_BASE}/jsp/webapi?${query}`, { signal });
  if (!res.ok) throw new Error(`ADE ${res.status}`);
  return res.text();
}

async function fetchSnapshot(signal: AbortSignal): Promise<RoomsSnapshot | null> {
  const projectId = await edtService.ensureProject();
  if (!projectId) return null;

  const sessionId = await fetchSessionId();
  if (!sessionId) return null;

  try {
    const clock = getParisClock();

    // getResources et getEvents ne répondent qu'une fois le projet choisi pour la session
    const project = await adeRequest(sessionId, { function: 'setProject', projectId }, signal);
    if (!project.includes('<setProject')) return null;

    let rooms = roomsCache?.projectId === projectId ? roomsCache.rooms : null;
    if (!rooms) {
      // detail=4 : ajoute isGroup, qui distingue les dossiers (campus, bâtiments) des salles
      const resources = await adeRequest(
        sessionId,
        { function: 'getResources', category: 'classroom', detail: '4' },
        signal,
      );
      rooms = parseRooms(resources);
      if (rooms.length === 0) return null;
      roomsCache = { projectId, rooms };
    }

    // toutes les réservations du jour en une requête
    const events = await adeRequest(
      sessionId,
      { function: 'getEvents', date: clock.apiDate, detail: '8' },
      signal,
    );
    const bookings = parseBookings(events, clock.eventDate);
    return { rooms, bookings, date: clock.eventDate, fetchedAt: Date.now() };
  } catch {
    return null;
  } finally {
    void disconnectSession(sessionId);
  }
}

// null si ADE est indisponible ou renvoie des données inexploitables
export async function loadRoomsSnapshot(): Promise<RoomsSnapshot | null> {
  const controller = new AbortController();
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<null>((resolve) => {
    timer = setTimeout(() => {
      controller.abort();
      resolve(null);
    }, ROOMS_FETCH_TIMEOUT_MS);
  });
  try {
    return await Promise.race([fetchSnapshot(controller.signal), timeout]);
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}
