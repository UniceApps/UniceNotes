import { useEffect, useRef, useState } from 'react';

import { DatePicker as SwiftDatePicker, Host } from '@expo/ui/swift-ui';
import { datePickerStyle, environment } from '@expo/ui/swift-ui/modifiers';
import type { BottomSheetModal } from '@gorhom/bottom-sheet';
import { Button, Text } from 'react-native-paper';

import { Sheet } from '@/src/components/ui/Sheet';
import { useAppTheme } from '@/src/theme';
import { daysBetween } from '@/src/utils/date';

export interface DatePickerProps {
  value: Date;
  minimumDate: Date;
  maximumDate: Date;
  onPick: (date: Date) => void;
  // une fois fermé, le parent le démonte
  onClose: () => void;
}

export function DatePicker({ value, minimumDate, maximumDate, onPick, onClose }: DatePickerProps) {
  const theme = useAppTheme();
  const sheetRef = useRef<BottomSheetModal>(null);
  const [date, setDate] = useState(value);
  const settled = useRef(false);
  const lastHeight = useRef(0);
  const nudged = useRef(false);
  const layoutTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    sheetRef.current?.present();
    // passé l'ouverture, un changement de hauteur vient de l'utilisateur (autre mois)
    const timer = setTimeout(() => (settled.current = true), 1500);
    return () => {
      clearTimeout(timer);
      clearTimeout(layoutTimer.current);
    };
  }, []);

  function fixLayout(height: number) {
    clearTimeout(layoutTimer.current);
    if (settled.current || height === lastHeight.current) return;
    layoutTimer.current = setTimeout(() => {
      lastHeight.current = height;
      nudged.current = !nudged.current;
      setDate(new Date(value.getTime() + (nudged.current ? 1 : 0)));
    }, 120);
  }

  function change(picked: Date) {
    if (daysBetween(value, picked) !== 0) settled.current = true;
    setDate(picked);
  }

  function confirm() {
    onPick(date);
    sheetRef.current?.dismiss();
  }

  return (
    <Sheet sheetRef={sheetRef} onClose={onClose}>
      <Text variant="headlineSmall">Aller à une date</Text>
      <Host
        matchContents={{ vertical: true }}
        seedColor={theme.colors.primary}
        colorScheme={theme.dark ? 'dark' : 'light'}
        style={{ marginTop: 8 }}
        onLayoutContent={(event) => fixLayout(event.nativeEvent.height)}
      >
        <SwiftDatePicker
          selection={date}
          range={{ start: minimumDate, end: maximumDate }}
          onDateChange={change}
          modifiers={[datePickerStyle('graphical'), environment('locale', 'fr_FR')]}
        />
      </Host>
      <Button mode="contained" style={{ marginTop: 12 }} onPress={confirm}>
        Afficher
      </Button>
    </Sheet>
  );
}
