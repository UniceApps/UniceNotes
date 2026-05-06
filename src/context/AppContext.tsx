import React, { createContext, useContext, useState, useEffect } from 'react';
import * as SecureStore from 'expo-secure-store';
import { File, Paths } from 'expo-file-system';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { CalendarEvent } from '../types';
import { setHapticsEnabled } from '../utils/haptics';

interface AppContextValue {
  adeid: string | null;
  setAdeid: (v: string | null) => void;
  hapticsOn: boolean;
  setHapticsOn: (v: boolean) => void;
  calendar: CalendarEvent[];
  setCalendar: (v: CalendarEvent[]) => void;
  clearAllData: () => Promise<void>;
  isInitialized: boolean;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [adeid, setAdeid] = useState<string | null>(null);
  const [hapticsOn, setHapticsOnState] = useState(true);
  const [calendar, setCalendar] = useState<CalendarEvent[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    loadPersistedData();
  }, []);

  async function loadPersistedData() {
    const [storedAdeid, storedHaptics] = await Promise.all([
      SecureStore.getItemAsync('adeid'),
      AsyncStorage.getItem('haptics'),
    ]);

    if (storedAdeid) setAdeid(storedAdeid);
    if (storedHaptics !== null) {
      const h = storedHaptics === 'true';
      setHapticsOnState(h);
      setHapticsEnabled(h);
    }
    setIsInitialized(true);
  }

  function setHapticsOn(v: boolean) {
    setHapticsOnState(v);
    setHapticsEnabled(v);
  }

  async function clearAllData() {
    await Promise.all([
      SecureStore.deleteItemAsync('adeid'),
      AsyncStorage.removeItem('haptics'),
    ]);

    const calFile = new File(Paths.document, 'calendar.json');
    calFile.delete();

    await AsyncStorage.clear();

    setAdeid(null);
    setHapticsOn(true);
    setCalendar([]);
  }

  return (
    <AppContext.Provider
      value={{
        adeid,
        setAdeid,
        hapticsOn,
        setHapticsOn,
        calendar,
        setCalendar,
        clearAllData,
        isInitialized,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
