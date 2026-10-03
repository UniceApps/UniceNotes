import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { getAppIconName, resetAppIcon, setAlternateAppIcon, supportsAlternateIcons } from 'expo-alternate-app-icons';
import { Image } from 'expo-image';
import { Icon, Text } from 'react-native-paper';

import { allAppIcons, appIconGroups, type AppIconOption } from '@/src/constants/icons';
import { setThemeId, themeOptions, useAppTheme, useThemeId, type AppTheme } from '@/src/theme';
import { haptics } from '@/src/utils/haptics';

function CheckBadge() {
  const theme = useAppTheme();
  return (
    <View style={[styles.badge, { backgroundColor: theme.colors.primary, borderColor: theme.colors.background }]}>
      <Icon source="check" size={12} color={theme.colors.onPrimary} />
    </View>
  );
}

// aperçu miniature de l'accueil avec les couleurs du thème
function ThemePreview({ preview }: { preview: AppTheme }) {
  const c = preview.colors;
  return (
    <View style={[styles.preview, { backgroundColor: c.background, borderColor: c.outlineVariant }]}>
      <View style={[styles.previewLine, { width: '40%', marginTop: 10, backgroundColor: c.primary }]} />
      <View style={[styles.previewLine, { width: '65%', height: 7, marginTop: 5, backgroundColor: c.onBackground }]} />
      <View style={[styles.previewCard, { height: 34, backgroundColor: c.primaryContainer }]}>
        <View style={[styles.previewLine, { width: '60%', backgroundColor: c.onPrimaryContainer }]} />
      </View>
      <View style={styles.previewTiles}>
        <View style={[styles.previewTile, { backgroundColor: c.elevation.level2 }]}>
          <View style={[styles.previewDot, { backgroundColor: c.tertiaryContainer }]} />
        </View>
        <View style={[styles.previewTile, { backgroundColor: c.elevation.level2 }]}>
          <View style={[styles.previewDot, { backgroundColor: c.secondaryContainer }]} />
        </View>
      </View>
    </View>
  );
}

export function ThemePicker() {
  const theme = useAppTheme();
  const themeId = useThemeId();

  function select(id: string) {
    if (id === themeId) return;
    haptics('selection');
    setThemeId(id);
  }

  return (
    <View style={styles.themeRow}>
      {themeOptions.map((option) => {
        const selected = option.id === themeId;
        return (
          <Pressable
            key={option.id}
            style={styles.themeItem}
            onPress={() => select(option.id)}
            accessibilityRole="radio"
            accessibilityState={{ selected }}
            accessibilityLabel={`${option.label}, ${option.description}`}
          >
            <View style={[styles.ring, { borderColor: selected ? theme.colors.primary : 'transparent' }]}>
              <ThemePreview preview={theme.dark ? option.dark : option.light} />
              {selected && <CheckBadge />}
            </View>
            <Text
              variant="labelLarge"
              style={{ marginTop: 6, color: selected ? theme.colors.primary : theme.colors.onSurface }}
            >
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function currentIconName(): string | null {
  const name = getAppIconName();
  return name === 'UniceNotes' ? null : name;
}

interface IconTileProps {
  icon: AppIconOption;
  selected: boolean;
  width: number | `${number}%`;
  onPress: () => void;
}

function IconTile({ icon, selected, width, onPress }: IconTileProps) {
  const theme = useAppTheme();
  return (
    <Pressable
      style={[styles.iconTile, { width }]}
      onPress={onPress}
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      accessibilityLabel={icon.author ? `${icon.label}, ${icon.author}` : icon.label}
    >
      <View style={[styles.iconRing, { borderColor: selected ? theme.colors.primary : 'transparent' }]}>
        <Image source={icon.source} style={styles.iconImage} />
        {selected && <CheckBadge />}
      </View>
      <Text
        variant="labelMedium"
        numberOfLines={1}
        style={{ marginTop: 4, color: selected ? theme.colors.primary : theme.colors.onSurface }}
      >
        {icon.label}
      </Text>
      {icon.author && (
        <Text variant="labelSmall" numberOfLines={1} style={{ color: theme.colors.onSurfaceVariant }}>
          {icon.author}
        </Text>
      )}
    </Pressable>
  );
}

// compact : une ligne défilante qui déborde de `bleed` px de chaque côté (marge du conteneur)
export function IconPicker({ compact = false, bleed = 0 }: { compact?: boolean; bleed?: number }) {
  const theme = useAppTheme();
  const [current, setCurrent] = useState<string | null>(() => (supportsAlternateIcons ? currentIconName() : null));

  if (!supportsAlternateIcons) {
    return (
      <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
        Ton appareil ne permet pas de changer l&apos;icône de l&apos;application.
      </Text>
    );
  }

  async function select(name: string | null) {
    if (name === current) return;
    haptics('selection');
    const previous = current;
    setCurrent(name);
    try {
      if (name === null) await resetAppIcon();
      else await setAlternateAppIcon(name);
    } catch (e) {
      console.warn("[icons] impossible de changer l'icône", e);
      setCurrent(previous);
      haptics('error');
    }
  }

  const tile = (icon: AppIconOption) => (
    <IconTile
      key={icon.name ?? 'default'}
      icon={icon}
      selected={icon.name === current}
      width={compact ? 80 : '25%'}
      onPress={() => select(icon.name)}
    />
  );

  if (compact) {
    return (
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={{ marginHorizontal: -bleed }}
        contentContainerStyle={{ paddingHorizontal: bleed - 4 }}
      >
        {allAppIcons.map(tile)}
      </ScrollView>
    );
  }

  return (
    <View style={{ gap: 12 }}>
      {appIconGroups.map((group) => (
        <View key={group.title}>
          <Text variant="labelLarge" style={{ color: theme.colors.onSurfaceVariant, marginBottom: 4 }}>
            {group.title}
          </Text>
          <View style={styles.iconGrid}>{group.icons.map(tile)}</View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  themeRow: { flexDirection: 'row', gap: 8 },
  themeItem: { flex: 1, alignItems: 'center' },
  ring: { width: '100%', borderWidth: 2.5, borderRadius: 20, padding: 3 },
  preview: {
    height: 120,
    borderRadius: 15,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
    paddingHorizontal: 7,
  },
  previewLine: { height: 4, borderRadius: 2, opacity: 0.85 },
  previewCard: { marginTop: 8, borderRadius: 8, justifyContent: 'center', paddingHorizontal: 6 },
  previewTiles: { flexDirection: 'row', gap: 5, marginTop: 5 },
  previewTile: { flex: 1, height: 26, borderRadius: 7, padding: 5 },
  previewDot: { width: 10, height: 10, borderRadius: 3 },

  iconGrid: { flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -4 },
  iconTile: { alignItems: 'center', paddingHorizontal: 4, paddingVertical: 6 },
  iconRing: { borderWidth: 2.5, borderRadius: 20, padding: 3 },
  iconImage: { width: 58, height: 58, borderRadius: 14 },
  badge: {
    position: 'absolute',
    right: -4,
    bottom: -4,
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
