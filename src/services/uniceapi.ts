import { API_URL } from '../constants/config';

export interface ApiAlert {
  title: string;
  message: string;
}

export interface ApiStatus {
  version: string | null;
  alert: ApiAlert | null;
}

const FETCH_TIMEOUT_MS = 2000;

export async function fetchApiStatus(): Promise<ApiStatus | null> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const res = await fetch(API_URL, {
      signal: controller.signal,
      headers: { Accept: 'application/json' },
    });
    if (!res.ok) return null;
    return parseApiStatus(await res.json());
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

export function parseApiStatus(json: unknown): ApiStatus | null {
  if (typeof json !== 'object' || json === null) return null;
  const data = json as Record<string, unknown>;

  return {
    version: typeof data.version === 'string' && data.version.trim() !== '' ? data.version.trim() : null,
    alert: parseAlert(data.alert),
  };
}

function parseAlert(raw: unknown): ApiAlert | null {
  if (typeof raw !== 'object' || raw === null) return null;
  const data = raw as Record<string, unknown>;

  const title = typeof data.title === 'string' ? data.title.trim() : '';
  const message = typeof data.message === 'string' ? data.message.trim() : '';
  if (title === '' && message === '') return null;

  return { title: title || 'Information', message };
}

export function compareVersions(a: string, b: string): number {
  const pa = toNumericParts(a);
  const pb = toNumericParts(b);
  const len = Math.max(pa.length, pb.length);

  for (let i = 0; i < len; i++) {
    const diff = (pa[i] ?? 0) - (pb[i] ?? 0);
    if (diff !== 0) return diff;
  }
  return 0;
}

function toNumericParts(version: string): number[] {
  return version
    .trim()
    .replace(/^v/i, '')
    .split('.')
    .map((part) => {
      const n = parseInt(part, 10);
      return Number.isNaN(n) ? 0 : n;
    });
}

/** true si la version installée est < à la version actuelle */
export function isUpdateAvailable(installed: string, latest: string | null): boolean {
  if (!latest) return false;
  return compareVersions(installed, latest) < 0;
}
