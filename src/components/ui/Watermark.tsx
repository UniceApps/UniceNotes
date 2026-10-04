import { Image } from 'expo-image';

// logo en filigrane dans le coin d'une carte (overflow: 'hidden')
export function Watermark({ color, size = 170 }: { color: string; size?: number }) {
  return (
    <Image
      source={require('../../assets/white.png')}
      tintColor={color}
      style={{ position: 'absolute', right: -size / 4, bottom: -size / 4, width: size, height: size, opacity: 0.07 }}
    />
  );
}
