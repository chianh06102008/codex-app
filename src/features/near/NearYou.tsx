// "At your location" on Home: the live verdict in a few lines, anywhere in Vietnam.
// Official status first (P2), never "safe" (P1). Full detail is one tap away (Live screen).
import { useEffect, useRef } from 'react';
import { Animated, Linking, Pressable, StyleSheet, View } from 'react-native';
import { Icon } from 'react-native-paper';

import { T } from '@/components/SharedPrimitives';
import { PILOT_PROVINCE } from '@/config';
import { LIVE } from '@/copy/live';
import type { Lang } from '@/copy/mapReport';
import { COPY } from '@/copy/mapReport';
import type { SegmentState } from '@/domain/types';
import { useLiveSituation } from '@/features/live/useLiveSituation';
import { STATE_STYLE } from '@/features/map/stateStyle';
import { COLORS, RADIUS } from '@/theme';

const LEVEL_COLOR = { act: '#B91C1C', prepare: '#C2410C', watch: '#33454E' } as const;

export function NearYou({
  lang,
  onCheckRoute,
  onOpenLive,
}: {
  lang: Lang;
  states?: Map<string, SegmentState>;
  onCheckRoute: () => void;
  onOpenLive: () => void;
}) {
  const c = COPY[lang];
  const l = LIVE[lang];
  const s = useLiveSituation();
  const { live, view, official } = s;
  const province = official.province ?? PILOT_PROVINCE;

  const pulse = useRef(new Animated.Value(0.35)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 800, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0.35, duration: 800, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [pulse]);

  const level = s.overall.level;
  const officialLine =
    view.tone === 'warning' ? c.near_official_warning(province) : view.tone === 'calm' ? c.near_official_none(province) : c.near_official_unknown;
  const flaggedNear = s.near.filter((r) => r.state === 'avoid' || r.state === 'discouraged');
  const w = live.weather;
  const dir = (b: number) => l.dirs[Math.round(b / 45) % 8];

  return (
    <View style={styles.card} accessibilityLiveRegion="polite">
      <View style={styles.head}>
        <Animated.View style={[styles.dot, { backgroundColor: LEVEL_COLOR[level], opacity: pulse }]} />
        <T w="bold" style={styles.flex} numberOfLines={1}>{official.province ? c.near_title_in(official.province) : c.near_title}</T>
        <View style={[styles.badge, { backgroundColor: LEVEL_COLOR[level] }]}>
          <T t="tiny" w="bold" color={COLORS.white}>{l[`level_${level}`]}</T>
        </View>
      </View>

      {!live.here ? (
        <T t="small" color={COLORS.inkSoft}>{c.near_locating}</T>
      ) : (
        <>
          <T t="tiny" color={COLORS.inkSoft}>
            GPS {live.here.latitude.toFixed(5)}, {live.here.longitude.toFixed(5)}
            {official.userAccuracyM !== null ? ` · ±${Math.round(official.userAccuracyM)} m` : ''}
          </T>
          <T t="small" w="semibold" color={view.tone === 'warning' ? COLORS.warningInk : COLORS.ink}>{officialLine}</T>
          {s.overall.why.slice(0, 2).map((k) => (
            <T key={k} t="small" w="semibold" color={LEVEL_COLOR[level]}>• {l[`why_${k}` as keyof typeof l] as string}</T>
          ))}
          {w && (
            <T t="small">
              {l.wmo(w.weatherCode ?? 0)} · {l.temp(w.temperatureC ?? '–')} · {l.clouds(w.cloudCoverPct ?? '–')} · {l.next24(w.next24hMm)}
            </T>
          )}
          {flaggedNear.slice(0, 2).map((r) => (
            <View key={r.road.id} style={styles.row}>
              <View style={[styles.swatch, { backgroundColor: STATE_STYLE[r.state].line }]} />
              <T t="small" style={styles.flex} numberOfLines={1}>
                {c.near_road(r.road.name ?? c.near_unnamed, r.distanceM, c[`state_${r.state}`])}
              </T>
            </View>
          ))}
          {live.higher && (
            <T t="small">▲ {l.ground}: {l.groundLine(live.higher.riseM, live.higher.distanceM, dir(live.higher.bearing))}</T>
          )}
        </>
      )}

      <Pressable onPress={onOpenLive} accessibilityRole="button" style={({ pressed }) => [styles.primary, pressed && styles.pressed]}>
        <Icon source="radar" size={18} color={COLORS.white} />
        <T t="small" w="semibold" color={COLORS.white}>{l.openLive}</T>
      </Pressable>
      <View style={styles.actions}>
        <Pressable onPress={onCheckRoute} accessibilityRole="button" style={({ pressed }) => [styles.secondary, styles.flex, pressed && styles.pressed]}>
          <T t="small" w="semibold">{c.near_check_route}</T>
        </Pressable>
        <Pressable onPress={() => void Linking.openURL('tel:112')} accessibilityRole="button" style={({ pressed }) => [styles.call, pressed && styles.pressed]}>
          <Icon source="phone" size={16} color={COLORS.danger} />
          <T t="small" w="semibold" color={COLORS.danger}>112</T>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: COLORS.surface, borderRadius: RADIUS.md, padding: 12, gap: 5, borderWidth: 1, borderColor: COLORS.outline },
  head: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  dot: { width: 10, height: 10, borderRadius: 5 },
  badge: { borderRadius: RADIUS.pill, paddingHorizontal: 8, paddingVertical: 2 },
  flex: { flex: 1 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  swatch: { width: 14, height: 4, borderRadius: 2 },
  actions: { flexDirection: 'row', gap: 8 },
  primary: { minHeight: 44, borderRadius: RADIUS.pill, backgroundColor: COLORS.ink, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 4 },
  secondary: { minHeight: 40, borderRadius: RADIUS.pill, backgroundColor: COLORS.surfaceSoft, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 12 },
  call: { minHeight: 40, borderRadius: RADIUS.pill, borderWidth: 1, borderColor: COLORS.danger, flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 12 },
  pressed: { opacity: 0.75 },
});
