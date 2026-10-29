import { View } from 'react-native';

import type { PackedAllDayEvent, PackedEvent, SizeAnimation } from '@howljs/calendar-kit';
import { Icon, Text } from 'react-native-paper';
import Animated, { useAnimatedStyle } from 'react-native-reanimated';

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

// bandeau de l'en-tête : jour férié sur tertiaryContainer, ou cours ADE de 24 h et plus ; compact : vue semaine
export function AllDayCard({
  event,
  size,
  compact,
}: {
  event: PackedAllDayEvent;
  size: SizeAnimation;
  compact: boolean;
}) {
  const theme = useAppTheme();
  const holiday = event.holiday === true;
  const color = holiday ? theme.colors.onTertiaryContainer : getCourseColors(theme, event.title ?? '').onContainer;
  const heightStyle = useAnimatedStyle(() => ({ height: size.height.value - 2 }));

  return (
    <Animated.View
      style={[{ flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: compact ? 2 : 4 }, heightStyle]}
    >
      {holiday && !compact && <Icon source="calendar-star" size={14} color={color} />}
      <Text variant="labelSmall" numberOfLines={compact ? 2 : 1} style={{ flexShrink: 1, color, fontWeight: '600' }}>
        {event.title}
      </Text>
    </Animated.View>
  );
}
