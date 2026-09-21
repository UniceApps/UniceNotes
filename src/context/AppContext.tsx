import React, { createContext, useContext, useEffect, useState } from 'react';

import { File, Paths } from 'expo-file-system';
import * as SecureStore from 'expo-secure-store';
import { router } from 'expo-router';

import { APP_VERSION } from '../constants/config';
import { resetTheme } from '../constants/theme';
import type { CalendarEvent } from '../types';
import { setHapticsEnabled } from '../utils/haptics';
import { clearAsync, deleteSecure, getAsync, getSecure, removeAsync, saveAsync } from '../utils/storage';

interface AppContextValue {
  adeid: string | null;
  setAdeid: (v: string | null) => void;
  hapticsOn: boolean;
  setHapticsOn: (v: boolean) => void;
  calendar: CalendarEvent[];
  setCalendar: (v: CalendarEvent[]) => void;
  calendarOffline: boolean; // true si le calendrier affiché provient du cache local
  setCalendarOffline: (v: boolean) => void;
  clearAllData: () => Promise<void>;
  isInitialized: boolean;
  updateModalShown: boolean; // true if release notes were already shown for the current APP_VERSION
  setUpdateModalShown: (v: boolean) => void;
  onboarding: boolean; // true tant que l'OOBE est actif
  setOnboarding: (v: boolean) => void;
  oobeCompleted: boolean; // true si l'utilisateur a terminé l'OOBE
  setOobeCompleted: (v: boolean) => void;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [adeid, setAdeid] = useState<string | null>(null);
  const [hapticsOn, setHapticsOnState] = useState(true);
  const [calendar, setCalendar] = useState<CalendarEvent[]>([]);
  const [calendarOffline, setCalendarOffline] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [updateModalShown, setUpdateModalShown] = useState(false);
  const [onboarding, setOnboarding] = useState(false);
  const [oobeCompleted, setOobeCompletedState] = useState(false);

  useEffect(() => {
    loadPersistedData();
  }, []);

  async function loadPersistedData() {
    const [storedAdeid, storedHaptics, releaseNotesVersion, storedOobeCompleted] = await Promise.all([
      getSecure('adeid'),
      getAsync('haptics'),
      getAsync('releaseNotesVersion'),
      getAsync('oobeCompleted'),
    ]);

    if (storedAdeid) setAdeid(storedAdeid);
    if (storedHaptics !== null) {
      const h = storedHaptics === 'true';
      setHapticsOnState(h);
      setHapticsEnabled(h);
    }

    const edtConfigured = !!storedAdeid && storedAdeid !== 'demo';
    const oobeDone = storedOobeCompleted === 'true' || edtConfigured;
    if (oobeDone && storedOobeCompleted !== 'true') saveAsync('oobeCompleted', 'true');
    setOobeCompletedState(oobeDone);

    // release notes already shown only if they were shown for this exact version
    setUpdateModalShown(releaseNotesVersion === APP_VERSION);

    setIsInitialized(true);
  }

  function setHapticsOn(v: boolean) {
    setHapticsOnState(v);
    setHapticsEnabled(v);
  }

  function setOobeCompleted(v: boolean) {
    setOobeCompletedState(v);
    if (v) saveAsync('oobeCompleted', 'true');
    else removeAsync('oobeCompleted');
  }

  async function clearAllData() {
    await Promise.all([
      deleteSecure('adeid'),
      removeAsync('haptics'),
      removeAsync('releaseNotesVersion'),
      removeAsync('oobeCompleted'),
    ]);

    const calFile = new File(Paths.document, 'calendar.json');
    if (calFile.exists) {
    calFile.delete();
    }

    await clearAsync();

    setAdeid(null);
    setHapticsOn(true);
    setCalendar([]);
    setCalendarOffline(false);
    setUpdateModalShown(false);
    setOobeCompletedState(false);
    resetTheme();
    router.replace('/oobe'); // redirect to onboarding after data wipe
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
        calendarOffline,
        setCalendarOffline,
        clearAllData,
        isInitialized,
        updateModalShown,
        setUpdateModalShown,
        onboarding,
        setOnboarding,
        oobeCompleted,
        setOobeCompleted,
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
