import { useMemo, useRef, useState } from 'react';
import { RefreshControl, ScrollView, View } from 'react-native';

import { useIsFocused } from 'expo-router';
import { Snackbar } from 'react-native-paper';

import { FavoriteRooms } from '@/src/components/rooms/FavoriteRooms';
import { RoomFilters } from '@/src/components/rooms/RoomFilters';
import type { RoomsViewContext } from '@/src/components/rooms/RoomRow';
import { RoomTree } from '@/src/components/rooms/RoomTree';
import { Banner } from '@/src/components/ui/Banner';
import { Card } from '@/src/components/ui/Card';
import { EmptyState } from '@/src/components/ui/EmptyState';
import { Screen } from '@/src/components/ui/Screen';
import { HeaderButton } from '@/src/components/ui/ScreenHeader';
import { SectionTitle } from '@/src/components/ui/SectionTitle';
import { Bone, Skeleton } from '@/src/components/ui/Skeleton';
import { MAX_FAVORITE_ROOMS, useFavoriteRooms } from '@/src/hooks/useFavoriteRooms';
import { useRoomsSnapshot } from '@/src/hooks/useRoomsSnapshot';
import { getStatusColors, useAppTheme } from '@/src/theme';
import type { RoomBooking } from '@/src/types';
import { formatDuration, formatTime } from '@/src/utils/date';
import { haptics } from '@/src/utils/haptics';
import {
  buildRoomTree,
  buildRoomView,
  getParisClock,
  getRoomAvailability,
  groupBookingsByRoom,
  keepFree,
} from '@/src/utils/rooms';

const DEFAULT_DURATION = 60;
const NO_BOOKINGS: RoomBooking[] = [];

