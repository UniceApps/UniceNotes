import { FadeInDown, LinearTransition } from 'react-native-reanimated';

// apparition en cascade, puis glissement quand un bloc voisin change de taille
export const enter = (index: number) => FadeInDown.duration(450).delay(index * 70);
export const layout = LinearTransition.duration(250);
