import React from 'react';
import { View } from 'react-native';

import { IconButton, Text } from 'react-native-paper';

import type { RoomEntry } from '@/src/types';
import { describeAvailability } from '@/src/utils/rooms';

import { StatusDot, type StatusColors } from './status';

export const ROOM_INDENT = 16;

export interface RoomsViewContext {
  now: number;
  duration: number;
  colors: StatusColors;
  secondary: string;
  // étoile des favoris
  accent: string;
  // fond de l'en-tête d'un niveau ouvert
  highlight: string;
  // appelé quand un niveau s'ouvre ou se ferme
  onTreeChange: () => void;
  isFavorite: (roomId: string) => boolean;
  onToggleFavorite: (roomId: string) => void;
}

export function RoomRow({
  entry,
  depth,
  ctx,
  showPath = false,
}: {
  entry: RoomEntry;
  depth: number;
  ctx: RoomsViewContext;
  showPath?: boolean;
}) {
  const { headline, detail } = describeAvailability(entry.availability, ctx.now, ctx.duration);
  const favorite = ctx.isFavorite(entry.room.id);
  const path = showPath ? entry.room.path.join(' · ') : '';

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 8,
        paddingLeft: 25 + depth * ROOM_INDENT,
        paddingRight: 13,
      }}
    >
      <View
        accessible
        accessibilityLabel={`${entry.room.name}${path ? `, ${path}` : ''}. ${headline}${detail ? `. ${detail}` : ''}`}
        style={{ flex: 1, flexDirection: 'row', gap: 12 }}
      >
        <View style={{ width: 24, alignItems: 'center', paddingTop: 5 }}>
          <StatusDot color={ctx.colors[entry.availability.status]} />
        </View>
        <View style={{ flex: 1 }}>
          <Text variant="bodyLarge">{entry.room.name}</Text>
          {path ? (
            <Text variant="bodySmall" style={{ color: ctx.secondary }} numberOfLines={1}>
              {path}
            </Text>
          ) : null}
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
      <IconButton
        icon={favorite ? 'star' : 'star-outline'}
        iconColor={favorite ? ctx.accent : ctx.secondary}
        size={22}
        style={{ margin: 0 }}
        accessibilityLabel={favorite ? `Retirer ${entry.room.name} des favoris` : `Ajouter ${entry.room.name} aux favoris`}
        onPress={() => ctx.onToggleFavorite(entry.room.id)}
      />
    </View>
  );
}
