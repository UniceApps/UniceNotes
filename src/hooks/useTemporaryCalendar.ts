import { useEffect, useState } from 'react';

import { fetchCalendar } from '@/src/services/edt';
import type { CalendarEvent } from '@/src/types';

// edt d'un autre code ADE (lien unicenotes://edt/{code}), en lecture seule et jamais mis en cache
export function useTemporaryCalendar(code: string | null) {
  const [attempt, setAttempt] = useState(0);
  const [result, setResult] = useState<{ key: string; events: CalendarEvent[] | null } | null>(null);
  const key = `${code}:${attempt}`;

  useEffect(() => {
    if (!code) return;
    let cancelled = false;
    fetchCalendar(code).then((events) => {
      if (!cancelled) setResult({ key: `${code}:${attempt}`, events });
    });
    return () => {
      cancelled = true;
    };
  }, [code, attempt]);

  const loading = code !== null && result?.key !== key;
  return {
    events: result?.events ?? [],
    loading,
    failed: !loading && result?.events === null,
    retry: () => setAttempt((n) => n + 1),
  };
}
