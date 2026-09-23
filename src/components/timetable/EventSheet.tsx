import React, { useCallback, type RefObject } from 'react';
import { StyleSheet } from 'react-native';

import { Button, Text } from 'react-native-paper';

import BottomSheet, {
  BottomSheetBackdrop,
  BottomSheetBackdropProps,
  BottomSheetView,
} from '@gorhom/bottom-sheet';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useChoosenTheme } from '@/src/constants/theme';

const MAX_DESCRIPTION_LENGTH = 384;

export interface EventDetails {
  title: string;
  description: string;
  room: string;
  time: string;
}

// événement tel que renvoyé par onPressEvent de calendar-kit
export interface PressedEvent {
  title: string;
  subtitle: string;
  description: string;
  _internal: { startUnix: number; endUnix: number; duration: number };
}

function cleanText(input: string): string {
  return input
    .replace(/[ \t]+/g, ' ')
    .replace(/^[ \t]+|[ \t]+$/gm, '')
    .replace(/\n\s*\n+/g, '\n')
    .trim();
}

function formatClock(date: Date): string {
  return `${date.getHours()}:${String(date.getMinutes()).padStart(2, '0')}`;
}

// crée la string 8:00 → 10:00 (2h00)
export function describeEvent(event: PressedEvent): EventDetails {
  const { startUnix, endUnix, duration } = event._internal;
  const description =
    event.subtitle.length > MAX_DESCRIPTION_LENGTH
      ? event.subtitle.slice(0, MAX_DESCRIPTION_LENGTH - 4) + '...'
      : event.subtitle;

  return {
    title: event.title,
    description: cleanText(description),
    room: event.description ?? 'N/A',
    time:
      `${formatClock(new Date(startUnix))} → ${formatClock(new Date(endUnix))}` +
      ` (${Math.floor(duration / 60)}h${String(duration % 60).padStart(2, '0')})`,
  };
}

export function EventSheet({
  sheetRef,
  details,
}: {
  sheetRef: RefObject<BottomSheet | null>;
  details: EventDetails;
}) {
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
          {details.title}
        </Text>
        <Text style={{ textAlign: 'left' }} variant="bodyLarge">
          {details.description}
        </Text>
        {details.room ? (
          <Text style={{ textAlign: 'center', marginTop: 16, marginBottom: 4 }} variant="titleLarge">
            {details.room}
          </Text>
        ) : null}
        <Text style={{ textAlign: 'center', marginBottom: 16 }} variant="titleLarge">
          {details.time}
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
