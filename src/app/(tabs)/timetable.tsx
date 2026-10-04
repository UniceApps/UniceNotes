import { useCallback, useState } from 'react';
import { View } from 'react-native';

import { useFocusEffect, useRouter } from 'expo-router';

import { TimetableScreen } from '@/src/components/timetable/TimetableScreen';
import { Card } from '@/src/components/ui/Card';
import { EmptyState } from '@/src/components/ui/EmptyState';
import { Screen } from '@/src/components/ui/Screen';
import { useSettings } from '@/src/context/SettingsContext';
import { useAppTheme } from '@/src/theme';
import { haptics } from '@/src/utils/haptics';

// onglet EDT : l'emploi du temps enregistré
export default function TimetableTab() {
  const router = useRouter();
  const theme = useAppTheme();
  const { adeid } = useSettings();
  // l'onglet est monté avec l'app : le calendrier, lourd, attend la première visite
  const [visited, setVisited] = useState(false);

  useFocusEffect(
    useCallback(() => {
      setVisited(true);
    }, []),
  );

  if (!adeid) {
    return (
      <Screen tab title="Emploi du temps">
        <Card>
          <EmptyState
            icon="calendar-edit"
            title="Configure ton emploi du temps"
            text="Entre ton numéro étudiant ou choisis ton cursus pour retrouver tes cours ici, sur l'accueil et sur tes widgets."
            action={{
              label: 'Configurer',
              icon: 'arrow-right',
              onPress: () => {
                haptics('light');
                router.push('/edt-config');
              },
            }}
          />
        </Card>
      </Screen>
    );
  }

  if (!visited) return <View style={{ flex: 1, backgroundColor: theme.colors.background }} />;
  return <TimetableScreen tempCode={null} />;
}
