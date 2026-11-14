// Design tokens from Dev 1's Figma shell (ported from the web build's Tailwind values).
// Plain values with no React Native imports, so pure-logic tests can load them.
// Screens import from '@/theme' (which re-exports this file).
// Rules (PRD §8): no green anywhere; the calmest state is neutral, never a "go" color.
export const COLORS = {
  ink: '#191B14', // text, primary buttons, bottom bar
  inkSoft: '#5D6157', // secondary text
  inkMuted: '#A9AD9F', // inactive nav labels on dark
  background: '#F3F4EF',
  mapBackground: '#ECEDE6',
  surface: '#FFFFFF',
  surfaceSoft: '#ECEEE6', // segmented controls, search pill
  outline: '#DFE1D8',
  divider: '#CDD1C6',
  // Official warning band
  warningBand: '#FFF3E6',
  warningBorder: '#C2410C',
  warningInk: '#9A3412',
  warningSoftBorder: '#F5C38A',
  danger: '#B91C1C',
  white: '#FFFFFF',
  scrim: 'rgba(0,0,0,0.4)',
};

export const RADIUS = { sm: 12, md: 16, lg: 20, xl: 28, pill: 999 };
export const SPACE = { xs: 4, sm: 8, md: 12, lg: 16, xl: 22 };
/** Minimum touch target (PRD §6). */
export const TOUCH = 48;

// Plus Jakarta Sans, one family name per weight (loaded in App.tsx).
// Do not combine these with `fontWeight`: on Android that fakes the bold.
export const FONT = {
  regular: 'PlusJakartaSans_400Regular',
  semibold: 'PlusJakartaSans_600SemiBold',
  bold: 'PlusJakartaSans_700Bold',
  extrabold: 'PlusJakartaSans_800ExtraBold',
} as const;
export type FontWeightName = keyof typeof FONT;

// Type scale: [fontSize, lineHeight]
export const TYPE = {
  display: [30, 38],
  wordmark: [22, 28],
  title: [20, 28],
  heading: [18, 26],
  button: [17, 24],
  body: [16, 24],
  small: [14, 20],
  overline: [13, 18],
  tiny: [12, 16],
} as const;
export type TypeName = keyof typeof TYPE;

export const SHADOW = {
  card: { shadowColor: '#1A1C14', shadowOpacity: 0.06, shadowRadius: 16, shadowOffset: { width: 0, height: 4 }, elevation: 2 },
  float: { shadowColor: '#1A1C14', shadowOpacity: 0.14, shadowRadius: 12, shadowOffset: { width: 0, height: 8 }, elevation: 6 },
};

export type TextSize = 'default' | 'large' | 'xlarge';
/** Same steps as Dev 1's web shell (100% / 108% / 116%). The phone's own font setting applies on top. */
export const TEXT_SCALE: Record<TextSize, number> = { default: 1, large: 1.08, xlarge: 1.16 };
