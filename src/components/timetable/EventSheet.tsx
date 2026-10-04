import type { RefObject } from 'react';
import { View } from 'react-native';

import type { BottomSheetModal } from '@gorhom/bottom-sheet';
import { Button, Text } from 'react-native-paper';

import { InfoLine } from '@/src/components/ui/InfoLine';
import { Sheet } from '@/src/components/ui/Sheet';
import { useAppTheme } from '@/src/theme';
import type { CalendarEvent } from '@/src/types';
import { formatSchedule } from '@/src/utils/agenda';
import { formatLongDate } from '@/src/utils/date';

// la description ADE contient des lignes vides et finit par « (Exporté le : …) »
function cleanNotes(notes: string): string {
  return notes
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line && !/^\(export/i.test(line))
    .join('\n');
}

export function EventSheet({
  sheetRef,
  event,
}: {
  sheetRef: RefObject<BottomSheetModal | null>;
  event: CalendarEvent | null;
}) {
  return (
    <Sheet sheetRef={sheetRef}>
      {event && <EventDetails event={event} onClose={() => sheetRef.current?.dismiss()} />}
    </Sheet>
  );
}

function EventDetails({ event, onClose }: { event: CalendarEvent; onClose: () => void }) {
  const theme = useAppTheme();
  const start = new Date(event.start.dateTime);
  const end = new Date(event.end.dateTime);
  const notes = cleanNotes(event.notes);

  return (
    <View>
      <View style={{ flexDirection: 'row', gap: 12 }}>
        <View style={{ width: 6, borderRadius: 3, backgroundColor: event.color }} />
        <View style={{ flex: 1 }}>
          <Text variant="labelLarge" style={{ color: theme.colors.primary }}>
            {formatLongDate(start)}
          </Text>
          <Text variant="headlineSmall">{event.title || 'Cours sans titre'}</Text>
        </View>
      </View>

      <View style={{ gap: 8, marginTop: 16 }}>
        <InfoLine icon="clock-outline" text={formatSchedule({ start, end })} color={theme.colors.onSurface} />
        <InfoLine icon="map-marker-outline" text={event.room || 'Salle non précisée'} color={theme.colors.onSurface} />
        {notes ? (
          <InfoLine
            icon="text"
            text={notes}
            color={theme.colors.onSurfaceVariant}
            variant="bodyLarge"
            numberOfLines={8}
          />
        ) : null}
      </View>

      <Button mode="contained-tonal" style={{ marginTop: 20 }} onPress={onClose}>
        Fermer
      </Button>
    </View>
  );
}
