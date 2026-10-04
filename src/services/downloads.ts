import { Share } from 'react-native';

import { Directory, File, Paths } from 'expo-file-system';

import { getCookieHeader } from './webSession';

// iOS : télécharge un fichier avec la session du navigateur intégré (cours Moodle…), puis propose
// de l'enregistrer dans Fichiers ou de l'ouvrir dans une autre app. Android passe par son
// gestionnaire de téléchargements.
export async function downloadAndShare(url: string): Promise<void> {
  const cookie = await getCookieHeader(url);
  // un dossier par téléchargement : le nom du fichier vient de la réponse du serveur
  const folder = new Directory(Paths.cache, 'downloads', String(Date.now()));
  folder.create({ intermediates: true, idempotent: true });
  const file = await File.downloadFileAsync(url, folder, {
    headers: cookie ? { Cookie: cookie } : undefined,
    idempotent: true,
  });
  await Share.share({ url: file.uri });
}
