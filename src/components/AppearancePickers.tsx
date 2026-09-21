import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { Image } from 'expo-image';
import { getAppIconName, resetAppIcon, setAlternateAppIcon, supportsAlternateIcons } from 'expo-alternate-app-icons';

import { Icon, Text } from 'react-native-paper';

import { allAppIcons, appIconGroups, type AppIconOption } from '@/src/constants/icons';
import { getTheme, setThemeId, themeOptions, useChoosenTheme, useThemeId, type AppTheme } from '@/src/constants/theme';
import { haptics } from '@/src/utils/haptics';

function CheckBadge() {
  const theme = useChoosenTheme();
  return (
    <View style={[styles.badge, { backgroundColor: theme.colors.primary, borderColor: theme.colors.background }]}>
      <Icon source="check" size={12} color={theme.colors.onPrimary} />
    </View>
  );
}

// ---------------------------------------------------------------------------
// Thèmes
// ---------------------------------------------------------------------------

// aperçu miniature d'un écran de l'app avec les couleurs du thème
function ThemePreview({ preview }: { preview: AppTheme }) {
  const c = preview.colors;
  return (
    <View style={[styles.preview, { backgroundColor: c.background, borderColor: c.outlineVariant }]}>
      <View style={[styles.previewBar, { backgroundColor: c.elevation.level2 }]}>
        <View style={[styles.previewLine, { width: '45%', backgroundColor: c.onSurface }]} />
      </View>
      <View style={styles.previewBody}>
        <View style={[styles.previewCard, { backgroundColor: c.primaryContainer }]}>
          <View style={[styles.previewLine, { width: '70%', backgroundColor: c.onPrimaryContainer }]} />
        </View>
        <View style={[styles.previewCard, { backgroundColor: c.secondaryContainer }]}>
          <View style={[styles.previewLine, { width: '50%', backgroundColor: c.onSecondaryContainer }]} />
        </View>
      </View>
      <View style={[styles.previewFab, { backgroundColor: c.primary }]} />
    </View>
  );
}

export function ThemePicker() {
  const theme = useChoosenTheme();
  const themeId = useThemeId();

  function select(id: string) {
    if (id === themeId) return;
    haptics('medium');
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
              <ThemePreview preview={getTheme(option.id, theme.dark)} />
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

// ---------------------------------------------------------------------------
// Icônes
// ---------------------------------------------------------------------------

function currentIconName(): string | null {
  const name = getAppIconName();
  return name === 'UniceNotes' ? null : name;
}

function IconTile({
  icon,
  selected,
  width,
  onPress,
}: {
  icon: AppIconOption;
  selected: boolean;
  width: number | `${number}%`;
  onPress: () => void;
}) {
  const theme = useChoosenTheme();
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

export function IconPicker({ compact = false }: { compact?: boolean }) {
  const theme = useChoosenTheme();
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
    haptics('medium');
    const previous = current;
    setCurrent(name);
    try {
      if (name === null) await resetAppIcon();
      else await setAlternateAppIcon(name);
    } catch (e) {
      console.error('Error changing app icon:', e);
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
        style={{ marginHorizontal: -25 }}
        contentContainerStyle={{ paddingHorizontal: 21 }}
      >
        {allAppIcons.map(tile)}
      </ScrollView>
    );
  }

  return (
    <>
      {appIconGroups.map((group) => (
        <View key={group.title} style={{ marginTop: 8 }}>
          <Text variant="labelLarge" style={{ color: theme.colors.onSurfaceVariant, marginBottom: 4 }}>
            {group.title}
          </Text>
          <View style={styles.iconGrid}>{group.icons.map(tile)}</View>
        </View>
      ))}
    </>
  );
}

const styles = StyleSheet.create({
  themeRow: { flexDirection: 'row', gap: 8 },
  themeItem: { flex: 1, alignItems: 'center' },
  ring: { width: '100%', borderWidth: 2.5, borderRadius: 18, padding: 3 },
  preview: { height: 112, borderRadius: 13, borderWidth: StyleSheet.hairlineWidth, overflow: 'hidden' },
  previewBar: { height: 20, justifyContent: 'center', paddingHorizontal: 8 },
  previewBody: { padding: 6, gap: 5 },
  previewCard: { height: 22, borderRadius: 6, justifyContent: 'center', paddingHorizontal: 6 },
  previewLine: { height: 4, borderRadius: 2, opacity: 0.8 },
  previewFab: { position: 'absolute', right: 7, bottom: 7, width: 18, height: 18, borderRadius: 6 },

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
