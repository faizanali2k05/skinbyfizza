import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * SecureStore isn't available on web; fall back to AsyncStorage there.
 * Tokens are sensitive, so native uses the encrypted keystore/keychain.
 */
const isWeb = Platform.OS === 'web';

export async function setItem(key: string, value: string): Promise<void> {
  if (isWeb) return AsyncStorage.setItem(key, value);
  return SecureStore.setItemAsync(key, value);
}

export async function getItem(key: string): Promise<string | null> {
  if (isWeb) return AsyncStorage.getItem(key);
  return SecureStore.getItemAsync(key);
}

export async function deleteItem(key: string): Promise<void> {
  if (isWeb) return AsyncStorage.removeItem(key);
  return SecureStore.deleteItemAsync(key);
}

export const KEYS = {
  token: 'auth.token',
  refresh: 'auth.refresh',
  user: 'auth.user',
} as const;
