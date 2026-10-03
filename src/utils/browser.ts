import * as WebBrowser from 'expo-web-browser';

import { haptics } from './haptics';

// navigateur intégré, l'utilisateur reste dans l'app
export async function openURL(url: string): Promise<void> {
  haptics('selection');
  await WebBrowser.openBrowserAsync(url);
}
