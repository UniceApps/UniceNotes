import WebSession from '@/modules/web-session';
import { withTimeout } from '@/src/utils/network';

// session du navigateur intégré, avec délais : WebKit peut ne jamais répondre

let restoring: Promise<void> | null = null;

// une fois par lancement, avant le premier chargement d'une page
export function restoreWebSession(): Promise<void> {
  restoring ??= withTimeout(2000, async () => (WebSession ? WebSession.restoreAsync() : 0)).then(() => undefined);
  return restoring;
}

export function persistWebSession(): void {
  WebSession?.persistAsync().catch((error) => console.warn('[webSession] sauvegarde impossible', error));
}

// déconnecte tous les services et efface la sauvegarde ; false si le système n'a pas répondu
export async function clearWebSession(): Promise<boolean> {
  const cleared = await withTimeout(3000, async () => {
    await WebSession?.clearAsync();
    return true;
  });
  return cleared === true;
}
