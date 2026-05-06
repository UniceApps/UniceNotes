import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';

export async function saveSecure(key: string, value: string): Promise<void> {
  await SecureStore.setItemAsync(key, value);
}

export async function getSecure(key: string): Promise<string | null> {
  return SecureStore.getItemAsync(key);
}

export async function deleteSecure(key: string): Promise<void> {
  await SecureStore.deleteItemAsync(key);
}

export async function saveAsync(key: string, value: string): Promise<void> {
  await AsyncStorage.setItem(key, value);
}

export async function getAsync(key: string): Promise<string | null> {
  return AsyncStorage.getItem(key);
}

export async function removeAsync(key: string): Promise<void> {
  await AsyncStorage.removeItem(key);
}

export async function clearAsync(): Promise<void> {
  await AsyncStorage.clear();
}
