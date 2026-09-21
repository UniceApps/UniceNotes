import { useSyncExternalStore } from 'react';
import { useColorScheme } from 'react-native';
import { configureFonts, MD3Theme } from 'react-native-paper';

import { getAsync, saveAsync } from '../utils/storage';

import azurJson from '../assets/themes/palettes/azur.json';
import mentheJson from '../assets/themes/palettes/menthe.json';
import lavandeJson from '../assets/themes/palettes/lavande.json';
import ambreJson from '../assets/themes/palettes/ambre.json';

// Chaque palette est un fichier JSON dans assets/themes/palettes
// suivant MD3 voir doc https://oss.callstack.com/react-native-paper/docs/guides/theming :)
const PALETTE_FILES: unknown[] = [azurJson, mentheJson, lavandeJson, ambreJson];

export type ThemeColors = typeof azurJson.light;

export type AppTheme = {
  dark: boolean;
  version: 3;
  mode?: 'adaptive';
  colors: ThemeColors;
  fonts?: MD3Theme['fonts'];
};

export interface ThemeDefinition {
  id: string;
  label: string;
  description: string;
  light: AppTheme;
  dark: AppTheme;
}

// ---------------------------------------------------------------------------
// Chargement des palettes JSON
// ---------------------------------------------------------------------------

// azur sert de référence : une palette doit définir exactement les mêmes clés
function isValidColors(value: unknown, reference: Record<string, unknown> = azurJson.light): boolean {
  if (typeof value !== 'object' || value === null) return false;
  const obj = value as Record<string, unknown>;
  return Object.entries(reference).every(([key, ref]) =>
    typeof ref === 'object' ? isValidColors(obj[key], ref as Record<string, unknown>) : typeof obj[key] === 'string',
  );
}

/** Transforme un JSON de palette en thème Paper ; renvoie null si le JSON est invalide. */
export function loadTheme(json: unknown): ThemeDefinition | null {
  if (typeof json !== 'object' || json === null) return null;
  const { id, label, description, light, dark } = json as Record<string, unknown>;
  if (typeof id !== 'string' || typeof label !== 'string') return null;
  if (!isValidColors(light) || !isValidColors(dark)) return null;

  return {
    id,
    label,
    description: typeof description === 'string' ? description : '',
    light: { dark: false, version: 3, colors: light as ThemeColors },
    dark: { dark: true, version: 3, mode: 'adaptive', colors: dark as ThemeColors },
  };
}

export const themes: Record<string, ThemeDefinition> = {};
for (const file of PALETTE_FILES) {
  const theme = loadTheme(file);
  if (theme) themes[theme.id] = theme;
  else console.warn('[theme] palette JSON invalide ignorée', (file as { id?: unknown })?.id);
}

export const DEFAULT_THEME_ID = 'azur';

export const themeOptions = Object.values(themes).map((t) => ({
  id: t.id,
  label: t.label,
  description: t.description,
  swatchLight: t.light.colors.primary,
  swatchDark: t.dark.colors.primary,
}));

export function isThemeId(value: unknown): value is string {
  return typeof value === 'string' && value in themes;
}

// return la variante clair/sombre d'un thème
export function getTheme(id: string | null | undefined, isDark: boolean): AppTheme {
  const entry = isThemeId(id) ? themes[id] : themes[DEFAULT_THEME_ID];
  return isDark ? entry.dark : entry.light;
}

export const lightTheme = themes[DEFAULT_THEME_ID].light;
export const darkTheme = themes[DEFAULT_THEME_ID].dark;

// ---------------------------------------------------------------------------
// Thème sélectionné
// ---------------------------------------------------------------------------

let _themeId: string = DEFAULT_THEME_ID;
const _listeners = new Set<() => void>();

function emitThemeChange(id: string): void {
  _themeId = id;
  _listeners.forEach((l) => l());
}

function subscribeTheme(listener: () => void): () => void {
  _listeners.add(listener);
  return () => _listeners.delete(listener);
}

export async function loadThemePreference(): Promise<void> {
  const stored = await getAsync('theme');
  emitThemeChange(isThemeId(stored) ? stored : DEFAULT_THEME_ID);
}

export async function setThemeId(id: string): Promise<void> {
  if (!isThemeId(id)) return;
  emitThemeChange(id);
  await saveAsync('theme', id);
}

// Remet le thème par défaut en mémoire
export function resetTheme(): void {
  emitThemeChange(DEFAULT_THEME_ID);
}

export function useThemeId(): string {
  return useSyncExternalStore(subscribeTheme, () => _themeId);
}

let _fonts: MD3Theme['fonts'] | null = null;

export function updateFontConfig(): void {
  _fonts = configureFonts({ config: { fontFamily: 'Bahnschrift' } });
}

// hook: re-renders the component when the system switches between light and dark or the theme changes
export function useChoosenTheme(): AppTheme {
  const scheme = useColorScheme();
  const themeId = useThemeId();
  const base = getTheme(themeId, scheme === 'dark');
  return _fonts ? { ...base, fonts: _fonts } : base;
}

// pastilles des salles libres (vert / orange / rouge) : le thème Material n'a ni vert ni orange
export function getRoomStatusColors(theme: AppTheme): Record<'free' | 'tight' | 'busy', string> {
  return theme.dark
    ? { free: '#5BC98A', tight: '#F5B041', busy: '#FF7B72' }
    : { free: '#1E8E4E', tight: '#D97706', busy: '#D93025' };
}

export function getCalendarTheme(theme: AppTheme) {
  return {
    colors: {
      primary: theme.colors.primary,
      onPrimary: theme.colors.onPrimary,
      background: theme.colors.background,
      onBackground: theme.colors.onBackground,
      border: theme.colors.outline,
      text: theme.colors.onBackground,
    },
    hourTextStyle: { color: theme.colors.onBackground },
    weekNumber: { color: theme.colors.onPrimary },
    weekNumberContainer: { backgroundColor: theme.colors.primary },
    unavailableHourBackgroundColor: theme.colors.surfaceVariant,
  };
}
