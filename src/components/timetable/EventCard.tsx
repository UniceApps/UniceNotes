import { View } from 'react-native';

import type { PackedEvent } from '@howljs/calendar-kit';
import { Text } from 'react-native-paper';

import { readableOn } from '@/src/utils/color';

// case d'un cours dans la grille, posée sur la couleur du cours
export function EventCard({ event }: { event: PackedEvent }) {
  const color = readableOn(event.color ?? '#9E9E9E');
  return (
    <View style={{ flex: 1, padding: 6, gap: 2 }}>
      <Text numberOfLines={4} style={{ fontWeight: '600', color: 'black', marginBottom: 4 }}>
        {event.title}
      </Text>
      {event.room ? (
        <Text variant="labelSmall" numberOfLines={2} style={{ color, opacity: 0.85 }}>
          {event.room}
        </Text>
      ) : null}
    </View>
  );
}
