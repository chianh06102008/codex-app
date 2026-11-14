// Shared UI pieces of the app shell, ported from Dev 1's Figma web build to React Native.
// Colors, type and spacing come from src/theme. Every touch target is at least 48 px.
import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View, type StyleProp, type TextProps, type TextStyle, type ViewStyle } from 'react-native';
import { Icon } from 'react-native-paper';

import { useTextScale } from '@/features/settings/settingsStore';
import { COLORS, FONT, RADIUS, SHADOW, TOUCH, TYPE, type FontWeightName, type TypeName } from '@/theme';

// ---------- Text ----------

type TProps = TextProps & {
  /** Size from the type scale. */
  t?: TypeName;
  /** Weight; picks the matching Plus Jakarta Sans file. */
  w?: FontWeightName;
  color?: string;
  center?: boolean;
  upper?: boolean;
  style?: StyleProp<TextStyle>;
};

/** Shell text: design font, type scale, and the in-app text size setting. */
export function T({ t = 'body', w = 'regular', color = COLORS.ink, center, upper, style, ...rest }: TProps) {
  const scale = useTextScale();
  const [size, line] = TYPE[t];
  return (
    <Text
      {...rest}
      style={[
        { fontFamily: FONT[w], fontSize: size * scale, lineHeight: line * scale, color },
        center && styles.center,
        upper && styles.upper,
        style,
      ]}
    />
  );
}

// ---------- Header ----------

export function IconButtonBack({ onPress, label }: { onPress: () => void; label: string }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}
    >
      <Icon source="chevron-left" size={28} color={COLORS.ink} />
    </Pressable>
  );
}

export function HeaderBack({
  title,
  subtitle,
  onBack,
  backLabel,
}: {
  title: string;
  subtitle?: string;
  onBack: () => void;
  backLabel: string;
}) {
  return (
    <View style={styles.header}>
      <IconButtonBack onPress={onBack} label={backLabel} />
      <View style={styles.headerTitles}>
        <T t="title" w="bold" accessibilityRole="header">{title}</T>
        {subtitle ? <T color={COLORS.inkSoft}>{subtitle}</T> : null}
      </View>
    </View>
  );
}

// ---------- Buttons ----------

export function ButtonPrimary({ label, onPress, disabled }: { label: string; onPress: () => void; disabled?: boolean }) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityState={{ disabled: !!disabled }}
      style={({ pressed }) => [styles.primary, disabled && styles.disabled, pressed && styles.pressed]}
    >
      <T t="button" w="bold" color={COLORS.white} center>{label}</T>
    </Pressable>
  );
}

export function ButtonSecondary({ label, onPress, danger }: { label: string; onPress: () => void; danger?: boolean }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      style={({ pressed }) => [styles.secondary, pressed && styles.pressed]}
    >
      <T w="semibold" color={danger ? COLORS.danger : COLORS.ink} center>{label}</T>
    </Pressable>
  );
}

// ---------- Official status band ----------

export type BandTone = 'warning' | 'degraded' | 'calm';

/**
 * The official status band (PRD F01). `warning` = a bulletin is in force,
 * `degraded` = the feed could not be reached, `calm` = feed reachable, no warning.
 * The calm tone is neutral on purpose: there is no green and no "go".
 */
export function StatusBand({
  tone,
  overline,
  title,
  body,
  meta,
  linkLabel,
  badge,
  titleLines = 4,
  onPress,
}: {
  tone: BandTone;
  overline: string;
  title: string;
  body?: string;
  meta?: string;
  linkLabel?: string;
  badge?: string;
  /** Cap the title so the band cannot push the map off small screens. */
  titleLines?: number;
  onPress?: () => void;
}) {
  const warning = tone === 'warning';
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      accessibilityRole={onPress ? 'button' : 'alert'}
      accessibilityLiveRegion="polite"
      style={[styles.band, warning ? styles.bandWarning : styles.bandNeutral]}
    >
      <T t="overline" w="semibold" upper color={warning ? COLORS.warningInk : COLORS.inkSoft} style={styles.tracking}>
        {overline}
      </T>
      <T t="heading" w="bold" numberOfLines={titleLines}>{title}</T>
      {body ? <T w="semibold">{body}</T> : null}
      {meta ? <T color={COLORS.inkSoft}>{meta}</T> : null}
      {badge ? <T t="tiny" w="bold" color={COLORS.inkSoft}>{badge}</T> : null}
      {linkLabel ? <T w="semibold" style={styles.link}>{linkLabel}</T> : null}
    </Pressable>
  );
}

// ---------- Segmented control (language, text size) ----------

