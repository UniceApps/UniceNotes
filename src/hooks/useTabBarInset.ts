import { Platform } from 'react-native';

import { useSafeAreaInsets } from 'react-native-safe-area-context';

// marge à laisser sous le contenu d'un onglet. iOS : la barre d'onglets passe par-dessus l'écran
// et l'inset du bas de l'onglet l'inclut. Android : le contenu s'arrête déjà au-dessus.
// Inutile pour le premier ScrollView d'un onglet (Screen), qu'iOS décale lui-même.
export function useTabBarInset(): number {
  const insets = useSafeAreaInsets();
  return Platform.OS === 'ios' ? insets.bottom : 0;
}
