import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { AppState } from 'react-native';

// toutes les clés utilisées par l'app, voir .docs/DATA.md
export type StorageKey =
  | 'theme'
  | 'haptics'
  | 'liveActivities'
  | 'oobeCompleted'
  | 'releaseNotesVersion'
  | 'adeProjectOverride'
  | 'favoriteRooms'
  | 'pinnedApps'
  | 'androidWidgetTimeline';

export type SecureKey = 'adeid';

export const storage = {
  get: (key: StorageKey) => AsyncStorage.getItem(key),
  set: (key: StorageKey, value: string) => AsyncStorage.setItem(key, value),
  remove: (key: StorageKey) => AsyncStorage.removeItem(key),
  clear: () => AsyncStorage.clear(),
};

function nextActive(): Promise<void> {
  return new Promise((resolve) => {
    const subscription = AppState.addEventListener('change', (state) => {
      if (state !== 'active') return;
      subscription.remove();
      resolve();
    });
  });
}

// trousseau iOS / keystore Android
export const secureStorage = {
  // trousseau illisible si iOS pré-lance l'app appareil verrouillé : on relit au premier plan
  get: (key: SecureKey) =>
    SecureStore.getItemAsync(key).catch(async (error) => {
      if (AppState.currentState === 'active') throw error;
      await nextActive();
      return SecureStore.getItemAsync(key);
    }),
  set: (key: SecureKey, value: string) => SecureStore.setItemAsync(key, value),
  remove: (key: SecureKey) => SecureStore.deleteItemAsync(key),
};
