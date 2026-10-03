import { useEffect, useState } from 'react';
import { AppState } from 'react-native';

// heure courante, rafraîchie régulièrement et au retour dans l'app
export function useNow(intervalMs = 30 * 1000): Date {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), intervalMs);
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') setNow(new Date());
    });
    return () => {
      clearInterval(timer);
      subscription.remove();
    };
  }, [intervalMs]);

  return now;
}
