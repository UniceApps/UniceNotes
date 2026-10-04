import { Pressable, View } from 'react-native';

import { useRouter } from 'expo-router';
import { NativeTabs } from 'expo-router/unstable-native-tabs';
import { Text } from 'react-native-paper';

import { useAgenda } from '@/src/hooks/useAgenda';
import { useAppTheme } from '@/src/theme';
import { getClassStatus } from '@/src/utils/agenda';
import { haptics } from '@/src/utils/haptics';

// mini-lecteur au-dessus de la barre d'onglets (iOS 26) : le cours en cours, sinon le prochain.
// Barre réduite au défilement : il passe à côté d'elle, en version compacte.
export function NextClassAccessory() {
  const router = useRouter();
  const theme = useAppTheme();
  const placement = NativeTabs.BottomAccessory.usePlacement();
  const { next, now } = useAgenda();

  if (!next) return null;

  const c = theme.colors;
  const inline = placement === 'inline';
  const status = getClassStatus(next, now);
  const room = next.room || 'Salle non précisée';

  function open() {
    haptics('light');
    router.navigate('/timetable');
  }

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${status.label} : ${next.title}, ${room}${status.ongoing ? `, ${status.remaining}` : ''}`}
      accessibilityHint="Ouvre l'emploi du temps"
      onPress={open}
      style={{
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        gap: inline ? 8 : 12,
        paddingHorizontal: inline ? 12 : 18,
      }}
    >
      <View style={{ width: 4, height: inline ? 16 : 28, borderRadius: 2, backgroundColor: next.color }} />
      <View style={{ flex: 1 }}>
        <Text variant={inline ? 'labelLarge' : 'titleSmall'} numberOfLines={1}>
          {next.title}
        </Text>
        {!inline && (
          <Text variant="bodySmall" numberOfLines={1} style={{ color: c.onSurfaceVariant }}>
            {room}
          </Text>
        )}
      </View>
      <Text variant="labelLarge" numberOfLines={1} style={{ color: status.ongoing ? c.primary : c.onSurfaceVariant }}>
        {status.ongoing ? status.remaining : status.label}
      </Text>
    </Pressable>
  );
}
