import { Platform } from 'react-native';

import { useSafeAreaInsets } from 'react-native-safe-area-context';

// marge sous un onglet, que la barre recouvre sur iOS (inutile pour Screen)
export function useTabBarInset(): number {
  const insets = useSafeAreaInsets();
  return Platform.OS === 'ios' ? insets.bottom : 0;
}
