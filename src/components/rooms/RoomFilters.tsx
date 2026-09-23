import React from 'react';
import { ScrollView, View } from 'react-native';

import { Chip, Text } from 'react-native-paper';

import { DURATION_OPTIONS, formatDuration, ROOM_MARGIN_MIN } from '@/src/utils/rooms';

import { ROOM_STATUSES, STATUS_LABELS, StatusDot, type StatusColors } from './status';

function capitalize(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

interface RoomFiltersProps {
  duration: number;
  onSelectDuration: (minutes: number) => void;
  onlyFree: boolean;
  onToggleOnlyFree: () => void;
  colors: StatusColors;
  secondary: string;
  updatedAt: string | null;
}

// durée voulue, légende des statuts et filtre « libres uniquement »
export function RoomFilters({
  duration,
  onSelectDuration,
  onlyFree,
  onToggleOnlyFree,
  colors,
  secondary,
  updatedAt,
}: RoomFiltersProps) {
  return (
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
            onPress={() => onSelectDuration(minutes)}
          >
            {formatDuration(minutes)}
          </Chip>
        ))}
      </ScrollView>

      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
        {ROOM_STATUSES.map((status) => (
          <View key={status} style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <StatusDot color={colors[status]} />
            <Text variant="labelLarge">{capitalize(STATUS_LABELS[status][0])}</Text>
          </View>
        ))}
        <Chip
          icon={onlyFree ? undefined : 'filter-variant'}
          selected={onlyFree}
          onPress={onToggleOnlyFree}
        >
          Libres uniquement
        </Chip>
      </View>

      <Text variant="bodySmall" style={{ marginTop: 12, color: secondary }}>
        Libre : disponible pendant {formatDuration(duration)}, avec {ROOM_MARGIN_MIN} min de
        marge avant le cours suivant. Juste : libre, mais moins longtemps ou avec moins de
        marge. Mis à jour à {updatedAt}.
      </Text>
    </View>
  );
}
