import { useSyncExternalStore } from 'react';

import { DEFAULT_PINNED_APPS, getEntApp } from '@/src/constants/ent';
import { storage } from '@/src/utils/storage';

// la 4e place de l'accès rapide ouvre l'ENT
export const MAX_PINNED_APPS = 3;

// partagé hors de React : l'accueil, l'onglet ENT, le navigateur et les raccourcis de l'icône le lisent
let pinned: string[] = DEFAULT_PINNED_APPS;
const listeners = new Set<() => void>();

function emit(next: string[]): void {
  pinned = next;
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

// null si rien n'est enregistré ; une liste vide reste un choix de l'utilisateur
function parse(raw: string | null): string[] | null {
  if (raw === null) return null;
  try {
    const value: unknown = JSON.parse(raw);
    if (!Array.isArray(value)) return null;
    // ignore les services retirés du catalogue et les doublons
    const ids = value.filter((id): id is string => getEntApp(id) !== undefined);
    return [...new Set(ids)].slice(0, MAX_PINNED_APPS);
  } catch {
    return null;
  }
}

// lu une seule fois, avant le premier rendu (voir app/_layout.tsx)
export async function loadPinnedApps(): Promise<void> {
  emit(parse(await storage.get('pinnedApps')) ?? DEFAULT_PINNED_APPS);
}

export function resetPinnedApps(): void {
  emit(DEFAULT_PINNED_APPS);
}

function save(next: string[]): void {
  emit(next);
  storage.set('pinnedApps', JSON.stringify(next));
}

// false si l'accès rapide est déjà complet
export function togglePinnedApp(id: string): boolean {
  if (pinned.includes(id)) {
    save(pinned.filter((pinnedId) => pinnedId !== id));
    return true;
  }
  if (pinned.length >= MAX_PINNED_APPS) return false;
  save([...pinned, id]);
  return true;
}

export function usePinnedApps(): string[] {
  return useSyncExternalStore(subscribe, () => pinned);
}
