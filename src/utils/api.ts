import * as WebBrowser from 'expo-web-browser';
import { haptics } from './haptics';

export async function handleURL(url: string): Promise<void> {
  haptics('selection');
  await WebBrowser.openBrowserAsync(url);
}