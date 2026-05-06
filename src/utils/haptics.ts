import * as Haptics from 'expo-haptics';
import type { HapticIntensity } from '../types';

let hapticsEnabled = true;

export function setHapticsEnabled(value: boolean): void {
  hapticsEnabled = value;
}

export function haptics(intensity: HapticIntensity): void {
  if (!hapticsEnabled) return;
  switch (intensity) {
    case 'light':
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      break;
    case 'medium':
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      break;
    case 'heavy':
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      break;
    case 'error':
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      break;
    case 'success':
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      break;
    case 'warning':
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      break;
    case 'selection':
      Haptics.selectionAsync();
      break;
  }
}
