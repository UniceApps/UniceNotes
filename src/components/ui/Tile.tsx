import type { ReactNode } from 'react';
import { View, type StyleProp, type ViewStyle } from 'react-native';

import { Text } from 'react-native-paper';

import { useAppTheme, type Tone } from '@/src/theme';

import { IconBadge } from './IconBadge';
import { PressableScale } from './PressableScale';

// tuiles deux par ligne
export function TileGrid({ children }: { children: ReactNode }) {
  return <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>{children}</View>;
}

interface TileProps {
  label: string;
  subtitle: string;
  // icône tonale, ou badge sur mesure (logo d'un service…)
  icon?: string;
  tone?: Tone;
  badge?: ReactNode;
  // à droite du badge (bouton épingle…)
  aside?: ReactNode;
  onPress: () => void;
  onLongPress?: () => void;
  accessibilityHint?: string;
  style?: StyleProp<ViewStyle>;
}

export function Tile({
  label,
  subtitle,
  icon,
  tone,
  badge,
  aside,
  onPress,
  onLongPress,
  accessibilityHint,
  style,
}: TileProps) {
  const theme = useAppTheme();
  const leading = badge ?? (icon ? <IconBadge icon={icon} tone={tone} /> : null);

  return (
    <PressableScale
      accessibilityRole="button"
      accessibilityLabel={`${label}, ${subtitle}`}
      accessibilityHint={accessibilityHint}
      style={[
        {
          flexGrow: 1,
          flexBasis: '40%',
          borderRadius: 24,
          padding: 16,
          backgroundColor: theme.colors.elevation.level2,
        },
        style,
      ]}
      onPress={onPress}
      onLongPress={onLongPress}
    >
      {aside ? (
        <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          {leading}
          {aside}
        </View>
      ) : (
        leading
      )}
      <Text variant="titleMedium" numberOfLines={1} style={{ marginTop: 14 }}>
        {label}
      </Text>
      <Text variant="bodySmall" numberOfLines={1} style={{ color: theme.colors.onSurfaceVariant }}>
        {subtitle}
      </Text>
    </PressableScale>
  );
}
