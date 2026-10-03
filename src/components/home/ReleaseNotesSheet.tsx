import React, { useCallback, type RefObject } from 'react';
import { StyleSheet } from 'react-native';

import { Button, Text } from 'react-native-paper';

import BottomSheet, {
  BottomSheetBackdrop,
  BottomSheetBackdropProps,
  BottomSheetView,
} from '@gorhom/bottom-sheet';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { RELEASE_NOTES } from '@/src/constants/config';
import { useChoosenTheme } from '@/src/constants/theme';

// nouveautés, affichées une fois par version
export function ReleaseNotesSheet({ sheetRef }: { sheetRef: RefObject<BottomSheet | null> }) {
  const theme = useChoosenTheme();
  const insets = useSafeAreaInsets();

  const renderBackdrop = useCallback(
    (props: BottomSheetBackdropProps) => (
      <BottomSheetBackdrop
        {...props}
        opacity={0.5}
        enableTouchThrough={false}
        appearsOnIndex={0}
        disappearsOnIndex={-1}
        style={[{ backgroundColor: 'rgba(0, 0, 0, 1)' }, StyleSheet.absoluteFill]}
      />
    ),
    [],
  );

  return (
    <BottomSheet
      ref={sheetRef}
      index={-1}
      enableDynamicSizing
      enablePanDownToClose
      bottomInset={insets.bottom}
      detached
      style={{ marginHorizontal: 24 }}
      backgroundStyle={{ backgroundColor: theme.colors.surfaceVariant }}
      handleIndicatorStyle={{ backgroundColor: theme.colors.onSurfaceVariant }}
      backdropComponent={renderBackdrop}
    >
      <BottomSheetView style={{ paddingLeft: 25, paddingRight: 25 }}>
        <Text style={{ textAlign: 'left', marginBottom: 8, marginTop: 8 }} variant="headlineSmall">
          {RELEASE_NOTES.info}
        </Text>
        <Text style={{ textAlign: 'left', marginBottom: 16 }} variant="titleMedium">
          {RELEASE_NOTES.subtitle}
        </Text>
        <Button
          style={{ marginBottom: 16 }}
          icon="close"
          mode="contained"
          onPress={() => sheetRef.current?.close()}
        >
          Fermer
        </Button>
      </BottomSheetView>
    </BottomSheet>
  );
}
