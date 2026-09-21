import type { ImageSourcePropType } from 'react-native';

// name doit correspondre exactement au nom déclaré dans app.json
// null = icone principale de l'application.
export interface AppIconOption {
  name: string | null;
  label: string;
  author?: string;
  source: ImageSourcePropType;
}

export interface AppIconGroup {
  title: string;
  icons: AppIconOption[];
}

export const appIconGroups: AppIconGroup[] = [
  {
    title: 'Officielles',
    icons: [
      { name: null, label: 'Par défaut', source: require('../assets/icon.png') },
      { name: 'Old', label: 'Old Style', source: require('../assets/icons/icon_old.png') },
      { name: 'Magnet', label: 'Magnet', source: require('../assets/icons/icon_magnet.png') },
      { name: 'Ardente', label: 'Ardente', source: require('../assets/icons/icon_ardente.png') },
      { name: 'Beach', label: 'Beach', source: require('../assets/icons/icon_beach.png') },
      { name: 'Monaco', label: 'Monaco', source: require('../assets/icons/icon_monaco.png') },
      { name: 'Melted', label: 'Melted', source: require('../assets/icons/icon_melted.png') },
      { name: 'Zoomed', label: 'Zoomed', source: require('../assets/icons/icon_zoomed.png') },
    ],
  },
  {
    title: 'Communautaires',
    icons: [
      { name: 'Glitched', label: 'Glitched', author: '@f.eli0tt', source: require('../assets/icons/icon_glitched.png') },
      { name: 'Vaporwave', label: 'Vaporwave', author: '@nathan_jaffres', source: require('../assets/icons/icon_vaporwave.png') },
      { name: 'Ios6', label: 'iOS 6', author: '@ds.marius', source: require('../assets/icons/icon_ios6.png') },
    ],
  },
  {
    title: 'Événements',
    icons: [
      { name: 'France', label: 'France', author: 'Euro & JO 2024', source: require('../assets/icons/icon_france.png') },
      { name: 'Christmas2023', label: 'Noël', author: '2023', source: require('../assets/icons/icon_christmas2023.png') },
    ],
  },
];

export const allAppIcons: AppIconOption[] = appIconGroups.flatMap((g) => g.icons);
