import Constants from 'expo-constants';

import { version } from '../../package.json';

// outils de debug
export const IS_BETA = false;

export const APP_VERSION = version;
export const BUILD_COMMIT = Constants.expoConfig?.extra?.github_hash as string | undefined;

export const API_URL = 'https://uniceapi.metrixmedia.fr/';

export const LINKS = {
  download: 'https://notes.metrixmedia.fr/get',
  support: 'https://notes.metrixmedia.fr/support',
  credits: 'https://notes.metrixmedia.fr/credits',
  privacy: 'https://notes.metrixmedia.fr/privacy',
  source: 'https://github.com/UniceApps/UniceNotes',
  author: 'https://github.com/hugofnm',
  pronote: 'https://sco.polytech.unice.fr/1/mobile.etudiant',
  iconsMail: 'mailto:app+icons@metrixmedia.fr',
};

// affichées une fois par version, à l'accueil
export const RELEASE_NOTES = {
  title: "Tu as mis à jour l'application ! 🎉",
  items: [
    { icon: 'star-outline', text: "Marque tes examens sur l'emploi du temps pour recevoir des rappels" },
    { icon: 'bug-outline', text: 'Correction de bugs' },
  ],
};
