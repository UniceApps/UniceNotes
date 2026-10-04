import type { ImageSourcePropType } from 'react-native';

import type { Tone } from '@/src/theme';

import { LINKS } from './config';

export interface EntApp {
  // identifiant stable : enregistré dans les apps épinglées et les liens unicenotes://app/{id}
  id: string;
  label: string;
  subtitle: string;
  url: string;
  // logo du service, sinon une icône
  image?: ImageSourcePropType;
  icon: string;
  tone: Tone;
  // SF Symbol des raccourcis de l'icône de l'app (iOS)
  symbol: string;
}

// services ouverts dans le navigateur intégré, qui garde la connexion d'un lancement à l'autre
export const ENT_APPS: EntApp[] = [
  {
    id: 'outlook',
    label: 'Outlook',
    subtitle: 'Emails',
    icon: 'email-outline',
    tone: 'primary',
    symbol: 'envelope',
    image: require('../assets/images/ent/outlook.png'),
    url: 'https://outlook.office.com/owa/?realm=etu.univ-cotedazur.fr&exsvurl=1&ll-cc=1036&modurl=0',
  },
  {
    id: 'moodle',
    label: 'Moodle',
    subtitle: 'Cours en ligne',
    icon: 'book-open-variant',
    tone: 'tertiary',
    symbol: 'book',
    image: require('../assets/images/ent/moodle.png'),
    url: 'https://portail-lms.univ-cotedazur.fr',
  },
  {
    id: 'pronote',
    label: 'PronoteCampus',
    subtitle: 'Notes',
    icon: 'calculator-variant-outline',
    tone: 'secondary',
    symbol: 'graduationcap',
    image: require('../assets/images/ent/pronotecampus.png'),
    // version mobile, faite pour l'écran d'un téléphone
    url: LINKS.pronote,
  },
  {
    id: 'iut-notes',
    label: 'IUT Notes',
    subtitle: 'Notes',
    icon: 'calculator-variant',
    tone: 'primary',
    symbol: 'checkmark.seal',
    url: 'https://iut-notes.unice.fr/',
  },
  {
    id: 'sowesign',
    label: 'SoWeSign',
    subtitle: 'Émargement',
    icon: 'check-circle-outline',
    tone: 'tertiary',
    symbol: 'signature',
    url: 'https://app.sowesign.com/login',
  },
  {
    id: 'dossier-web',
    label: 'Mon Dossier Web',
    subtitle: 'Scolarité',
    icon: 'school-outline',
    tone: 'secondary',
    symbol: 'folder',
    image: require('../assets/images/ent/univ.png'),
    url: 'https://mondossierweb.univ-cotedazur.fr/',
  },
  {
    id: 'annuaire',
    label: 'Annuaire',
    subtitle: 'Contacts UniCA',
    icon: 'account-search-outline',
    tone: 'primary',
    symbol: 'person.2',
    url: 'https://annuaire.univ-cotedazur.fr',
  },
  {
    id: 'bu',
    label: 'BU',
    subtitle: 'Bibliothèques',
    icon: 'book-open-page-variant-outline',
    tone: 'tertiary',
    symbol: 'books.vertical',
    url: 'https://bu.univ-cotedazur.fr/',
  },
  {
    id: 'impression',
    label: 'Imprimerie',
    subtitle: 'Impressions',
    icon: 'printer-outline',
    tone: 'secondary',
    symbol: 'printer',
    url: 'https://impression.univ-cotedazur.fr/',
  },
  {
    id: 'izly',
    label: 'Izly',
    subtitle: 'Paiement CROUS',
    icon: 'cash-multiple',
    tone: 'primary',
    symbol: 'creditcard',
    image: require('../assets/images/ent/izly.png'),
    url: 'https://mon-espace.izly.fr',
  },
];

// accès rapide d'origine : les notes, l'émargement et les mails
export const DEFAULT_PINNED_APPS = ['pronote', 'sowesign', 'outlook'];

export function getEntApp(id: unknown): EntApp | undefined {
  return typeof id === 'string' ? ENT_APPS.find((app) => app.id === id) : undefined;
}
