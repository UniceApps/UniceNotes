import React, { useEffect, useMemo, useRef, useState } from 'react';
import { RefreshControl, ScrollView, View } from 'react-native';

import {
  Appbar,
  Button,
  Chip,
  Divider,
  Icon,
  ProgressBar,
  Text,
  Tooltip,
  TouchableRipple,
} from 'react-native-paper';

import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { getRoomStatusColors, useChoosenTheme } from '@/src/constants/theme';
import { loadRoomsSnapshot } from '@/src/services/rooms';
import type {
  RoomEntry,
  RoomNodeView,
  RoomsSnapshot,
  RoomStatus,
  RoomStatusCounts,
} from '@/src/types';
import { haptics } from '@/src/utils/haptics';
import {
  buildRoomTree,
  buildRoomView,
  describeAvailability,
  DURATION_OPTIONS,
  formatDuration,
  formatTime,
  getParisClock,
  groupBookingsByRoom,
  keepFree,
  ROOM_MARGIN_MIN,
} from '@/src/utils/rooms';

// les statuts sont recalculés à cette cadence, sans nouvelle requête
const TICK_MS = 30 * 1000;
// au-delà, les réservations sont retéléchargées (les cours changent rarement en cours de journée)
const STALE_AFTER_MS = 15 * 60 * 1000;
// garde-fou : jamais deux actualisations automatiques à moins de 5 s d'écart
const MIN_REFRESH_DELAY_MS = 5 * 1000;
const DEFAULT_DURATION = 60;
const INDENT = 16;
// une icône par niveau de l'arbre : campus, bâtiment, sous-bâtiment, puis le niveau le plus fin
const DEPTH_ICONS = ['city-variant-outline', 'office-building-outline', 'floor-plan', 'layers-outline'];
const NO_ROOMS: RoomEntry[] = [];
const STATUS_LABELS: Record<RoomStatus, [singular: string, plural: string]> = {
  free: ['libre', 'libres'],
  tight: ['juste', 'justes'],
  busy: ['occupée', 'occupées'],
};

type StatusColors = Record<RoomStatus, string>;

interface ViewContext {
  now: number;
  duration: number;
  colors: StatusColors;
  secondary: string;
  // fond de l'en-tête d'un niveau ouvert
  highlight: string;
  // appelé quand un niveau s'ouvre ou se ferme
  onTreeChange: () => void;
}

function StatusDot({ color, size = 12 }: { color: string; size?: number }) {
  return <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: color }} />;
}

