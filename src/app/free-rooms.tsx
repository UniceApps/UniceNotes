import React, { useMemo, useRef, useState } from 'react';
import { RefreshControl, ScrollView, View } from 'react-native';

import { Appbar, Divider, ProgressBar, Text, Tooltip } from 'react-native-paper';

import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Banner } from '@/src/components/Banner';
import { RoomFilters } from '@/src/components/rooms/RoomFilters';
import type { RoomsViewContext } from '@/src/components/rooms/RoomRow';
import { RoomTree } from '@/src/components/rooms/RoomTree';
import { getRoomStatusColors, useChoosenTheme } from '@/src/constants/theme';
import { useRoomsSnapshot } from '@/src/hooks/useRoomsSnapshot';
import type { RoomEntry } from '@/src/types';
import { haptics } from '@/src/utils/haptics';
import {
  buildRoomTree,
  buildRoomView,
  formatDuration,
  formatTime,
  getParisClock,
  groupBookingsByRoom,
  keepFree,
} from '@/src/utils/rooms';

const DEFAULT_DURATION = 60;
const NO_ROOMS: RoomEntry[] = [];

export default function FreeRoomsScreen() {
  const router = useRouter();
  const theme = useChoosenTheme();
  const insets = useSafeAreaInsets();
  const colors = getRoomStatusColors(theme);

  const { snapshot, clock, loading, failed, reload } = useRoomsSnapshot();
  const [duration, setDuration] = useState(DEFAULT_DURATION);
  const [onlyFree, setOnlyFree] = useState(false);

  const scrollRef = useRef<ScrollView>(null);
  const scrollY = useRef(0);
  // position du début de l'arbre dans la page
  const listY = useRef(0);

  const tree = useMemo(() => buildRoomTree(snapshot?.rooms ?? []), [snapshot]);
  const bookingsByRoom = useMemo(() => groupBookingsByRoom(snapshot?.bookings ?? []), [snapshot]);
  const view = useMemo(() => {
    const full = buildRoomView(tree, bookingsByRoom, clock.minutes, duration);
    return onlyFree ? keepFree(full) : full;
  }, [tree, bookingsByRoom, clock.minutes, duration, onlyFree]);

  function goBack() {
    haptics('medium');
    router.back();
  }

  function refresh() {
    if (loading) return;
    haptics('medium');
    reload();
  }

  function selectDuration(minutes: number) {
    haptics('selection');
    setDuration(minutes);
  }

  function toggleOnlyFree() {
    haptics('selection');
    setOnlyFree((value) => !value);
  }

  // ouvrir ou fermer un niveau change la hauteur de la liste : si l'utilisateur avait dépassé le
  // début de l'arbre, on y remonte pour qu'il ne perde pas le fil
  function keepTreeInView() {
    if (scrollY.current > listY.current) {
      scrollRef.current?.scrollTo({ y: listY.current, animated: true });
    }
  }

  const ctx: RoomsViewContext = {
    now: clock.minutes,
    duration,
    colors,
    secondary: theme.colors.onSurfaceVariant,
    highlight: theme.colors.secondaryContainer,
    onTreeChange: keepTreeInView,
  };

  const errorBackground = theme.dark ? theme.colors.errorContainer : theme.colors.error;
  const errorForeground = theme.dark ? theme.colors.onErrorContainer : theme.colors.onError;
  const updatedAt = snapshot ? formatTime(getParisClock(new Date(snapshot.fetchedAt)).minutes) : null;

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <Appbar.Header elevated>
        <Tooltip title="Retour">
          <Appbar.BackAction onPress={goBack} />
        </Tooltip>
        <Appbar.Content title="Salles libres" />
        <Tooltip title="Actualiser">
          <Appbar.Action icon="refresh" disabled={loading} onPress={refresh} />
        </Tooltip>
      </Appbar.Header>

      {loading && <ProgressBar indeterminate />}

      {failed && (
        <Banner
          alert
          icon="wifi-off"
          text={snapshot ? `ADE indisponible · données de ${updatedAt}` : 'ADE indisponible'}
          background={errorBackground}
          foreground={errorForeground}
          action={{ label: 'Réessayer', onPress: refresh }}
        />
      )}

      {snapshot && snapshot.bookings.length === 0 && (
        <Banner
          icon="calendar-blank-outline"
          text="Aucun cours planifié aujourd'hui : toutes les salles apparaissent libres."
          background={theme.colors.tertiaryContainer}
          foreground={theme.colors.onTertiaryContainer}
        />
      )}

      <ScrollView
        ref={scrollRef}
        onScroll={(event) => {
          scrollY.current = event.nativeEvent.contentOffset.y;
        }}
        scrollEventThrottle={64}
        contentContainerStyle={{ paddingBottom: insets.bottom + 16 }}
        refreshControl={<RefreshControl refreshing={loading && !!snapshot} onRefresh={refresh} />}
      >
        {!snapshot && !failed && (
          <Text variant="bodyLarge" style={{ textAlign: 'center', marginTop: 48, color: ctx.secondary }}>
            Chargement des salles...
          </Text>
        )}

        {snapshot && (
          <>
            <RoomFilters
              duration={duration}
              onSelectDuration={selectDuration}
              onlyFree={onlyFree}
              onToggleOnlyFree={toggleOnlyFree}
              colors={colors}
              secondary={ctx.secondary}
              updatedAt={updatedAt}
            />
            <Divider />

            <View
              onLayout={(event) => {
                listY.current = event.nativeEvent.layout.y;
              }}
            >
              {view.length === 0 ? (
                <Text variant="bodyLarge" style={{ textAlign: 'center', marginTop: 32, color: ctx.secondary }}>
                  Aucune salle libre pour {formatDuration(duration)}.
                </Text>
              ) : (
                <RoomTree nodes={view} rooms={NO_ROOMS} depth={0} ctx={ctx} />
              )}
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
}
