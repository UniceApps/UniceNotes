import { useState } from 'react';
import { View } from 'react-native';

import { IconButton, Snackbar, Text } from 'react-native-paper';

import { EntAppIcon } from '@/src/components/ent/EntAppIcon';
import { Screen } from '@/src/components/ui/Screen';
import { SectionTitle } from '@/src/components/ui/SectionTitle';
import { Tile, TileGrid } from '@/src/components/ui/Tile';
import { ENT_APPS, type EntApp } from '@/src/constants/ent';
import { MAX_PINNED_APPS, togglePinnedApp, usePinnedApps } from '@/src/hooks/usePinnedApps';
import { useAppTheme } from '@/src/theme';
import { openEntApp } from '@/src/utils/browser';
import { haptics } from '@/src/utils/haptics';

export default function EntScreen() {
  const theme = useAppTheme();
  const c = theme.colors;
  const pinned = usePinnedApps();
  const [notice, setNotice] = useState<string | null>(null);

  function togglePin(app: EntApp) {
    const wasPinned = pinned.includes(app.id);
    if (!togglePinnedApp(app.id)) {
      haptics('warning');
      setNotice(`Accès rapide complet : ${MAX_PINNED_APPS} apps maximum`);
      return;
    }
    haptics('selection');
    setNotice(wasPinned ? `${app.label} retiré de l'accès rapide` : `${app.label} épinglé à l'accès rapide`);
  }

  return (
    <Screen
      tab
      title="ENT"
      subtitle="Tes services universitaires"
      overlay={
        <Snackbar visible={notice !== null} onDismiss={() => setNotice(null)} duration={2500}>
          {notice ?? ''}
        </Snackbar>
      }
    >
      <View>
        <SectionTitle title="Services" aside={`${pinned.length}/${MAX_PINNED_APPS} épinglés`} />
        <TileGrid>
          {ENT_APPS.map((app) => {
            const isPinned = pinned.includes(app.id);
            return (
              <Tile
                key={app.id}
                label={app.label}
                subtitle={app.subtitle}
                badge={<EntAppIcon app={app} />}
                aside={
                  <IconButton
                    icon={isPinned ? 'pin' : 'pin-outline'}
                    size={20}
                    iconColor={isPinned ? c.primary : c.onSurfaceVariant}
                    accessibilityLabel={
                      isPinned ? `Retirer ${app.label} de l'accès rapide` : `Épingler ${app.label} à l'accès rapide`
                    }
                    style={{ margin: -6 }}
                    onPress={() => togglePin(app)}
                  />
                }
                accessibilityHint="Appui long pour l'épingler à l'accès rapide ou l'en retirer"
                // la bordure ne décale pas le contenu : 14 + 2 = le padding de 16 d'une tuile
                style={{ padding: 14, borderWidth: 2, borderColor: isPinned ? c.primary : 'transparent' }}
                onPress={() => openEntApp(app.id)}
                onLongPress={() => togglePin(app)}
              />
            );
          })}
        </TileGrid>
      </View>

      <Text variant="bodySmall" style={{ textAlign: 'center', color: c.onSurfaceVariant }}>
        Épingle jusqu&apos;à {MAX_PINNED_APPS} services pour les retrouver sur l&apos;accueil et sur l&apos;icône de
        l&apos;app. Tes connexions restent enregistrées sur cet appareil.
      </Text>
    </Screen>
  );
}
