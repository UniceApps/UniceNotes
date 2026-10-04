import type { ComponentType } from 'react';
import { Platform, type ViewProps } from 'react-native';

import { requireNativeView, requireOptionalNativeModule } from 'expo';

// iOS seulement, et si l'app a été recompilée avec le module : sinon rien n'est rendu
const NativeMarker: ComponentType<ViewProps> | null =
  Platform.OS === 'ios' && requireOptionalNativeModule('ContentScroll') !== null
    ? requireNativeView<ViewProps>('ContentScroll')
    : null;

// à poser dans la ScrollView d'un onglet : iOS 26 la suit pour réduire la barre d'onglets au défilement
export function ContentScrollMarker() {
  if (!NativeMarker) return null;
  return <NativeMarker pointerEvents="none" style={{ position: 'absolute', width: 0, height: 0 }} />;
}
