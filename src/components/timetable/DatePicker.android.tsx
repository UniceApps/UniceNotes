import { DateTimePicker } from '@expo/ui/community/datetime-picker';

import type { DatePickerProps } from '@/src/components/timetable/DatePicker';
import { useAppTheme } from '@/src/theme';

const toUtcDay = (date: Date) => new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));

export function DatePicker({ value, minimumDate, maximumDate, onPick, onClose }: DatePickerProps) {
  const theme = useAppTheme();
  return (
    <DateTimePicker
      value={toUtcDay(value)}
      minimumDate={toUtcDay(minimumDate)}
      maximumDate={toUtcDay(maximumDate)}
      accentColor={theme.colors.primary}
      positiveButton={{ label: 'Afficher' }}
      negativeButton={{ label: 'Annuler' }}
      onValueChange={(_event, date) => {
        onPick(new Date(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
        onClose();
      }}
      onDismiss={onClose}
      style={{ position: 'absolute' }}
    />
  );
}
