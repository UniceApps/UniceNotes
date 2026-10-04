import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';

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

// trousseau iOS / keystore Android
export const secureStorage = {
  get: (key: SecureKey) => SecureStore.getItemAsync(key),
  set: (key: SecureKey, value: string) => SecureStore.setItemAsync(key, value),
  remove: (key: SecureKey) => SecureStore.deleteItemAsync(key),
};
