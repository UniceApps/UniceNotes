import { useEffect, useRef, useState } from 'react';

import { loadRoomsSnapshot } from '@/src/services/rooms';
import type { RoomsSnapshot } from '@/src/types';
import { MINUTE_MS } from '@/src/utils/date';
import { getParisClock, type ParisClock } from '@/src/utils/rooms';

import { useNow } from './useNow';

// au-delà, les réservations sont retéléchargées
const STALE_AFTER_MS = 15 * MINUTE_MS;
// garde-fou : jamais deux actualisations automatiques à moins de 5 s d'écart
const MIN_REFRESH_DELAY_MS = 5 * 1000;

interface RoomsSnapshotState {
  // réservations du jour, null tant qu'elles ne sont pas chargées ou si elles datent d'un autre jour
  snapshot: RoomsSnapshot | null;
  clock: ParisClock;
  loading: boolean;
  failed: boolean;
  reload: () => void;
}

// statuts recalculés avec l'heure ; active : ne charge et ne rafraîchit qu'à l'écran
export function useRoomsSnapshot(active = true): RoomsSnapshotState {
  const [snapshot, setSnapshot] = useState<RoomsSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [fetchKey, setFetchKey] = useState(0);
  const now = useNow();
  // dernière requête lancée : quitter l'onglet n'annule pas celle en cours
  const requestedKey = useRef<number | null>(null);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  useEffect(() => {
    if (!active || requestedKey.current === fetchKey) return;
    const key = fetchKey;
    requestedKey.current = key;
    loadRoomsSnapshot().then((result) => {
      // démonté, ou une requête plus récente a été lancée entre-temps
      if (!mounted.current || requestedKey.current !== key) return;
      if (result) setSnapshot(result);
      setFailed(result === null);
      setLoading(false);
    });
  }, [active, fetchKey]);

  const clock = getParisClock(now);
  const usable = snapshot && snapshot.date === clock.eventDate ? snapshot : null;

  // actualisation automatique, seulement quand l'écran est affiché
  useEffect(() => {
    if (!active || !snapshot || failed) return;
    const delay = usable ? snapshot.fetchedAt + STALE_AFTER_MS - Date.now() : 0;
    const timer = setTimeout(() => setFetchKey((key) => key + 1), Math.max(delay, MIN_REFRESH_DELAY_MS));
    return () => clearTimeout(timer);
  }, [active, snapshot, usable, failed]);

  function reload() {
    setLoading(true);
    setFetchKey((key) => key + 1);
  }

  return { snapshot: usable, clock, loading, failed, reload };
}
