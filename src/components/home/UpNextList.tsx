import { View } from 'react-native';

import { Text } from 'react-native-paper';

import { PressableScale } from '@/src/components/ui/PressableScale';
import { SectionTitle } from '@/src/components/ui/SectionTitle';
import { useAppTheme } from '@/src/theme';
import type { AgendaClass } from '@/src/utils/agenda';
import { formatClock } from '@/src/utils/date';

const MAX_ROWS = 4;

interface UpNextListProps {
  items: AgendaClass[];
  dayEnd: Date;
  onPress: () => void;
}

// cours suivants, même jour que la carte principale
export function UpNextList({ items, dayEnd, onPress }: UpNextListProps) {
  const theme = useAppTheme();
  const c = theme.colors;
  const hidden = items.length - MAX_ROWS;

  return (
    <View>
      <SectionTitle title="À suivre" aside={`Fin à ${formatClock(dayEnd)}`} />
      <PressableScale
        accessibilityRole="button"
        accessibilityHint="Ouvre l'emploi du temps"
        style={{ borderRadius: 24, padding: 16, gap: 16, backgroundColor: c.elevation.level2 }}
        onPress={onPress}
      >
        {items.slice(0, MAX_ROWS).map((item, index) => (
          <View key={`${item.id}-${index}`} style={{ flexDirection: 'row', gap: 12 }}>
            <View style={{ width: 46 }}>
              <Text variant="titleSmall">{formatClock(item.start)}</Text>
              <Text variant="bodySmall" style={{ color: c.onSurfaceVariant }}>
                {formatClock(item.end)}
              </Text>
            </View>
            <View style={{ width: 4, borderRadius: 2, backgroundColor: item.color }} />
            <View style={{ flex: 1 }}>
              <Text variant="titleSmall" numberOfLines={2}>
                {item.title}
              </Text>
              <Text variant="bodySmall" numberOfLines={1} style={{ color: c.onSurfaceVariant }}>
                {item.room || 'Salle non précisée'}
              </Text>
            </View>
          </View>
        ))}
        {hidden > 0 && (
          <Text variant="labelLarge" style={{ color: c.primary, marginLeft: 62 }}>
            + {hidden} {hidden > 1 ? 'autres cours' : 'autre cours'}
          </Text>
        )}
      </PressableScale>
    </View>
  );
}
