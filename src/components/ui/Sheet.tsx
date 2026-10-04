import { useCallback, type ReactNode, type RefObject } from 'react';
import { Platform } from 'react-native';

import {
  BottomSheetBackdrop,
  BottomSheetModal,
  BottomSheetView,
  type BottomSheetBackdropProps,
} from '@gorhom/bottom-sheet';
import { initialWindowMetrics, useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAppTheme } from '@/src/theme';

interface SheetProps {
  sheetRef: RefObject<BottomSheetModal | null>;
  onClose?: () => void;
  children: ReactNode;
}

// feuille flottante, ouverte avec sheetRef.current.present() ; modale : elle passe au-dessus de la
// barre d'onglets (voir BottomSheetModalProvider dans app/_layout.tsx)
export function Sheet({ sheetRef, onClose, children }: SheetProps) {
  const theme = useAppTheme();
  const insets = useSafeAreaInsets();
  // iOS : dans un onglet, l'inset du bas inclut la barre d'onglets (SafeAreaProvider propre à chaque
  // onglet) ; la feuille passe par-dessus, on ne garde que l'indicateur d'accueil de la fenêtre
  const bottom = Platform.OS === 'ios' ? (initialWindowMetrics?.insets.bottom ?? insets.bottom) : insets.bottom;

  const renderBackdrop = useCallback(
    (props: BottomSheetBackdropProps) => (
      <BottomSheetBackdrop {...props} opacity={0.5} appearsOnIndex={0} disappearsOnIndex={-1} pressBehavior="close" />
    ),
    [],
  );

  return (
    <BottomSheetModal
      ref={sheetRef}
      enableDynamicSizing
      enablePanDownToClose
      detached
      bottomInset={bottom + 8}
      style={{ marginHorizontal: 12 }}
      backgroundStyle={{ borderRadius: 32, backgroundColor: theme.colors.elevation.level3 }}
      handleIndicatorStyle={{ backgroundColor: theme.colors.onSurfaceVariant }}
      backdropComponent={renderBackdrop}
      onDismiss={onClose}
    >
      <BottomSheetView style={{ paddingHorizontal: 24, paddingTop: 8, paddingBottom: 24 }}>{children}</BottomSheetView>
    </BottomSheetModal>
  );
}
