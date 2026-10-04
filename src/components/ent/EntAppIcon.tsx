import { View } from 'react-native';

import { Image } from 'expo-image';

import { IconBadge } from '@/src/components/ui/IconBadge';
import type { EntApp } from '@/src/constants/ent';

// logo du service sur fond blanc, comme une icône d'app (lisible en thème sombre), sinon pictogramme tonal
export function EntAppIcon({ app, size = 44 }: { app: EntApp; size?: number }) {
  if (!app.image) return <IconBadge icon={app.icon} tone={app.tone} size={size} />;

  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size * 0.32,
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        backgroundColor: '#FFFFFF',
      }}
    >
      <Image source={app.image} contentFit="contain" style={{ width: size * 0.8, height: size * 0.8 }} />
    </View>
  );
}
