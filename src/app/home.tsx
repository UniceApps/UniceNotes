import { RefreshControl } from 'react-native';

import { useRouter } from 'expo-router';
import { Text } from 'react-native-paper';

import { AnnouncementSheet } from '@/src/components/home/AnnouncementSheet';
import { HomeHeader } from '@/src/components/home/HomeHeader';
import { NextClassCard } from '@/src/components/home/NextClassCard';
import { Shortcuts, type Shortcut } from '@/src/components/home/Shortcuts';
import { UpNextList } from '@/src/components/home/UpNextList';
import { Banner } from '@/src/components/ui/Banner';
import { Screen } from '@/src/components/ui/Screen';
import { LINKS } from '@/src/constants/config';
import { useSettings } from '@/src/context/SettingsContext';
import { useAgenda } from '@/src/hooks/useAgenda';
import { useAppTheme } from '@/src/theme';
import { openURL } from '@/src/utils/browser';
import { formatSyncTime, getIsoWeek } from '@/src/utils/date';
import { haptics } from '@/src/utils/haptics';

export default function HomeScreen() {
  const router = useRouter();
  const theme = useAppTheme();
  const { adeid } = useSettings();
  const agenda = useAgenda();

  function navigate(href: '/edt-config' | '/settings' | '/free-rooms' | '/ent') {
    haptics('light');
    router.push(href);
  }

  function openTimetable() {
    if (!agenda.configured) {
      navigate('/edt-config');
      return;
    }
    haptics('medium');
    router.push('/timetable');
  }

  function refresh() {
    haptics('medium');
    agenda.refresh();
  }

  function retry() {
    haptics('medium');
    agenda.reload();
  }

  const shortcuts: Shortcut[] = [
    {
      key: 'edt',
      icon: 'calendar-month-outline',
      label: 'Emploi du temps',
      subtitle: agenda.configured ? `Semaine ${getIsoWeek(agenda.now)}` : 'À configurer',
      tone: 'primary',
      onPress: openTimetable,
    },
    {
      key: 'rooms',
      icon: 'door-open',
      label: 'Salles libres',
      subtitle: 'Trouver une salle',
      tone: 'tertiary',
      onPress: () => navigate('/free-rooms'),
    },
    {
      key: 'notes',
      icon: 'calculator-variant-outline',
      label: 'Notes',
      subtitle: 'PronoteCampus',
      tone: 'secondary',
      onPress: () => openURL(LINKS.pronote),
    },
    {
      key: 'ent',
      icon: 'briefcase-variant-outline',
      label: 'ENT',
      subtitle: 'Moodle, Outlook…',
      tone: 'primary',
      onPress: () => navigate('/ent'),
    },
  ];

  const showOffline = agenda.configured && agenda.offline && agenda.classes.length > 0;
  const footer = agenda.configured
    ? `EDT ${adeid}${agenda.syncedAt ? ` · synchronisé ${formatSyncTime(agenda.syncedAt, agenda.now)}` : ''}`
    : 'Emploi du temps non configuré';

  return (
    <Screen
      header={
        <HomeHeader
          now={agenda.now}
          onEditEdt={() => navigate('/edt-config')}
          onSettings={() => navigate('/settings')}
        />
      }
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

      <NextClassCard agenda={agenda} onOpen={openTimetable} onSetup={() => navigate('/edt-config')} onRetry={retry} />

      {agenda.later.length > 0 && agenda.dayEnd && (
        <UpNextList items={agenda.later} dayEnd={agenda.dayEnd} onPress={openTimetable} />
      )}

      <Shortcuts items={shortcuts} />

      <Text variant="bodySmall" style={{ textAlign: 'center', color: theme.colors.onSurfaceVariant }}>
        {footer}
      </Text>
    </Screen>
  );
}
