import { View } from 'react-native';

import { Card } from '@/src/components/ui/Card';
import { SectionTitle } from '@/src/components/ui/SectionTitle';
import type { RoomEntry } from '@/src/types';

import { RoomRow, type RoomsViewContext } from './RoomRow';

// salles épinglées, au-dessus des filtres
export function FavoriteRooms({ entries, ctx }: { entries: RoomEntry[]; ctx: RoomsViewContext }) {
  return (
    <View>
      <SectionTitle title="Salles favorites" />
      <Card padded={false} style={{ paddingVertical: 4 }}>
        {entries.map((entry) => (
          <RoomRow key={entry.room.id} entry={entry} depth={0} ctx={ctx} showPath />
        ))}
      </Card>
    </View>
  );
}
