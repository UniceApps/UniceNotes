import Constants from 'expo-constants';

import { version } from '../../package.json';

// outils de debug (bouton de crash…)
export const IS_BETA = false;

export const APP_VERSION = version;
// commit du build EAS, absent en développement
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
    { icon: 'palette-outline', text: "Toute l'application fait peau neuve !" },
    { icon: 'widgets-outline', text: 'Les widgets sont maintenant disponibles pour Android' },
    { icon: 'star-outline', text: 'Ajoute tes salles favorites pour vérifier leur disponibilité plus rapidement' },
    { icon: 'dock-bottom', text: "Une barre d'onglets pour tout retrouver : accueil, EDT, salles, ENT et paramètres" },
    { icon: 'web', text: "Moodle, Outlook, PronoteCampus… s'ouvrent dans l'app et tu restes connecté" },
    { icon: 'pin-outline', text: "Épingle 3 services à l'accès rapide, retrouve-les aussi sur l'icône de l'app" },
    { icon: 'bug-outline', text: 'Correction de bugs' },
  ],
};
