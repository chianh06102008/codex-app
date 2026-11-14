// "At your location": everything the app knows about where the phone is, in one card.
// Official status first (P2), then crowd flood reports on nearby roads, then what to do.
// Never says "safe" (P1): the best it offers is the nearest road with no adverse evidence,
// and only when the feed is live. Otherwise it says to stay on high, dry ground.
import { useEffect, useMemo, useRef } from 'react';
import { Animated, Linking, Pressable, StyleSheet, View } from 'react-native';
import { Icon } from 'react-native-paper';

import { T } from '@/components/SharedPrimitives';
import type { Lang } from '@/copy/mapReport';
import { COPY } from '@/copy/mapReport';
import type { LatLon, SegmentState } from '@/domain/types';
import { useOfficialSource } from '@/features/fusion/officialSource';
import { SEGMENTS, SLICE_REGION, distanceM, insideSlice } from '@/features/map/roads';
import { STATE_STYLE } from '@/features/map/stateStyle';
import { PILOT_PROVINCE } from '@/config';
import { summarizeOfficial } from '@/features/official/officialView';
import { COLORS, RADIUS } from '@/theme';

const RADIUS_M = 800;
const ON_ROAD_M = 40;

function segDistance(p: LatLon, geometry: LatLon[]): number {
  let best = Infinity;
  for (const g of geometry) best = Math.min(best, distanceM(p, g));
  return best;
}

export function NearYou({ lang, states, onCheckRoute }: { lang: Lang; states: Map<string, SegmentState>; onCheckRoute: () => void }) {
  const c = COPY[lang];
  const official = useOfficialSource();
  const view = summarizeOfficial(official);
  const here = official.userLocation;

  // Gentle pulse on the status dot so the card reads as live.
  const pulse = useRef(new Animated.Value(0.4)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 900, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0.4, duration: 900, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [pulse]);

  const near = useMemo(() => {
    if (!here || !insideSlice(here)) return null;
    const rows = SEGMENTS.map((s) => ({ s, d: segDistance(here, s.geometry), st: states.get(s.id)?.state ?? 'uncertain' }))
      .filter((r) => r.d <= RADIUS_M);
    const flagged = rows.filter((r) => r.st === 'avoid' || r.st === 'discouraged').sort((a, b) => a.d - b.d);
    const onFlagged = flagged.some((r) => r.d <= ON_ROAD_M);
    const quiet = official.feedStatus === 'ok' && view.tone !== 'warning'
      ? rows.filter((r) => r.st === 'no_adverse_evidence' && r.s.name).sort((a, b) => a.d - b.d)[0] ?? null
      : null;
    return { flagged, onFlagged, quiet };
  }, [here, states, official.feedStatus, view.tone]);

  const tone = view.tone === 'warning' ? COLORS.warningBorder : view.tone === 'degraded' ? COLORS.inkSoft : STATE_STYLE.no_adverse_evidence.line;
  const province = official.province ?? PILOT_PROVINCE;
  const officialLine =
    view.tone === 'warning' ? c.near_official_warning(province) : view.tone === 'calm' ? c.near_official_none(province) : c.near_official_unknown;

  return (
    <View style={styles.card} accessibilityLiveRegion="polite">
      <View style={styles.head}>
        <Animated.View style={[styles.dot, { backgroundColor: tone, opacity: pulse }]} />
        <T w="bold" style={styles.flex} numberOfLines={1}>{official.province ? c.near_title_in(official.province) : c.near_title}</T>
        <Icon source="crosshairs-gps" size={18} color={COLORS.inkSoft} />
      </View>

      {!here ? (
        <T t="small" color={COLORS.inkSoft}>{c.near_locating}</T>
      ) : (
        <>
          <T t="small" w="semibold" color={view.tone === 'warning' ? COLORS.warningInk : COLORS.ink}>{officialLine}</T>
          {official.rain && (
            <T t="small">{c.near_rain(official.rain.next3hMm, official.rain.maxProbability ?? '–')}</T>
          )}

          {!near ? (
            <T t="small" color={COLORS.inkSoft}>
              {c.near_outside(Math.round(distanceM(here, { latitude: SLICE_REGION.latitude, longitude: SLICE_REGION.longitude }) / 100) / 10)}
            </T>
          ) : (
            <>
              <T t="small">{near.flagged.length ? c.near_flood_count(near.flagged.length, RADIUS_M) : c.near_flood_none(RADIUS_M)}</T>
              {near.flagged.slice(0, 3).map((r) => (
                <View key={r.s.id} style={styles.row}>
                  <View style={[styles.swatch, { backgroundColor: STATE_STYLE[r.st].line }]} />
                  <T t="small" style={styles.flex} numberOfLines={1}>
                    {c.near_road(r.s.name ?? c.near_unnamed, Math.round(r.d), c[`state_${r.st}`])}
                  </T>
                </View>
              ))}
              <T t="small" w="semibold">
                {near.onFlagged ? c.near_on_flagged : near.quiet ? c.near_direction(near.quiet.s.name, Math.round(near.quiet.d)) : c.near_direction_none}
              </T>
            </>
          )}
        </>
      )}

      <View style={styles.actions}>
        <Pressable onPress={onCheckRoute} accessibilityRole="button" style={({ pressed }) => [styles.primary, pressed && styles.pressed]}>
          <T t="small" w="semibold" color={COLORS.white}>{c.near_check_route}</T>
        </Pressable>
        <Pressable onPress={() => void Linking.openURL('tel:112')} accessibilityRole="button" style={({ pressed }) => [styles.secondary, pressed && styles.pressed]}>
          <Icon source="phone" size={16} color={COLORS.danger} />
          <T t="small" w="semibold" color={COLORS.danger}>{c.near_call}</T>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: COLORS.surface, borderRadius: RADIUS.md, padding: 12, gap: 6, borderWidth: 1, borderColor: COLORS.outline },
  head: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  dot: { width: 10, height: 10, borderRadius: 5 },
  flex: { flex: 1 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  swatch: { width: 14, height: 4, borderRadius: 2 },
  actions: { flexDirection: 'row', gap: 8, marginTop: 4 },
  primary: { flex: 1, minHeight: 44, borderRadius: RADIUS.pill, backgroundColor: COLORS.ink, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 12 },
  secondary: { minHeight: 44, borderRadius: RADIUS.pill, borderWidth: 1, borderColor: COLORS.danger, flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12 },
  pressed: { opacity: 0.75 },
});
