import { useEffect, useMemo, useState } from 'react';

import type { AdeRoom } from '@/src/types';
import { getAsync, saveAsync } from '@/src/utils/storage';

const FAVORITE_ROOMS_KEY = 'favoriteRooms';
export const MAX_FAVORITE_ROOMS = 3;

function parseIds(raw: string | null): string[] {
  try {
    const value: unknown = JSON.parse(raw ?? '[]');
    if (!Array.isArray(value)) return [];
    return value.filter((id): id is string => typeof id === 'string').slice(0, MAX_FAVORITE_ROOMS);
  } catch {
    return [];
  }
}

// rooms : salles connues
export function useFavoriteRooms(rooms: AdeRoom[] | undefined) {
  const [storedIds, setStoredIds] = useState<string[]>([]);

  useEffect(() => {
    getAsync(FAVORITE_ROOMS_KEY).then((raw) => setStoredIds(parseIds(raw)));
  }, []);

  const ids = useMemo(() => {
    if (!rooms || rooms.length === 0) return storedIds;
    const known = new Set(rooms.map((room) => room.id));
    return storedIds.filter((id) => known.has(id));
  }, [rooms, storedIds]);

  function save(next: string[]) {
    setStoredIds(next);
    saveAsync(FAVORITE_ROOMS_KEY, JSON.stringify(next));
  }

  // false si la limite est atteinte
  function toggle(id: string): boolean {
    if (ids.includes(id)) {
      save(ids.filter((favorite) => favorite !== id));
      return true;
    }
    if (ids.length >= MAX_FAVORITE_ROOMS) return false;
    save([...ids, id]);
    return true;
  }

  return { ids, toggle };
}
