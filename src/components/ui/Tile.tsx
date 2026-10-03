import type { ReactNode } from 'react';
import { View, type ImageSourcePropType } from 'react-native';

import { Image } from 'expo-image';
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
  icon: string;
  tone?: Tone;
  // logo affiché à la place de l'icône
  image?: ImageSourcePropType;
  onPress: () => void;
}

export function Tile({ label, subtitle, icon, tone, image, onPress }: TileProps) {
  const theme = useAppTheme();

  return (
    <PressableScale
      accessibilityRole="button"
      accessibilityLabel={`${label}, ${subtitle}`}
      style={{
        flexGrow: 1,
        flexBasis: '40%',
        borderRadius: 24,
        padding: 16,
        backgroundColor: theme.colors.elevation.level2,
      }}
      onPress={onPress}
    >
      {image ? (
        <Image source={image} style={{ width: 44, height: 44, borderRadius: 14 }} />
      ) : (
        <IconBadge icon={icon} tone={tone} />
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
