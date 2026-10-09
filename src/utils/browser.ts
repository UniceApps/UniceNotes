import { router } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';

import { haptics } from './haptics';

// pages externes (aide, mentions…) : navigateur du système, sans quitter l'app
export async function openURL(url: string): Promise<void> {
  haptics('selection');
  await WebBrowser.openBrowserAsync(url);
}

// service de l'ENT : navigateur de l'app, dans l'onglet ENT ; from : onglet retrouvé à la fermeture
export function openEntApp(id: string, from?: 'home'): void {
  haptics('light');
  router.push({ pathname: '/ent/browser', params: from ? { app: id, from } : { app: id } });
}

// pages et documents affichés par la WebView ; le reste (mailto:, tel:, msteams:…) part vers le système
export function isWebViewUrl(url: string): boolean {
  return /^(https?|about|data|blob|javascript):/i.test(url);
}
