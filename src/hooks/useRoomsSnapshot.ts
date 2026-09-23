import { useEffect, useState } from 'react';

import { loadRoomsSnapshot } from '@/src/services/rooms';
import type { RoomsSnapshot } from '@/src/types';
import { getParisClock, type ParisClock } from '@/src/utils/rooms';

// les statuts sont recalculés sans nouvelle requête
const TICK_MS = 30 * 1000;
// au-delà, les réservations sont retéléchargées
const STALE_AFTER_MS = 15 * 60 * 1000;
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

export function useRoomsSnapshot(): RoomsSnapshotState {
  const [snapshot, setSnapshot] = useState<RoomsSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [fetchKey, setFetchKey] = useState(0);
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    let cancelled = false;
    loadRoomsSnapshot().then((result) => {
      if (cancelled) return;
      if (result) setSnapshot(result);
      setFailed(result === null);
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [fetchKey]);

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), TICK_MS);
    return () => clearInterval(timer);
  }, []);

  const clock = getParisClock(now);
  const usable = snapshot && snapshot.date === clock.eventDate ? snapshot : null;

  // actualisation automatique
  useEffect(() => {
    if (!snapshot || failed) return;
    const delay = usable ? snapshot.fetchedAt + STALE_AFTER_MS - Date.now() : 0;
    const timer = setTimeout(() => setFetchKey((key) => key + 1), Math.max(delay, MIN_REFRESH_DELAY_MS));
    return () => clearTimeout(timer);
  }, [snapshot, usable, failed]);

  function reload() {
    setLoading(true);
    setFetchKey((key) => key + 1);
  }

  return { snapshot: usable, clock, loading, failed, reload };
}
