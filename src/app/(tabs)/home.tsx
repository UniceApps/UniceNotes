import { RefreshControl } from 'react-native';

import { useRouter } from 'expo-router';
import { Text } from 'react-native-paper';

import { AnnouncementSheet } from '@/src/components/home/AnnouncementSheet';
import { HomeHeader } from '@/src/components/home/HomeHeader';
import { NextClassCard } from '@/src/components/home/NextClassCard';
import { QuickAccess } from '@/src/components/home/QuickAccess';
import { UpNextList } from '@/src/components/home/UpNextList';
import { Banner } from '@/src/components/ui/Banner';
import { Screen } from '@/src/components/ui/Screen';
import { useSettings } from '@/src/context/SettingsContext';
import { useAgenda } from '@/src/hooks/useAgenda';
import { useAppTheme } from '@/src/theme';
import { formatSyncTime } from '@/src/utils/date';
import { haptics } from '@/src/utils/haptics';

export default function HomeScreen() {
  const router = useRouter();
  const theme = useAppTheme();
  const { adeid } = useSettings();
  const agenda = useAgenda();

  function editEdt() {
    haptics('light');
    router.push('/edt-config');
  }

  // l'emploi du temps et l'ENT sont des onglets : on bascule dessus sans empiler d'écran
  function openTimetable() {
    if (!agenda.configured) {
      editEdt();
      return;
    }
    haptics('medium');
    router.navigate('/timetable');
  }

  function openEnt() {
    haptics('light');
    router.navigate('/ent');
  }

  // les paramètres sont aussi un onglet : la roue dentée reste là où on a l'habitude de la trouver
  function openSettings() {
    haptics('light');
    router.navigate('/settings');
  }

  function refresh() {
    haptics('medium');
    agenda.refresh();
  }

  function retry() {
    haptics('medium');
    agenda.reload();
  }

  const showOffline = agenda.configured && agenda.offline && agenda.classes.length > 0;
  const footer = agenda.configured
    ? `Connecté à ${adeid}${agenda.syncedAt ? ` · synchronisé ${formatSyncTime(agenda.syncedAt, agenda.now)}` : ''}`
    : 'Emploi du temps non configuré';

  return (
    <Screen
      tab
      header={<HomeHeader now={agenda.now} onEditEdt={editEdt} onSettings={openSettings} />}
      refreshControl={
        agenda.configured ? (
          <RefreshControl
            refreshing={agenda.refreshing}
            onRefresh={refresh}
            tintColor={theme.colors.primary}
            colors={[theme.colors.primary]}
            progressBackgroundColor={theme.colors.elevation.level3}
          />
        ) : undefined
      }
      overlay={<AnnouncementSheet />}
    >
      {showOffline && (
        <Banner
          tone="error"
          icon="wifi-off"
          text={agenda.loading ? 'Nouvelle tentative…' : 'Hors ligne · EDT en cache'}
          action={agenda.loading ? undefined : { label: 'Réessayer', onPress: retry }}
          style={{ marginBottom: -8 }}
        />
      )}

      <NextClassCard agenda={agenda} onOpen={openTimetable} onSetup={editEdt} onRetry={retry} />

      {agenda.later.length > 0 && agenda.dayEnd && (
        <UpNextList items={agenda.later} dayEnd={agenda.dayEnd} onPress={openTimetable} />
      )}

      <QuickAccess onOpenEnt={openEnt} />

      <Text variant="bodySmall" style={{ textAlign: 'center', color: theme.colors.onSurfaceVariant }}>
        {footer}
      </Text>
    </Screen>
  );
}
