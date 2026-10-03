import { Screen } from '@/src/components/ui/Screen';
import { Tile, TileGrid } from '@/src/components/ui/Tile';
import { ENT_APPS } from '@/src/constants/ent';
import type { Tone } from '@/src/theme';
import { openURL } from '@/src/utils/browser';

const TONES: Tone[] = ['primary', 'tertiary', 'secondary'];

export default function EntScreen() {
  return (
    <Screen modal title="ENT" subtitle="Tes services universitaires">
      <TileGrid>
        {ENT_APPS.map((app, index) => (
          <Tile
            key={app.label}
            label={app.label}
            subtitle={app.subtitle}
            icon={app.icon}
            image={app.image}
            tone={TONES[index % TONES.length]}
            onPress={() => openURL(app.url)}
          />
        ))}
      </TileGrid>
    </Screen>
  );
}
