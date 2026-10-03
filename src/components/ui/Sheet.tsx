import { useCallback, type ReactNode, type RefObject } from 'react';

import BottomSheet, { BottomSheetBackdrop, BottomSheetView, type BottomSheetBackdropProps } from '@gorhom/bottom-sheet';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAppTheme } from '@/src/theme';

interface SheetProps {
  sheetRef: RefObject<BottomSheet | null>;
  onClose?: () => void;
  children: ReactNode;
}

// feuille flottante fermée par défaut, ouverte avec sheetRef.current.expand()
export function Sheet({ sheetRef, onClose, children }: SheetProps) {
  const theme = useAppTheme();
  const insets = useSafeAreaInsets();

  const renderBackdrop = useCallback(
    (props: BottomSheetBackdropProps) => (
      <BottomSheetBackdrop {...props} opacity={0.5} appearsOnIndex={0} disappearsOnIndex={-1} pressBehavior="close" />
    ),
    [],
  );

  return (
    <BottomSheet
      ref={sheetRef}
      index={-1}
      enableDynamicSizing
      enablePanDownToClose
      detached
      bottomInset={insets.bottom + 8}
      style={{ marginHorizontal: 12 }}
      backgroundStyle={{ borderRadius: 32, backgroundColor: theme.colors.elevation.level3 }}
      handleIndicatorStyle={{ backgroundColor: theme.colors.onSurfaceVariant }}
      backdropComponent={renderBackdrop}
      onClose={onClose}
    >
      <BottomSheetView style={{ paddingHorizontal: 24, paddingTop: 8, paddingBottom: 24 }}>{children}</BottomSheetView>
    </BottomSheet>
  );
}
