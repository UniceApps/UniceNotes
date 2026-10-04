import { Platform } from 'react-native';

import { usePathname } from 'expo-router';
import { NativeTabs } from 'expo-router/unstable-native-tabs';

import { NextClassAccessory } from '@/src/components/NextClassAccessory';
import { useHasUpcomingClass } from '@/src/hooks/useHasUpcomingClass';
import { useAppTheme } from '@/src/theme';
import { withAlpha } from '@/src/utils/color';

// barre d'onglets du système : Liquid Glass sur iOS, Material 3 aux couleurs du thème sur Android
export default function TabsLayout() {
  const theme = useAppTheme();
  const pathname = usePathname();
  const hasUpcomingClass = useHasUpcomingClass();
  const c = theme.colors;
  const android = Platform.OS === 'android';

  // accessoire d'iOS 26 ; le prochain cours est déjà en grand sur l'accueil
  const showAccessory = Platform.OS === 'ios' && hasUpcomingClass && pathname !== '/home';

  return (
    <NativeTabs
      tintColor={c.primary}
      minimizeBehavior="onScrollDown"
      backBehavior="initialRoute"
      labelVisibilityMode="labeled"
      backgroundColor={android ? c.elevation.level2 : undefined}
      indicatorColor={c.secondaryContainer}
      rippleColor={withAlpha(c.primary, 0.12)}
      iconColor={android ? { default: c.onSurfaceVariant, selected: c.onSecondaryContainer } : undefined}
      labelStyle={
        android
          ? {
              default: { color: c.onSurfaceVariant, fontFamily: 'Bahnschrift' },
              selected: { color: c.onSurface, fontFamily: 'Bahnschrift' },
            }
          : undefined
      }
    >
      {showAccessory && (
        <NativeTabs.BottomAccessory>
          <NextClassAccessory />
        </NativeTabs.BottomAccessory>
      )}

      <NativeTabs.Trigger name="home" accessibilityLabel="Accueil">
        <NativeTabs.Trigger.Icon sf={{ default: 'house', selected: 'house.fill' }} md="home" />
        <NativeTabs.Trigger.Label>Accueil</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="timetable" accessibilityLabel="Emploi du temps">
        <NativeTabs.Trigger.Icon sf="calendar" md="calendar_month" />
        <NativeTabs.Trigger.Label>EDT</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="free-rooms" accessibilityLabel="Salles libres">
        <NativeTabs.Trigger.Icon
          sf={{ default: 'door.left.hand.closed', selected: 'door.left.hand.open' }}
          md="meeting_room"
        />
        <NativeTabs.Trigger.Label>Salles</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="ent" accessibilityLabel="Services de l'ENT">
        <NativeTabs.Trigger.Icon sf={{ default: 'square.grid.2x2', selected: 'square.grid.2x2.fill' }} md="apps" />
        <NativeTabs.Trigger.Label>ENT</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="settings" accessibilityLabel="Paramètres">
        <NativeTabs.Trigger.Icon sf={{ default: 'gearshape', selected: 'gearshape.fill' }} md="settings" />
        <NativeTabs.Trigger.Label>Paramètres</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
