import type { ImageSourcePropType } from 'react-native';

export interface EntApp {
  label: string;
  subtitle: string;
  url: string;
  // logo du service, sinon une icône
  image?: ImageSourcePropType;
  icon: string;
}

export const ENT_APPS: EntApp[] = [
  {
    label: 'Outlook',
    subtitle: 'Emails',
    icon: 'email-outline',
    image: require('../assets/images/ent/outlook.png'),
    url: 'https://outlook.office.com/owa/?realm=etu.univ-cotedazur.fr&exsvurl=1&ll-cc=1036&modurl=0',
  },
  {
    label: 'Moodle',
    subtitle: 'Cours en ligne',
    icon: 'book-open-variant',
    image: require('../assets/images/ent/moodle.png'),
    url: 'https://portail-lms.univ-cotedazur.fr',
  },
  {
    label: 'PronoteCampus',
    subtitle: 'Notes',
    icon: 'calculator-variant-outline',
    image: require('../assets/images/ent/pronotecampus.png'),
    url: 'https://sco.polytech.unice.fr/1',
  },
  {
    label: 'IUT Notes',
    subtitle: 'Notes',
    icon: 'calculator-variant',
    url: 'https://iut-notes.unice.fr/',
  },
  {
    label: 'SoWeSign',
    subtitle: 'Émargement',
    icon: 'check-circle-outline',
    url: 'https://app.sowesign.com/login',
  },
  {
    label: 'Mon Dossier Web',
    subtitle: 'Scolarité',
    icon: 'school-outline',
    image: require('../assets/images/ent/univ.png'),
    url: 'https://mondossierweb.univ-cotedazur.fr/',
  },
  {
    label: 'Annuaire',
    subtitle: 'Contacts UniCA',
    icon: 'account-search-outline',
    url: 'https://annuaire.univ-cotedazur.fr',
  },
  {
    label: 'BU',
    subtitle: 'Bibliothèques',
    icon: 'book-open-page-variant-outline',
    url: 'https://bu.univ-cotedazur.fr/',
  },
  {
    label: 'Imprimerie',
    subtitle: 'Impressions',
    icon: 'printer-outline',
    url: 'https://impression.univ-cotedazur.fr/',
  },
  {
    label: 'Izly',
    subtitle: 'Paiement CROUS',
    icon: 'cash-multiple',
    image: require('../assets/images/ent/izly.png'),
    url: 'https://mon-espace.izly.fr',
  },
];
