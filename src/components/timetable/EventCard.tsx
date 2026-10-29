import { View } from 'react-native';

import type { PackedEvent } from '@howljs/calendar-kit';
import { Text } from 'react-native-paper';

import { getCourseColors, useAppTheme } from '@/src/theme';

// case d'un cours dans la grille, posée sur la couleur du cours (voir TimetableScreen)
export function EventCard({ event }: { event: PackedEvent }) {
  const theme = useAppTheme();
  const color = getCourseColors(theme, event.title ?? '').onContainer;
  const exam = event.exam === true;
  const { error, onError } = theme.colors;

  return (
    <View
      style={[
        { flex: 1, padding: 6, gap: 2 },
        exam && { padding: 4, borderWidth: 2, borderRadius: 2, borderColor: error },
      ]}
    >
      {exam && (
        <View style={{ alignSelf: 'flex-start', borderRadius: 4, paddingHorizontal: 4, backgroundColor: error }}>
          <Text variant="labelSmall" style={{ color: onError, fontWeight: '700' }}>
            DS
          </Text>
        </View>
      )}
      <Text numberOfLines={4} style={{ fontWeight: '600', color, marginBottom: 4 }}>
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
