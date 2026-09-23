import React from 'react';
import { View } from 'react-native';

import { Divider, Text } from 'react-native-paper';

import type { RoomEntry } from '@/src/types';

import { RoomRow, type RoomsViewContext } from './RoomRow';

// salles épinglées, affichées au-dessus des filtres
export function FavoriteRooms({ entries, ctx }: { entries: RoomEntry[]; ctx: RoomsViewContext }) {
  if (entries.length === 0) return null;

  return (
    <View>
      <Text variant="titleMedium" style={{ paddingHorizontal: 25, paddingTop: 16, paddingBottom: 4 }}>
        Salles favorites
      </Text>
      {entries.map((entry) => (
        <RoomRow key={entry.room.id} entry={entry} depth={0} ctx={ctx} showPath />
      ))}
      <Divider style={{ marginTop: 8 }} />
    </View>
  );
}
