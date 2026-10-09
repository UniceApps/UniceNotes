import { useSyncExternalStore } from 'react';

import { storage } from '@/src/utils/storage';

// identifiants ADE des cours marqués comme DS, partagés hors de React : l'edt, l'accueil et les rappels les lisent
let exams: ReadonlySet<string> = new Set();
const listeners = new Set<() => void>();

function emit(next: ReadonlySet<string>): void {
  exams = next;
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function parse(raw: string | null): string[] {
  try {
    const value: unknown = JSON.parse(raw ?? '[]');
    return Array.isArray(value) ? value.filter((id): id is string => typeof id === 'string') : [];
  } catch {
    return [];
  }
}

// lu une seule fois, avant le premier rendu (voir app/_layout.tsx)
export async function loadExams(): Promise<void> {
  emit(new Set(parse(await storage.get('exams'))));
}

export function resetExams(): void {
  emit(new Set());
}

export function setExam(id: string, on: boolean): void {
  const next = new Set(exams);
  if (on) next.add(id);
  else next.delete(id);
  emit(next);
  storage.set('exams', JSON.stringify([...next]));
}

export function useExams(): ReadonlySet<string> {
  return useSyncExternalStore(subscribe, () => exams);
}
