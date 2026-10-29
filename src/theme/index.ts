import { useSyncExternalStore } from 'react';
import { useColorScheme } from 'react-native';

import { DarkTheme, DefaultTheme, type Theme } from 'expo-router';
import { configureFonts, type MD3Theme } from 'react-native-paper';

import type { RoomStatus } from '@/src/types';
import { hashString, hexColor } from '@/src/utils/color';
import { storage } from '@/src/utils/storage';

import ambre from './palettes/ambre.json';
import azur from './palettes/azur.json';
import lavande from './palettes/lavande.json';
import menthe from './palettes/menthe.json';
import noel from './palettes/noel.json';

// une palette = un JSON MD3, voir https://oss.callstack.com/react-native-paper/docs/guides/theming
const PALETTES: unknown[] = [noel, azur, menthe, lavande, ambre];

// thème de saison imposé une fois à tous à son arrivée ; active: false le retire et rend à chacun son thème d'avant
const SEASON = { id: 'noel-2026', theme: 'noel', active: true };
const BASE_THEME_ID = 'azur';
const DEFAULT_THEME_ID = SEASON.active ? SEASON.theme : BASE_THEME_ID;

export type ThemeColors = typeof azur.light;
export type CourseColors = ThemeColors['courses'][number];

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
  const [stored, season, before] = await Promise.all([
    storage.get('theme'),
    storage.get('themeSeason'),
    storage.get('themeBeforeSeason'),
  ]);

  // début de saison : le thème de chacun est mis de côté
  if (SEASON.active && season !== SEASON.id) {
    if (isThemeId(stored) && stored !== SEASON.theme) storage.set('themeBeforeSeason', stored);
    else storage.remove('themeBeforeSeason');
    storage.set('themeSeason', SEASON.id);
    setThemeId(SEASON.theme);
    return;
  }

  // fin de saison : retour au thème d'avant, sauf si un autre a été choisi entre-temps
  if (!SEASON.active && season === SEASON.id) {
    storage.remove('themeSeason');
    storage.remove('themeBeforeSeason');
    if (stored === SEASON.theme) {
      setThemeId(isThemeId(before) ? before : BASE_THEME_ID);
      return;
    }
  }

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

// couleurs d'un cours dans la gamme du thème, choisies d'après son nom : un cours garde toujours la même
export function getCourseColors(theme: AppTheme, title: string): CourseColors {
  const { courses } = theme.colors;
  return courses[(hashString(title) >>> 0) % courses.length];
}

// accents d'un cours pour les widgets et la Live Activity, qui choisissent eux-mêmes entre clair et sombre
export function getCourseAccents(themeId: string, title: string): { color: string; colorDark: string } {
  return {
    color: hexColor(getCourseColors(getTheme(themeId, false), title).accent),
    colorDark: hexColor(getCourseColors(getTheme(themeId, true), title).accent),
  };
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
