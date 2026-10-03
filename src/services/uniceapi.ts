import { API_URL } from '@/src/constants/config';
import { withTimeout } from '@/src/utils/network';

export interface ApiAlert {
  title: string;
  message: string;
}

export interface ApiStatus {
  // dernière version publiée sur les stores
  version: string | null;
  alert: ApiAlert | null;
}

const STATUS_TIMEOUT_MS = 3000;

function readString(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function parseStatus(json: unknown): ApiStatus | null {
  if (typeof json !== 'object' || json === null) return null;
  const data = json as Record<string, unknown>;
  const alert = (typeof data.alert === 'object' && data.alert !== null ? data.alert : {}) as Record<string, unknown>;
  const title = readString(alert.title);
  const message = readString(alert.message);

  return {
    version: readString(data.version) || null,
    alert: title || message ? { title: title || 'Information', message } : null,
  };
}

export function fetchApiStatus(): Promise<ApiStatus | null> {
  return withTimeout(STATUS_TIMEOUT_MS, async (signal) => {
    const res = await fetch(API_URL, { signal, headers: { Accept: 'application/json' } });
    return res.ok ? parseStatus(await res.json()) : null;
  });
}

// "v3.10.0" -> [3, 10, 0]
function toNumbers(version: string): number[] {
  return version
    .replace(/^v/i, '')
    .split('.')
    .map((part) => parseInt(part, 10) || 0);
}

// true si la version installée est plus ancienne que la dernière publiée
export function isUpdateAvailable(installed: string, latest: string | null): boolean {
  if (!latest) return false;
  const a = toNumbers(installed);
  const b = toNumbers(latest);
  for (let i = 0; i < Math.max(a.length, b.length); i++) {
    const diff = (a[i] ?? 0) - (b[i] ?? 0);
    if (diff !== 0) return diff < 0;
  }
  return false;
}
