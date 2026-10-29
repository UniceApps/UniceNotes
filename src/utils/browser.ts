import { Linking } from 'react-native';

import { router } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';

import { getEntApp, type EntApp } from '@/src/constants/ent';

import { haptics } from './haptics';
import { withTimeout } from './network';

// adresse réelle d'un service derrière son portail, gardée pour la session
const sites = new Map<string, string>();

// pages externes (aide, mentions…) : navigateur du système, sans quitter l'app
export async function openURL(url: string): Promise<void> {
  haptics('selection');
  await WebBrowser.openBrowserAsync(url);
}

// suit la redirection du portail, HTTP ou balise meta refresh
async function resolveSite(url: string): Promise<string | null> {
  const known = sites.get(url);
  if (known) return known;
  const site = await withTimeout(2000, async (signal) => {
    const response = await fetch(url, { signal });
    const refresh = /http-equiv=["']refresh["'][^>]*url=["']?([^"'>\s]+)/i.exec(await response.text());
    return (refresh?.[1] ?? response.url).replace(/\/$/, '');
  });
  if (site) sites.set(url, site);
  return site;
}

async function nativeUrl(app: EntApp): Promise<string | null> {
  if (!app.native?.includes('{site}')) return app.native ?? null;
  const site = await resolveSite(app.url);
  return site ? app.native.replace('{site}', site) : null;
}

// ouvre l'app native du service ; false si elle n'est pas installée ou n'existe pas
export async function openNativeApp(id: string): Promise<boolean> {
  const app = getEntApp(id);
  const url = app ? await nativeUrl(app) : null;
  if (!url) return false;
  return Linking.openURL(url).then(
    () => true,
    () => false,
  );
}

// service de l'ENT : son app native, sinon le navigateur de l'app dans l'onglet ENT ; from : onglet retrouvé à la fermeture
export async function openEntApp(id: string, from?: 'home'): Promise<void> {
  haptics('light');
  if (await openNativeApp(id)) return;
  router.push({ pathname: '/ent/browser', params: from ? { app: id, from } : { app: id } });
}

// pages et documents affichés par la WebView ; le reste (mailto:, tel:, msteams:…) part vers le système
export function isWebViewUrl(url: string): boolean {
  return /^(https?|about|data|blob|javascript):/i.test(url);
}
