import { ScrollView, View } from 'react-native';

import { Chip, Text } from 'react-native-paper';

import { SectionTitle } from '@/src/components/ui/SectionTitle';
import { capitalize, formatDuration } from '@/src/utils/date';
import { DURATION_OPTIONS, ROOM_MARGIN_MIN } from '@/src/utils/rooms';

import { ROOM_STATUSES, STATUS_LABELS, StatusDot, type StatusColors } from './status';

interface RoomFiltersProps {
  duration: number;
  onSelectDuration: (minutes: number) => void;
  onlyFree: boolean;
  onToggleOnlyFree: () => void;
  colors: StatusColors;
  secondary: string;
}

// durée voulue, légende des statuts et filtre « libres uniquement »
export function RoomFilters({
  duration,
  onSelectDuration,
  onlyFree,
  onToggleOnlyFree,
  colors,
  secondary,
}: RoomFiltersProps) {
  return (
    <View>
      <SectionTitle title="Pour combien de temps ?" />
      {/* déborde de la marge de la page pour défiler jusqu'au bord de l'écran */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={{ marginHorizontal: -20 }}
        contentContainerStyle={{ gap: 8, paddingHorizontal: 20 }}
      >
        {DURATION_OPTIONS.map((minutes) => (
          <Chip
            key={minutes}
            selected={minutes === duration}
            showSelectedCheck
            onPress={() => onSelectDuration(minutes)}
          >
            {formatDuration(minutes)}
          </Chip>
        ))}
      </ScrollView>

      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 16,
          marginTop: 16,
          paddingHorizontal: 4,
        }}
      >
        {ROOM_STATUSES.map((status) => (
          <View key={status} style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <StatusDot color={colors[status]} />
            <Text variant="labelLarge">{capitalize(STATUS_LABELS[status][0])}</Text>
          </View>
        ))}
        <Chip icon={onlyFree ? undefined : 'filter-variant'} selected={onlyFree} onPress={onToggleOnlyFree}>
          Libres uniquement
        </Chip>
      </View>

      <Text variant="bodySmall" style={{ marginTop: 12, paddingHorizontal: 4, color: secondary }}>
        Libre : disponible pendant {formatDuration(duration)}, avec {ROOM_MARGIN_MIN} min de marge avant le cours
        suivant. Juste : libre, mais moins longtemps ou avec moins de marge.
      </Text>
    </View>
  );
}
