import type { AdeRoom, RoomsSnapshot } from '@/src/types';
import { parseBookings, parseRooms } from '@/src/utils/ade-xml';
import { withTimeout } from '@/src/utils/network';
import { getParisClock } from '@/src/utils/rooms';

import { adeRequest, closeSession, getCurrentProject, openSession } from './ade';

// ADE ne compresse pas ses réponses : les événements d'une journée pèsent environ 2 Mo
const ROOMS_TIMEOUT_MS = 20000;

// l'arbre des salles change rarement : gardé en mémoire pour ne pas le retélécharger à chaque actualisation
let roomsCache: { projectId: string; rooms: AdeRoom[] } | null = null;

async function fetchSnapshot(projectId: string, signal: AbortSignal): Promise<RoomsSnapshot | null> {
  const sessionId = await openSession(signal);
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
    const events = await adeRequest(sessionId, { function: 'getEvents', date: clock.apiDate, detail: '8' }, signal);
    const bookings = parseBookings(events, clock.eventDate);
    return { rooms, bookings, date: clock.eventDate, fetchedAt: Date.now() };
  } finally {
    closeSession(sessionId);
  }
}

// null si ADE est indisponible ou renvoie des données inexploitables
export async function loadRoomsSnapshot(): Promise<RoomsSnapshot | null> {
  const project = await getCurrentProject();
  if (!project) return null;
  return withTimeout(ROOMS_TIMEOUT_MS, (signal) => fetchSnapshot(project.id, signal));
}
