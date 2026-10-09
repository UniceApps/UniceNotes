import type { RefObject } from 'react';
import { View } from 'react-native';

import type { BottomSheetModal } from '@gorhom/bottom-sheet';
import { Button, Switch, Text, TouchableRipple } from 'react-native-paper';

import { IconBadge } from '@/src/components/ui/IconBadge';
import { InfoLine } from '@/src/components/ui/InfoLine';
import { Sheet } from '@/src/components/ui/Sheet';
import { useSettings } from '@/src/context/SettingsContext';
import { setExam, useExams } from '@/src/hooks/useExams';
import { alertNotificationsDenied, requestReminderPermission } from '@/src/services/reminders';
import { useAppTheme } from '@/src/theme';
import type { CalendarEvent } from '@/src/types';
import { formatSchedule } from '@/src/utils/agenda';
import { DAY_MS, formatClock, formatDay, formatLongDate } from '@/src/utils/date';
import { haptics } from '@/src/utils/haptics';

// la description ADE contient des lignes vides et finit par « (Exporté le : …) »
function cleanNotes(notes: string): string {
  return notes
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line && !/^\(export/i.test(line))
    .join('\n');
}

// readOnly : edt temporaire, les cours ne peuvent pas être marqués comme DS
export function EventSheet({
  sheetRef,
  event,
  readOnly,
}: {
  sheetRef: RefObject<BottomSheetModal | null>;
  event: CalendarEvent | null;
  readOnly: boolean;
}) {
  return (
    <Sheet sheetRef={sheetRef}>
      {event && <EventDetails event={event} readOnly={readOnly} onClose={() => sheetRef.current?.dismiss()} />}
    </Sheet>
  );
}

function EventDetails({ event, readOnly, onClose }: { event: CalendarEvent; readOnly: boolean; onClose: () => void }) {
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

      {!readOnly && <ExamToggle id={event.id} start={start} />}

      <Button mode="contained-tonal" style={{ marginTop: 20 }} onPress={onClose}>
        Fermer
      </Button>
    </View>
  );
}

function describeReminder(exam: boolean, start: Date, notifications: boolean): string {
  if (!notifications) return 'Rappels désactivés dans les paramètres';
  if (!exam) return 'Reçois un rappel la veille';
  const now = new Date();
  const at = new Date(start.getTime() - DAY_MS);
  return at > now ? `Rappel ${formatDay(at, now).toLowerCase()} à ${formatClock(at)}` : 'Marqué comme DS';
}

function ExamToggle({ id, start }: { id: string; start: Date }) {
  const theme = useAppTheme();
  const { notifications } = useSettings();
  const exam = useExams().has(id);

  // la permission est demandée au premier DS marqué
  async function toggle(on: boolean) {
    haptics('selection');
    const allowed = !on || !notifications || (await requestReminderPermission());
    setExam(id, on);
    if (!allowed) {
      alertNotificationsDenied(
        'Le cours est bien marqué comme DS, mais tu ne recevras pas de rappel la veille. Autorise les notifications de UniceNotes dans les réglages.',
      );
    }
  }

  return (
    <TouchableRipple
      accessibilityRole="switch"
      accessibilityState={{ checked: exam }}
      accessibilityLabel="DS ou évaluation, rappel la veille"
      style={{ marginTop: 16, borderRadius: 20, backgroundColor: theme.colors.elevation.level1 }}
      borderless
      onPress={() => toggle(!exam)}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12 }}>
        <IconBadge icon="file-document-edit-outline" tone="error" size={40} filled={exam} />
        <View style={{ flex: 1 }}>
          <Text variant="titleMedium">DS / Évaluation</Text>
          <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
            {describeReminder(exam, start, notifications)}
          </Text>
        </View>
        <Switch value={exam} onValueChange={toggle} />
      </View>
    </TouchableRipple>
  );
}
