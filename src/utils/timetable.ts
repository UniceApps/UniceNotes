// ramène l'onglet EDT à aujourd'hui : onglet touché à nouveau, widget, Siri
const listeners = new Set<() => void>();

export function showTimetableToday(): void {
  listeners.forEach((fn) => fn());
}

export function subscribeTimetableToday(fn: () => void): () => void {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}