function capitalize(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

function summarize(counts: RoomStatusCounts): string {
  return (Object.keys(STATUS_LABELS) as RoomStatus[])
    .filter((status) => counts[status] > 0)
    .map((status) => `${counts[status]} ${STATUS_LABELS[status][counts[status] > 1 ? 1 : 0]}`)
    .join(', ');
}

function StatusCounts({ counts, ctx }: { counts: RoomStatusCounts; ctx: ViewContext }) {
  return (
    <View style={{ flexDirection: 'row', gap: 12, marginTop: 2 }}>
      {(Object.keys(STATUS_LABELS) as RoomStatus[])
        .filter((status) => counts[status] > 0)
        .map((status) => (
          <View key={status} style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <StatusDot color={ctx.colors[status]} size={8} />
            <Text variant="labelMedium" style={{ color: ctx.secondary }}>
              {counts[status]}
            </Text>
          </View>
        ))}
    </View>
  );
}

function RoomRow({ entry, depth, ctx }: { entry: RoomEntry; depth: number; ctx: ViewContext }) {
  const { headline, detail } = describeAvailability(entry.availability, ctx.now, ctx.duration);
  return (
    <View
      accessible
      accessibilityLabel={`${entry.room.name}. ${headline}${detail ? `. ${detail}` : ''}`}
      style={{
        flexDirection: 'row',
        gap: 12,
        paddingVertical: 8,
        paddingLeft: 25 + depth * INDENT,
        paddingRight: 25,
      }}
    >
      <View style={{ width: 24, alignItems: 'center', paddingTop: 5 }}>
        <StatusDot color={ctx.colors[entry.availability.status]} />
      </View>
      <View style={{ flex: 1 }}>
        <Text variant="bodyLarge">{entry.room.name}</Text>
        <Text variant="bodyMedium" style={{ color: ctx.secondary }}>
          {headline}
        </Text>
        {detail && (
          <Text variant="bodySmall" style={{ color: ctx.secondary }} numberOfLines={2}>
            {detail}
          </Text>
        )}
      </View>
    </View>
  );
}

// Une seule branche ouverte à la fois : ouvrir un niveau masque ses voisins (et les salles du niveau
// parent), pour ne plus avoir à faire défiler la liste à chaque sous-menu. Rouvrir le niveau ouvert le referme.
function NodeTree({
  nodes,
  rooms,
  depth,
  ctx,
}: {
  nodes: RoomNodeView[];
  rooms: RoomEntry[];
  depth: number;
  ctx: ViewContext;
}) {
  const [openKey, setOpenKey] = useState<string | null>(null);
  // un niveau qui disparaît (filtre) ne laisse pas la liste vide : on revient à tous les voisins
  const open = nodes.find((node) => node.key === openKey);

  function toggle(key: string) {
    haptics('selection');
    setOpenKey(open?.key === key ? null : key);
    ctx.onTreeChange();
  }

  return (
    <>
      {(open ? [open] : nodes).map((node) => (
        <NodeSection
          key={node.key}
          node={node}
          depth={depth}
          expanded={node === open}
          onPress={() => toggle(node.key)}
          ctx={ctx}
        />
      ))}
      {!open &&
        rooms.map((entry) => <RoomRow key={entry.room.id} entry={entry} depth={depth} ctx={ctx} />)}
    </>
  );
}

// campus, bâtiment ou sous-bâtiment : le contenu n'est rendu qu'une fois ouvert
function NodeSection({
  node,
  depth,
  expanded,
  onPress,
  ctx,
}: {
  node: RoomNodeView;
  depth: number;
  expanded: boolean;
  onPress: () => void;
  ctx: ViewContext;
}) {
  return (
    <View>
      <TouchableRipple
        onPress={onPress}
        accessibilityRole="button"
        accessibilityState={{ expanded }}
        accessibilityLabel={`${node.name}, ${summarize(node.counts)}`}
        style={{
          paddingVertical: 10,
          paddingLeft: 25 + depth * INDENT,
          paddingRight: 25,
          backgroundColor: expanded ? ctx.highlight : undefined,
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <Icon source={DEPTH_ICONS[Math.min(depth, DEPTH_ICONS.length - 1)]} size={24} />
          <View style={{ flex: 1 }}>
            <Text variant={depth === 0 ? 'titleMedium' : 'titleSmall'} numberOfLines={2}>
              {node.name}
            </Text>
            <StatusCounts counts={node.counts} ctx={ctx} />
          </View>
          <Icon source={expanded ? 'chevron-up' : 'chevron-down'} size={24} />
        </View>
      </TouchableRipple>

      {expanded && <NodeTree nodes={node.children} rooms={node.rooms} depth={depth + 1} ctx={ctx} />}
      {depth === 0 && <Divider />}
    </View>
  );
}

interface BannerProps {
  icon: string;
  text: string;
  background: string;
  foreground: string;
  alert?: boolean;
  action?: { label: string; onPress: () => void };
}

function Banner({ icon, text, background, foreground, alert, action }: BannerProps) {
  return (
    <View
      accessibilityRole={alert ? 'alert' : undefined}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        paddingVertical: 8,
        paddingHorizontal: 16,
        backgroundColor: background,
      }}
    >
      <Icon source={icon} size={18} color={foreground} />
      <Text variant="labelLarge" style={{ color: foreground, flexShrink: 1 }}>
        {text}
      </Text>
      {action && (
        <Button compact textColor={foreground} onPress={action.onPress}>
          {action.label}
        </Button>
      )}
    </View>
  );
}

export default function FreeRoomsScreen() {
  const router = useRouter();
  const theme = useChoosenTheme();
  const insets = useSafeAreaInsets();
  const colors = getRoomStatusColors(theme);

  const [snapshot, setSnapshot] = useState<RoomsSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  // incrémentée pour relancer le chargement (actualisation manuelle ou automatique)
  const [fetchKey, setFetchKey] = useState(0);
  const [now, setNow] = useState(() => new Date());
  const [duration, setDuration] = useState(DEFAULT_DURATION);
  const [onlyFree, setOnlyFree] = useState(false);

  const scrollRef = useRef<ScrollView>(null);
  const scrollY = useRef(0);
  // position du début de l'arbre dans la page
  const listY = useRef(0);

  useEffect(() => {
    let cancelled = false;
    loadRoomsSnapshot().then((result) => {
      if (cancelled) return;
      if (result) setSnapshot(result);
      setFailed(result === null);
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [fetchKey]);

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), TICK_MS);
    return () => clearInterval(timer);
  }, []);

  const clock = getParisClock(now);
  // des réservations d'un autre jour (écran resté ouvert depuis la veille) ne sont pas exploitables
  const usable = snapshot && snapshot.date === clock.eventDate ? snapshot : null;

  // actualisation automatique et silencieuse quand les données sont périmées ou changent de jour ;
  // aucune nouvelle tentative tant qu'un échec n'a pas été acquitté par l'utilisateur
  useEffect(() => {
    if (!snapshot || failed) return;
    const delay = usable ? snapshot.fetchedAt + STALE_AFTER_MS - Date.now() : 0;
    const timer = setTimeout(() => setFetchKey((key) => key + 1), Math.max(delay, MIN_REFRESH_DELAY_MS));
    return () => clearTimeout(timer);
  }, [snapshot, usable, failed]);

  const tree = useMemo(() => buildRoomTree(usable?.rooms ?? []), [usable]);
  const bookingsByRoom = useMemo(() => groupBookingsByRoom(usable?.bookings ?? []), [usable]);
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
    setLoading(true);
    setFetchKey((key) => key + 1);
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

  const ctx: ViewContext = {
    now: clock.minutes,
    duration,
    colors,
    secondary: theme.colors.onSurfaceVariant,
    highlight: theme.colors.secondaryContainer,
    onTreeChange: keepTreeInView,
  };

  const errorBackground = theme.dark ? theme.colors.errorContainer : theme.colors.error;
  const errorForeground = theme.dark ? theme.colors.onErrorContainer : theme.colors.onError;
  const updatedAt = usable ? formatTime(getParisClock(new Date(usable.fetchedAt)).minutes) : null;

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
          text={usable ? `ADE indisponible · données de ${updatedAt}` : 'ADE indisponible'}
          background={errorBackground}
          foreground={errorForeground}
          action={{ label: 'Réessayer', onPress: refresh }}
        />
      )}

      {usable && usable.bookings.length === 0 && (
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
        refreshControl={<RefreshControl refreshing={loading && !!usable} onRefresh={refresh} />}
      >
        {!usable && !failed && (
          <Text variant="bodyLarge" style={{ textAlign: 'center', marginTop: 48, color: ctx.secondary }}>
            Chargement des salles...
          </Text>
        )}

        {usable && (
          <>
            <View style={{ paddingHorizontal: 25, paddingTop: 16, paddingBottom: 8 }}>
              <Text variant="titleMedium">Pour combien de temps veux-tu la salle ?</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ gap: 8, paddingVertical: 12 }}
              >
                {DURATION_OPTIONS.map((minutes) => (
                  <Chip
                    key={minutes}
                    selected={minutes === duration}
                    showSelectedCheck
                    onPress={() => selectDuration(minutes)}
                  >
                    {formatDuration(minutes)}
                  </Chip>
                ))}
              </ScrollView>

              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
                {(Object.keys(STATUS_LABELS) as RoomStatus[]).map((status) => (
                  <View key={status} style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <StatusDot color={colors[status]} />
                    <Text variant="labelLarge">{capitalize(STATUS_LABELS[status][0])}</Text>
                  </View>
                ))}
                <Chip
                  icon={onlyFree ? undefined : 'filter-variant'}
                  selected={onlyFree}
                  onPress={toggleOnlyFree}
                >
                  Libres uniquement
                </Chip>
              </View>

              <Text variant="bodySmall" style={{ marginTop: 12, color: ctx.secondary }}>
                Libre : disponible pendant {formatDuration(duration)}, avec {ROOM_MARGIN_MIN} min de
                marge avant le cours suivant. Juste : libre, mais moins longtemps ou avec moins de
                marge. Mis à jour à {updatedAt}.
              </Text>
            </View>
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
                <NodeTree nodes={view} rooms={NO_ROOMS} depth={0} ctx={ctx} />
              )}
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
}
