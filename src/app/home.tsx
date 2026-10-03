import { useEffect, useRef } from 'react';
import { RefreshControl, ScrollView, View } from 'react-native';

import { Text } from 'react-native-paper';

import BottomSheet from '@gorhom/bottom-sheet';
import { useRouter } from 'expo-router';
import Animated, { FadeIn, FadeInDown, FadeOut, LinearTransition } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Banner } from '@/src/components/Banner';
import { HomeHeader } from '@/src/components/home/HomeHeader';
import { NextClassCard } from '@/src/components/home/NextClassCard';
import { ReleaseNotesSheet } from '@/src/components/home/ReleaseNotesSheet';
import { Shortcuts, type Shortcut } from '@/src/components/home/Shortcuts';
import { UpNextList } from '@/src/components/home/UpNextList';
import { APP_VERSION, PRONOTE_URL } from '@/src/constants/config';
import { useChoosenTheme } from '@/src/constants/theme';
import { useApp } from '@/src/context/AppContext';
import { useAgenda } from '@/src/hooks/useAgenda';
import { formatSyncTime, getIsoWeek } from '@/src/utils/agenda';
import { handleURL } from '@/src/utils/api';
import { withAlpha } from '@/src/utils/color';
import { haptics } from '@/src/utils/haptics';
import { saveAsync } from '@/src/utils/storage';

// apparition en cascade, puis glissement quand un bloc voisin change de taille
const enter = (index: number) => FadeInDown.duration(450).delay(index * 70);
const layout = LinearTransition.duration(250);

export default function HomeScreen() {
  const router = useRouter();
  const theme = useChoosenTheme();
  const insets = useSafeAreaInsets();
  const { adeid, updateModalShown, setUpdateModalShown, setOnboarding } = useApp();
  const agenda = useAgenda();
  const releaseNotesRef = useRef<BottomSheet>(null);

  useEffect(() => {
    setOnboarding(false);
  }, [setOnboarding]);

  useEffect(() => {
    if (updateModalShown) return;
    // laisse l'accueil apparaître avant les nouveautés
    const timer = setTimeout(() => {
      saveAsync('releaseNotesVersion', APP_VERSION);
      setUpdateModalShown(true);
      releaseNotesRef.current?.expand();
    }, 1500);
    return () => clearTimeout(timer);
  }, [updateModalShown, setUpdateModalShown]);

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
    // rien en mémoire : l'emploi du temps se charge lui-même
    router.push(agenda.classes.length > 0 ? '/timetable' : { pathname: '/timetable', params: { fresh: '1' } });
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
      onPress: () => handleURL(PRONOTE_URL),
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
    <View style={{ flex: 1, backgroundColor: theme.colors.background, paddingTop: insets.top }}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 8, paddingBottom: insets.bottom + 24 }}
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
      >
        <View style={{ width: '100%', maxWidth: 600, alignSelf: 'center', gap: 24 }}>
          <Animated.View entering={enter(0)}>
            <HomeHeader
              now={agenda.now}
              onEditEdt={() => navigate('/edt-config')}
              onSettings={() => navigate('/settings')}
            />
          </Animated.View>

          {showOffline && (
            <Animated.View
              entering={FadeIn}
              exiting={FadeOut}
              layout={layout}
              style={{ borderRadius: 16, overflow: 'hidden', marginBottom: -8 }}
            >
              <Banner
                alert
                icon="wifi-off"
                text={agenda.fetching ? 'Nouvelle tentative…' : 'Hors ligne · EDT en cache'}
                background={withAlpha(theme.colors.error, 0.12)}
                foreground={theme.colors.error}
                action={agenda.fetching ? undefined : { label: 'Réessayer', onPress: retry }}
              />
            </Animated.View>
          )}

          <Animated.View entering={enter(1)} layout={layout}>
            <NextClassCard
              agenda={agenda}
              onOpen={openTimetable}
              onSetup={() => navigate('/edt-config')}
              onRetry={retry}
            />
          </Animated.View>

          {agenda.later.length > 0 && agenda.dayEnd && (
            <Animated.View entering={enter(2)} exiting={FadeOut} layout={layout}>
              <UpNextList items={agenda.later} dayEnd={agenda.dayEnd} onPress={openTimetable} />
            </Animated.View>
          )}

          <Animated.View entering={enter(3)} layout={layout}>
            <Shortcuts items={shortcuts} />
          </Animated.View>

          <Animated.View entering={enter(4)} layout={layout}>
            <Text variant="bodySmall" style={{ textAlign: 'center', color: theme.colors.onSurfaceVariant }}>
              {footer}
            </Text>
          </Animated.View>
        </View>
      </ScrollView>

      <ReleaseNotesSheet sheetRef={releaseNotesRef} />
    </View>
  );
}
