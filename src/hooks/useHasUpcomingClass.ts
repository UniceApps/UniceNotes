import { useEffect, useMemo, useState } from 'react';
import { AppState } from 'react-native';

import { useCalendar } from '@/src/context/CalendarContext';
import { DAY_MS } from '@/src/utils/date';

// il reste au moins un cours : ne rerend qu'au moment où ça change, pas à chaque tic d'horloge
// (la barre d'onglets en dépend, la redessiner toutes les 30 s redessinerait chaque onglet)
export function useHasUpcomingClass(): boolean {
  const { events } = useCalendar();
  const lastEnd = useMemo(
    () => events.reduce((latest, event) => Math.max(latest, new Date(event.end.dateTime).getTime() || 0), 0),
    [events],
  );
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (lastEnd <= now) return;
    // les minuteries ne dépassent pas 24 jours : réévalué au moins une fois par jour
    const timer = setTimeout(() => setNow(Date.now()), Math.min(lastEnd - now + 1000, DAY_MS));
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') setNow(Date.now());
    });
    return () => {
      clearTimeout(timer);
      subscription.remove();
    };
  }, [lastEnd, now]);

  return lastEnd > now;
}
