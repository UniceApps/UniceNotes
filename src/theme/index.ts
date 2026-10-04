import { useSyncExternalStore } from 'react';
import { useColorScheme } from 'react-native';

import { DarkTheme, DefaultTheme, type Theme } from 'expo-router';
import { configureFonts, type MD3Theme } from 'react-native-paper';

import type { RoomStatus } from '@/src/types';
import { storage } from '@/src/utils/storage';

import ambre from './palettes/ambre.json';
import azur from './palettes/azur.json';
import lavande from './palettes/lavande.json';
import menthe from './palettes/menthe.json';

// une palette = un JSON MD3, voir https://oss.callstack.com/react-native-paper/docs/guides/theming
const PALETTES: unknown[] = [azur, menthe, lavande, ambre];

const DEFAULT_THEME_ID = 'azur';

export type ThemeColors = typeof azur.light;

export interface AppTheme {
  dark: boolean;
  version: 3;
  mode?: 'adaptive';
  colors: ThemeColors;
  fonts: MD3Theme['fonts'];
}

export interface ThemeOption {
  id: string;
  label: string;
  description: string;
  light: AppTheme;
  dark: AppTheme;
}

// la police est chargée avant le premier rendu (voir app/_layout.tsx)
const fonts = configureFonts({ config: { fontFamily: 'Bahnschrift' } });

// azur sert de référence : une palette doit définir exactement les mêmes clés
function isValidColors(value: unknown, reference: Record<string, unknown> = azur.light): boolean {
  if (typeof value !== 'object' || value === null) return false;
  const colors = value as Record<string, unknown>;
  return Object.entries(reference).every(([key, ref]) =>
    typeof ref === 'object'
      ? isValidColors(colors[key], ref as Record<string, unknown>)
      : typeof colors[key] === 'string',
  );
}

function loadPalette(json: unknown): ThemeOption | null {
  if (typeof json !== 'object' || json === null) return null;
  const { id, label, description, light, dark } = json as Record<string, unknown>;
  if (typeof id !== 'string' || typeof label !== 'string') return null;
  if (!isValidColors(light) || !isValidColors(dark)) return null;

  return {
    id,
    label,
    description: typeof description === 'string' ? description : '',
    light: { dark: false, version: 3, colors: light as ThemeColors, fonts },
    dark: { dark: true, version: 3, mode: 'adaptive', colors: dark as ThemeColors, fonts },
  };
}

export const themeOptions: ThemeOption[] = PALETTES.flatMap((json) => {
  const option = loadPalette(json);
  if (!option) console.warn('[theme] palette invalide ignorée', (json as { id?: unknown })?.id);
  return option ? [option] : [];
});

function isThemeId(value: unknown): value is string {
  return themeOptions.some((option) => option.id === value);
}

function getTheme(id: string, dark: boolean): AppTheme {
  const option = themeOptions.find((t) => t.id === id) ?? themeOptions.find((t) => t.id === DEFAULT_THEME_ID)!;
  return dark ? option.dark : option.light;
}

// thème choisi, partagé hors de React pour être lu avant le premier rendu

let currentId = DEFAULT_THEME_ID;
const listeners = new Set<() => void>();

function emit(id: string): void {
  currentId = id;
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export async function loadThemePreference(): Promise<void> {
  const stored = await storage.get('theme');
  emit(isThemeId(stored) ? stored : DEFAULT_THEME_ID);
}

export function setThemeId(id: string): void {
  if (!isThemeId(id)) return;
  emit(id);
  storage.set('theme', id);
}

export function resetTheme(): void {
  emit(DEFAULT_THEME_ID);
}

export function useThemeId(): string {
  return useSyncExternalStore(subscribe, () => currentId);
}

// suit le thème choisi et le mode clair / sombre du système
export function useAppTheme(): AppTheme {
  const scheme = useColorScheme();
  return getTheme(useThemeId(), scheme === 'dark');
}

// couleurs dérivées

export type Tone = 'primary' | 'secondary' | 'tertiary' | 'error';

export function getToneColors(theme: AppTheme, tone: Tone) {
  const c = theme.colors;
  switch (tone) {
    case 'secondary':
      return {
        container: c.secondaryContainer,
        onContainer: c.onSecondaryContainer,
        accent: c.secondary,
        onAccent: c.onSecondary,
      };
    case 'tertiary':
      return {
        container: c.tertiaryContainer,
        onContainer: c.onTertiaryContainer,
        accent: c.tertiary,
        onAccent: c.onTertiary,
      };
    case 'error':
      return { container: c.errorContainer, onContainer: c.onErrorContainer, accent: c.error, onAccent: c.onError };
    default:
      return {
        container: c.primaryContainer,
        onContainer: c.onPrimaryContainer,
        accent: c.primary,
        onAccent: c.onPrimary,
      };
  }
}

// pastilles vert / orange / rouge (salles, serveurs) : le thème Material n'en a pas
export function getStatusColors(theme: AppTheme): Record<RoomStatus, string> {
  return theme.dark
    ? { free: '#5BC98A', tight: '#F5B041', busy: '#FF7B72' }
    : { free: '#1E8E4E', tight: '#D97706', busy: '#D93025' };
}

// fond du Stack (visible pendant les gestes de retour) : sinon React Navigation reste en clair
export function getNavigationTheme(theme: AppTheme): Theme {
  const base = theme.dark ? DarkTheme : DefaultTheme;
  return {
    ...base,
    colors: {
      ...base.colors,
      primary: theme.colors.primary,
      background: theme.colors.background,
      card: theme.colors.surface,
      text: theme.colors.onBackground,
      border: theme.colors.outlineVariant,
      notification: theme.colors.error,
    },
  };
}
