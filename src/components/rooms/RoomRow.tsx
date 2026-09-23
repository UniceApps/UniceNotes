import React from 'react';
import { View } from 'react-native';

import { Text } from 'react-native-paper';

import type { RoomEntry } from '@/src/types';
import { describeAvailability } from '@/src/utils/rooms';

import { StatusDot, type StatusColors } from './status';

export const ROOM_INDENT = 16;

export interface RoomsViewContext {
  now: number;
  duration: number;
  colors: StatusColors;
  secondary: string;
  // fond de l'en-tête d'un niveau ouvert
  highlight: string;
  // appelé quand un niveau s'ouvre ou se ferme
  onTreeChange: () => void;
}

export function RoomRow({ entry, depth, ctx }: { entry: RoomEntry; depth: number; ctx: RoomsViewContext }) {
  const { headline, detail } = describeAvailability(entry.availability, ctx.now, ctx.duration);
  return (
    <View
      accessible
      accessibilityLabel={`${entry.room.name}. ${headline}${detail ? `. ${detail}` : ''}`}
      style={{
        flexDirection: 'row',
        gap: 12,
        paddingVertical: 8,
        paddingLeft: 25 + depth * ROOM_INDENT,
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