export default function FreeRoomsScreen() {
  const theme = useAppTheme();
  const colors = getStatusColors(theme);
  const focused = useIsFocused();

  const { snapshot, clock, loading, failed, reload } = useRoomsSnapshot(focused);
  const [duration, setDuration] = useState(DEFAULT_DURATION);
  const [onlyFree, setOnlyFree] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const favorites = useFavoriteRooms(snapshot?.rooms);

  const scrollRef = useRef<ScrollView>(null);
  const scrollY = useRef(0);
  const treeRef = useRef<View>(null);

  const tree = useMemo(() => buildRoomTree(snapshot?.rooms ?? []), [snapshot]);
  const bookingsByRoom = useMemo(() => groupBookingsByRoom(snapshot?.bookings ?? []), [snapshot]);
  const view = useMemo(() => {
    const full = buildRoomView(tree, bookingsByRoom, clock.minutes, duration);
    return onlyFree ? keepFree(full) : full;
  }, [tree, bookingsByRoom, clock.minutes, duration, onlyFree]);

  const favoriteEntries = useMemo(() => {
    const rooms = snapshot?.rooms ?? [];
    return favorites.ids.flatMap((id) => {
      const room = rooms.find((r) => r.id === id);
      if (!room) return [];
      const availability = getRoomAvailability(bookingsByRoom.get(id) ?? NO_BOOKINGS, clock.minutes, duration);
      return [{ room, availability }];
    });
  }, [snapshot, favorites.ids, bookingsByRoom, clock.minutes, duration]);

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

  function toggleFavorite(roomId: string) {
    if (favorites.toggle(roomId)) {
      haptics('selection');
    } else {
      haptics('warning');
      setNotice(`${MAX_FAVORITE_ROOMS} salles favorites maximum`);
    }
  }

  // ouvrir ou fermer un niveau change la hauteur de la liste : si l'utilisateur avait dépassé le
  // début de l'arbre, on y remonte pour qu'il ne perde pas le fil
  function keepTreeInView() {
    const scrollView = scrollRef.current?.getNativeScrollRef();
    scrollView?.measureInWindow((_x, top) => {
      treeRef.current?.measureInWindow((_x2, y) => {
        if (y < top) scrollRef.current?.scrollTo({ y: scrollY.current + y - top, animated: true });
      });
    });
  }

  const ctx: RoomsViewContext = {
    now: clock.minutes,
    duration,
    colors,
    secondary: theme.colors.onSurfaceVariant,
    accent: theme.colors.primary,
    highlight: theme.colors.secondaryContainer,
    onTreeChange: keepTreeInView,
    isFavorite: (roomId) => favorites.ids.includes(roomId),
    onToggleFavorite: toggleFavorite,
  };

  const updatedAt = snapshot ? formatTime(getParisClock(new Date(snapshot.fetchedAt)).minutes) : null;

  return (
    <Screen
      tab
      title="Salles libres"
      subtitle={updatedAt ? `Mis à jour à ${updatedAt}` : 'Disponibilités du jour'}
      actions={<HeaderButton icon="refresh" label="Actualiser" disabled={loading} onPress={refresh} />}
      scrollRef={scrollRef}
      onScroll={(event) => {
        scrollY.current = event.nativeEvent.contentOffset.y;
      }}
      refreshControl={
        snapshot ? (
          <RefreshControl
            refreshing={loading}
            onRefresh={refresh}
            tintColor={theme.colors.primary}
            colors={[theme.colors.primary]}
            progressBackgroundColor={theme.colors.elevation.level3}
          />
        ) : undefined
      }
      overlay={
        <Snackbar visible={notice !== null} onDismiss={() => setNotice(null)} duration={2500}>
          {notice ?? ''}
        </Snackbar>
      }
    >
      {failed && snapshot && (
        <Banner
          tone="error"
          icon="wifi-off"
          text={`ADE indisponible · données de ${updatedAt}`}
          action={{ label: 'Réessayer', onPress: refresh }}
        />
      )}

      {snapshot && snapshot.bookings.length === 0 && (
        <Banner
          tone="tertiary"
          icon="calendar-blank-outline"
          text="Aucun cours planifié aujourd'hui : toutes les salles apparaissent libres."
        />
      )}

      {!snapshot &&
        (failed && !loading ? (
          <Card>
            <EmptyState
              tone="error"
              icon="wifi-off"
              title="ADE indisponible"
              text="Impossible de récupérer les réservations des salles pour le moment."
              action={{ label: 'Réessayer', icon: 'refresh', onPress: refresh }}
            />
          </Card>
        ) : (
          <LoadingTree />
        ))}

      {snapshot && favoriteEntries.length > 0 && <FavoriteRooms entries={favoriteEntries} ctx={ctx} />}

      {snapshot && (
        <RoomFilters
          duration={duration}
          onSelectDuration={selectDuration}
          onlyFree={onlyFree}
          onToggleOnlyFree={toggleOnlyFree}
          colors={colors}
          secondary={ctx.secondary}
        />
      )}

      {snapshot && (
        <View ref={treeRef}>
          <SectionTitle title="Campus" />
          {view.length === 0 ? (
            <Card>
              <EmptyState
                icon="door-closed"
                title="Aucune salle libre"
                text={`Aucune salle n'est libre pendant ${formatDuration(duration)}.`}
              />
            </Card>
          ) : (
            <RoomTree nodes={view} ctx={ctx} />
          )}
        </View>
      )}
    </Screen>
  );
}

// squelette pendant le premier chargement (ADE met quelques secondes à répondre)
function LoadingTree() {
  return (
    <Skeleton label="Chargement des salles">
      <View style={{ gap: 12 }}>
        {[0, 1, 2, 3].map((index) => (
          <Card key={index}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <Bone width={40} height={40} radius={13} />
              <View style={{ flex: 1, gap: 8 }}>
                <Bone width="60%" />
                <Bone width="35%" height={12} />
              </View>
            </View>
          </Card>
        ))}
      </View>
    </Skeleton>
  );
}
