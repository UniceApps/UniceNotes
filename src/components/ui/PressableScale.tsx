import { Pressable, type PressableProps, type StyleProp, type ViewStyle } from 'react-native';

import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);
const SPRING = { damping: 18, stiffness: 320, mass: 0.6 };

type PressableScaleProps = Omit<PressableProps, 'style'> & { style?: StyleProp<ViewStyle> };

// s'enfonce légèrement sous le doigt
export function PressableScale({ style, onPressIn, onPressOut, ...props }: PressableScaleProps) {
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <AnimatedPressable
      {...props}
      onPressIn={(event) => {
        scale.set(withSpring(0.97, SPRING));
        onPressIn?.(event);
      }}
      onPressOut={(event) => {
        scale.set(withSpring(1, SPRING));
        onPressOut?.(event);
      }}
      style={[style, animatedStyle]}
    />
  );
}
