import WebSession from '@/modules/web-session';
import { withTimeout } from '@/src/utils/network';

// Session des services de l'ENT ouverts dans le navigateur intégré. Sans le module natif
// (Expo Go, web), la WebView garde seulement ce que le système conserve de lui-même.
// Les délais : une opération WebKit restée sans réponse ne doit jamais bloquer l'interface.

let restoring: Promise<void> | null = null;

// une fois par lancement, avant le premier chargement d'une page
export function restoreWebSession(): Promise<void> {
  restoring ??= withTimeout(2000, async () => (WebSession ? WebSession.restoreAsync() : 0)).then(() => undefined);
  return restoring;
}

export function persistWebSession(): void {
  WebSession?.persistAsync().catch((error) => console.warn('[webSession] sauvegarde impossible', error));
}

// pour télécharger un fichier avec la session de la page
export function getCookieHeader(url: string): Promise<string | null> {
  return withTimeout(2000, async () => (WebSession ? WebSession.cookieHeaderAsync(url) : null));
}

// déconnecte tous les services et efface la sauvegarde ; false si le système n'a pas répondu
export async function clearWebSession(): Promise<boolean> {
  const cleared = await withTimeout(3000, async () => {
    await WebSession?.clearAsync();
    return true;
  });
  return cleared === true;
}
