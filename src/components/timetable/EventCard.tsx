import { View } from 'react-native';

import type { PackedEvent } from '@howljs/calendar-kit';
import { Text } from 'react-native-paper';

import { readableOn } from '@/src/utils/color';

const EXAM_COLOR = 'rgb(186, 26, 26)';

// case d'un cours dans la grille, posée sur la couleur du cours
export function EventCard({ event }: { event: PackedEvent }) {
  const color = readableOn(event.color ?? '#9E9E9E');
  const exam = event.exam === true;

  return (
    <View
      style={[
        { flex: 1, padding: 6, gap: 2 },
        exam && { padding: 4, borderWidth: 2, borderRadius: 2, borderColor: EXAM_COLOR },
      ]}
    >
      {exam && (
        <View style={{ alignSelf: 'flex-start', borderRadius: 4, paddingHorizontal: 4, backgroundColor: EXAM_COLOR }}>
          <Text variant="labelSmall" style={{ color: 'white', fontWeight: '700' }}>
            DS
          </Text>
        </View>
      )}
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
