import { Alert, View } from 'react-native';

import { Icon } from 'react-native-paper';

import { EntAppIcon } from '@/src/components/ent/EntAppIcon';
import { SectionTitle } from '@/src/components/ui/SectionTitle';
import { Tile, TileGrid } from '@/src/components/ui/Tile';
import { ENT_APPS, getEntApp, type EntApp } from '@/src/constants/ent';
import { MAX_PINNED_APPS, togglePinnedApp, usePinnedApps } from '@/src/hooks/usePinnedApps';
import { useAppTheme } from '@/src/theme';
import { openEntApp } from '@/src/utils/browser';
import { haptics } from '@/src/utils/haptics';

const BADGE = { width: 44, height: 44, borderRadius: 14 } as const;

// les 3 apps épinglées depuis l'onglet ENT, puis l'ENT et toutes les autres
export function QuickAccess({ onOpenEnt }: { onOpenEnt: () => void }) {
  const theme = useAppTheme();
  const c = theme.colors;
  const pinnedIds = usePinnedApps();
  const pinned = pinnedIds.map((id) => getEntApp(id)).filter((app): app is EntApp => app !== undefined);
  const others = ENT_APPS.filter((app) => !pinnedIds.includes(app.id));
  const emptySlots = Math.max(0, MAX_PINNED_APPS - pinned.length);
  const othersLabel = `${others.length} ${pinned.length === 0 ? 'apps' : 'autres apps'}`;

  function confirmUnpin(app: EntApp) {
    haptics('warning');
    Alert.alert(app.label, "Retirer ce service de l'accès rapide ?", [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Retirer',
        style: 'destructive',
        onPress: () => {
          togglePinnedApp(app.id);
          haptics('selection');
        },
      },
    ]);
  }

  return (
    <View>
      <SectionTitle title="Accès rapide" aside="Modifier" onPressAside={onOpenEnt} />
      <TileGrid>
        {pinned.map((app) => (
          <Tile
            key={app.id}
            label={app.label}
            subtitle={app.subtitle}
            badge={<EntAppIcon app={app} />}
            accessibilityHint="Appui long pour le retirer de l'accès rapide"
            onPress={() => openEntApp(app.id)}
            onLongPress={() => confirmUnpin(app)}
          />
        ))}

        {/* place libre : mène à l'onglet ENT pour épingler une app */}
        {Array.from({ length: emptySlots }, (_, index) => (
          <Tile
            key={`empty-${index}`}
            label="Ajouter"
            subtitle="Épingle une app"
            badge={
              <View
                style={[BADGE, { alignItems: 'center', justifyContent: 'center', backgroundColor: c.surfaceVariant }]}
              >
                <Icon source="plus" size={24} color={c.onSurfaceVariant} />
              </View>
            }
            style={{
              padding: 14.5,
              borderWidth: 1.5,
              borderStyle: 'dashed',
              borderColor: c.outlineVariant,
              backgroundColor: 'transparent',
            }}
            onPress={onOpenEnt}
          />
        ))}

        {/* les autres apps en miniature, comme un dossier de l'écran d'accueil */}
        <Tile
          label="ENT"
          subtitle={othersLabel}
          badge={
            <View
              style={[
                BADGE,
                { padding: 4, gap: 4, flexDirection: 'row', flexWrap: 'wrap', backgroundColor: c.surfaceVariant },
              ]}
            >
              {others.slice(0, 4).map((app) => (
                <EntAppIcon key={app.id} app={app} size={16} />
              ))}
            </View>
          }
          onPress={onOpenEnt}
        />
      </TileGrid>
    </View>
  );
}
