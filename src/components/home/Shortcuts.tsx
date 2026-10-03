import { View } from 'react-native';

import { SectionTitle } from '@/src/components/ui/SectionTitle';
import { Tile, TileGrid } from '@/src/components/ui/Tile';
import type { Tone } from '@/src/theme';

export interface Shortcut {
  key: string;
  icon: string;
  label: string;
  subtitle: string;
  tone: Tone;
  onPress: () => void;
}

export function Shortcuts({ items }: { items: Shortcut[] }) {
  return (
    <View>
      <SectionTitle title="Accès rapide" />
      <TileGrid>
        {items.map(({ key, ...item }) => (
          <Tile key={key} {...item} />
        ))}
      </TileGrid>
    </View>
  );
}
