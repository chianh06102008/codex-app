// Theme entry point. Devs import colors, type and spacing from here, never hard-code them in screens.
// The plain token values live in ./tokens; this file adds the react-native-paper theme.
import { MD3LightTheme } from 'react-native-paper';

import { COLORS } from './tokens';

export * from './tokens';

/** react-native-paper theme in the shell palette, with every text variant scaled. */
export function makePaperTheme(scale: number) {
  const fonts = Object.fromEntries(
    Object.entries(MD3LightTheme.fonts).map(([name, f]) => [
      name,
      'fontSize' in f ? { ...f, fontSize: Math.round(f.fontSize * scale), lineHeight: Math.round(f.lineHeight * scale) } : f,
    ]),
  ) as typeof MD3LightTheme.fonts;
  return {
    ...MD3LightTheme,
    fonts,
    colors: {
      ...MD3LightTheme.colors,
      primary: COLORS.ink,
      onPrimary: COLORS.white,
      primaryContainer: COLORS.surfaceSoft,
      onPrimaryContainer: COLORS.ink,
      secondaryContainer: COLORS.surfaceSoft,
      onSecondaryContainer: COLORS.ink,
      background: COLORS.background,
      surface: COLORS.surface,
      surfaceVariant: COLORS.surfaceSoft,
      onSurface: COLORS.ink,
      onSurfaceVariant: COLORS.inkSoft,
      outline: COLORS.divider,
      error: COLORS.danger,
    },
  };
}
