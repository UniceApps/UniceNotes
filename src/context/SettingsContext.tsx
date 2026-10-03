import { createContext, useContext, useState, type ReactNode } from 'react';

import { clearCalendarCache } from '@/src/services/calendar-cache';
import { resetTheme } from '@/src/theme';
import { setHapticsEnabled } from '@/src/utils/haptics';
import { secureStorage, storage } from '@/src/utils/storage';

export interface Settings {
  // numéro étudiant ou cursus (suffixe -VET), null tant que l'edt n'est pas configuré
  adeid: string | null;
  haptics: boolean;
  liveActivities: boolean;
  oobeCompleted: boolean;
}

interface SettingsContextValue extends Settings {
  setAdeid: (adeid: string) => void;
  setHaptics: (on: boolean) => void;
  setLiveActivities: (on: boolean) => void;
  setOobeCompleted: (done: boolean) => void;
  clearAllData: () => Promise<void>;
}

const DEFAULT_SETTINGS: Settings = { adeid: null, haptics: true, liveActivities: true, oobeCompleted: false };

const SettingsContext = createContext<SettingsContextValue | null>(null);

// lu une seule fois, avant le premier rendu (voir app/_layout.tsx)
export async function loadSettings(): Promise<Settings> {
  const [adeid, haptics, liveActivities, oobeCompleted] = await Promise.all([
    secureStorage.get('adeid'),
    storage.get('haptics'),
    storage.get('liveActivities'),
    storage.get('oobeCompleted'),
  ]);

  // "demo" : ancien marqueur « non configuré » des versions < 3.4
  const code = adeid && adeid !== 'demo' ? adeid : null;
  setHapticsEnabled(haptics !== 'false');

  return {
    adeid: code,
    haptics: haptics !== 'false',
    liveActivities: liveActivities !== 'false',
    // un edt déjà configuré vient d'une version sans configuration initiale
    oobeCompleted: oobeCompleted === 'true' || code !== null,
  };
}

// chaque réglage est enregistré dès qu'il change
export function SettingsProvider({ initial, children }: { initial: Settings; children: ReactNode }) {
  const [settings, setSettings] = useState(initial);

  const update = (patch: Partial<Settings>) => setSettings((current) => ({ ...current, ...patch }));

  const value: SettingsContextValue = {
    ...settings,

    setAdeid(adeid) {
      update({ adeid });
      secureStorage.set('adeid', adeid);
    },

    setHaptics(on) {
      update({ haptics: on });
      setHapticsEnabled(on);
      storage.set('haptics', String(on));
    },

    setLiveActivities(on) {
      update({ liveActivities: on });
      storage.set('liveActivities', String(on));
    },

    setOobeCompleted(done) {
      update({ oobeCompleted: done });
      if (done) storage.set('oobeCompleted', 'true');
      else storage.remove('oobeCompleted');
    },

    async clearAllData() {
      await Promise.all([secureStorage.remove('adeid'), storage.clear()]);
      clearCalendarCache();
      resetTheme();
      setHapticsEnabled(true);
      setSettings(DEFAULT_SETTINGS);
    },
  };

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export function useSettings(): SettingsContextValue {
  const context = useContext(SettingsContext);
  if (!context) throw new Error('useSettings must be used within SettingsProvider');
  return context;
}
