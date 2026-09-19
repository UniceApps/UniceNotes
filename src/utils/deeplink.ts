// Liens profonds : unicenotes://notes, unicenotes://ent, unicenotes://edt et unicenotes://edt/{code}
// Tout ce qui vient de l'extérieur (raccourcis d'icône, URL du système) est validé ici, sans requête réseau :
// grammaire stricte, tout le reste est ignoré.

export type DeepLink =
  | { kind: 'notes' }
  | { kind: 'ent' }
  | { kind: 'edt'; code?: string };

export const EDT_CODE_MAX_LENGTH = 32;

// codes ADE attendus : numéro étudiant (22209198) ou cursus (EIIN3-151-VET)
const EDT_CODE_PATTERN = new RegExp(`^[A-Za-z0-9_-]{1,${EDT_CODE_MAX_LENGTH}}$`);

export function isValidEdtCode(code: unknown): code is string {
  return typeof code === 'string' && EDT_CODE_PATTERN.test(code);
}

// ni query string ni fragment ni segment en trop, un "/" final est toléré
const LINK_PATTERN = /^unicenotes:\/\/(notes|ent|edt)(?:\/([^/?#]+))?\/?$/i;
const RESERVED_HOST_PATTERN = /^unicenotes:\/\/(notes|ent|edt)(?:[/?#]|$)/i;

export function parseDeepLink(url: unknown): DeepLink | null {
  if (typeof url !== 'string') return null;
  const match = LINK_PATTERN.exec(url);
  if (!match) return null;

  const host = match[1].toLowerCase();
  const segment = match[2];

  if (host === 'edt') {
    if (segment === undefined) return { kind: 'edt' };
    return isValidEdtCode(segment) ? { kind: 'edt', code: segment } : null;
  }
  if (segment !== undefined) return null;
  return host === 'notes' ? { kind: 'notes' } : { kind: 'ent' };
}

// l'URL vise l'un de nos liens, valide ou non : le routeur ne doit jamais la traiter lui-même
export function isDeepLinkUrl(url: unknown): boolean {
  return typeof url === 'string' && RESERVED_HOST_PATTERN.test(url);
}

// ---
// Lien en attente, lu par le DeepLinkHandler via useSyncExternalStore
// ---

let pending: DeepLink | null = null;
const subscribers = new Set<() => void>();

function notify(): void {
  subscribers.forEach((fn) => fn());
}

// le lien reste en attente tant que le handler ne l'a pas repris (démarrage à froid inclus), le dernier remplace le précédent
export function emitDeepLink(link: DeepLink): void {
  pending = link;
  notify();
}

export function subscribeDeepLink(fn: () => void): () => void {
  subscribers.add(fn);
  return () => {
    subscribers.delete(fn);
  };
}

export function peekDeepLink(): DeepLink | null {
  return pending;
}

export function takeDeepLink(): DeepLink | null {
  const link = pending;
  if (link) {
    pending = null;
    notify();
  }
  return link;
}