export function Segmented<V extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: V;
  options: { value: V; label: string }[];
  onChange: (next: V) => void;
}) {
  return (
    <View style={styles.segmented} accessibilityRole="radiogroup" accessibilityLabel={label}>
      {options.map((o) => {
        const selected = o.value === value;
        return (
          <Pressable
            key={o.value}
            onPress={() => onChange(o.value)}
            accessibilityRole="radio"
            accessibilityState={{ selected }}
            style={[styles.segment, selected && styles.segmentSelected]}
          >
            <T w="semibold" color={selected ? COLORS.ink : COLORS.inkSoft} center numberOfLines={1} adjustsFontSizeToFit>
              {o.label}
            </T>
          </Pressable>
        );
      })}
    </View>
  );
}

// ---------- Cards ----------

export function ShellCard({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  return <View style={[styles.card, style]}>{children}</View>;
}

export function Overline({ children, color = COLORS.inkSoft }: { children: string; color?: string }) {
  return (
    <T t="overline" w="semibold" upper color={color} style={styles.tracking}>
      {children}
    </T>
  );
}

// ---------- Bottom navigation ----------

export type NavTab = 'home' | 'warning' | 'report' | 'settings';

export function NavBottomBar({
  active,
  labels,
  navLabel,
  onNavigate,
}: {
  active: NavTab;
  labels: Record<NavTab, string>;
  navLabel: string;
  onNavigate: (tab: NavTab) => void;
}) {
  const items: { id: NavTab; icon: string }[] = [
    { id: 'home', icon: 'map-outline' },
    { id: 'warning', icon: 'alert-outline' },
    { id: 'report', icon: 'camera-outline' },
    { id: 'settings', icon: 'cog-outline' },
  ];
  return (
    <View style={styles.nav} accessibilityRole="tablist" accessibilityLabel={navLabel}>
      {items.map((item) => {
        const isActive = item.id === active;
        return (
          <Pressable
            key={item.id}
            onPress={() => onNavigate(item.id)}
            accessibilityRole="tab"
            accessibilityState={{ selected: isActive }}
            accessibilityLabel={labels[item.id]}
            style={[styles.navItem, isActive && styles.navItemActive]}
          >
            <Icon source={item.icon} size={22} color={isActive ? COLORS.white : COLORS.inkMuted} />
            <T t="small" w="semibold" color={isActive ? COLORS.white : COLORS.inkMuted} numberOfLines={1} adjustsFontSizeToFit>
              {labels[item.id]}
            </T>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  center: { textAlign: 'center' },
  upper: { textTransform: 'uppercase' },
  tracking: { letterSpacing: 0.78 },
  pressed: { opacity: 0.75 },
  disabled: { opacity: 0.4 },

  header: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  headerTitles: { flex: 1 },
  backButton: {
    width: TOUCH,
    height: TOUCH,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOW.float,
  },

  primary: {
    minHeight: 56,
    borderRadius: RADIUS.pill,
    backgroundColor: COLORS.ink,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 14,
  },
  secondary: {
    minHeight: TOUCH,
    borderRadius: RADIUS.pill,
    backgroundColor: COLORS.surface,
    borderWidth: 1.5,
    borderColor: COLORS.outline,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 18,
    paddingVertical: 12,
  },

  band: { borderRadius: RADIUS.lg, borderWidth: 1.5, paddingHorizontal: 18, paddingVertical: 14, gap: 4, ...SHADOW.card },
  bandWarning: { backgroundColor: COLORS.warningBand, borderColor: COLORS.warningBorder },
  bandNeutral: { backgroundColor: COLORS.surfaceSoft, borderColor: COLORS.inkSoft },
  link: { textDecorationLine: 'underline', marginTop: 2 },

  segmented: { flexDirection: 'row', gap: 6, padding: 6, borderRadius: RADIUS.lg, backgroundColor: COLORS.surfaceSoft },
  segment: { flex: 1, minHeight: TOUCH, borderRadius: RADIUS.sm, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 6 },
  segmentSelected: { backgroundColor: COLORS.surface, ...SHADOW.card },

  card: { backgroundColor: COLORS.surface, borderRadius: RADIUS.lg, padding: 16, gap: 10, ...SHADOW.card },

  nav: { flexDirection: 'row', gap: 4, padding: 8, minHeight: 72, borderRadius: RADIUS.xl, backgroundColor: COLORS.ink },
  navItem: { flex: 1, borderRadius: RADIUS.lg, alignItems: 'center', justifyContent: 'center', gap: 4, paddingVertical: 8 },
  navItemActive: { backgroundColor: 'rgba(255,255,255,0.12)' },
});
