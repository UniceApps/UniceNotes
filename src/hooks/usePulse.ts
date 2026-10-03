import { useEffect } from 'react';

import { cancelAnimation, useAnimatedStyle, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';

// opacité qui pulse en boucle, de 1 à min
export function usePulse(min: number, duration: number) {
  const opacity = useSharedValue(1);

  useEffect(() => {
    opacity.set(withRepeat(withTiming(min, { duration }), -1, true));
    return () => cancelAnimation(opacity);
  }, [opacity, min, duration]);

  return useAnimatedStyle(() => ({ opacity: opacity.value }));
}
