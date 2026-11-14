// Trip anywhere in Vietnam: start = your GPS (changeable), destination with suggestions as you
// type, then OpenStreetMap routes checked against live evidence. Refusal draws no line (P3).
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, TextInput, View } from 'react-native';
import { Icon } from 'react-native-paper';

import { T } from '@/components/SharedPrimitives';
import { LIVE } from '@/copy/live';
import type { Lang } from '@/copy/mapReport';
import type { LatLon } from '@/domain/types';
import { useOfficialSource } from '@/features/fusion/officialSource';
import { useSegmentStates } from '@/features/fusion/segmentStates';
import { LiveOverlays } from '@/features/live/LiveOverlays';
import { checkRoute, chooseTrip, fetchRoutes, suggestPlaces, type Place, type TripIssue, type TripMode, type TripResult } from '@/features/live/trip';
import { useLiveSituation } from '@/features/live/useLiveSituation';
import { PROVINCES, useVietnam } from '@/features/live/vietnam';
import { isInForce } from '@/features/official/officialView';
import { FloodMap } from '@/features/map/FloodMap';
import { COLORS, RADIUS } from '@/theme';
import { openDirections } from './LiveScreen';

function usePlaceSearch(q: string, near: LatLon | null, lang: Lang) {
  const [hits, setHits] = useState<Place[]>([]);
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    if (q.trim().length < 2) {
      setHits([]);
      return;
    }
    let live = true;
    setBusy(true);
    // Debounced: Photon fair use, one request per pause in typing.
    const t = setTimeout(() => {
      suggestPlaces(q.trim(), near, lang)
        .then((h) => live && setHits(h))
        .catch(() => live && setHits([]))
        .finally(() => live && setBusy(false));
    }, 350);
    return () => {
      live = false;
      clearTimeout(t);
    };
  }, [q, near?.latitude, near?.longitude, lang]);
  return { hits, busy };
}

export function TripScreen({ lang }: { lang: Lang }) {
  const c = LIVE[lang];
  const official = useOfficialSource();
  const here = official.userLocation;
  const states = useSegmentStates('motorbike');
  const situation = useLiveSituation();
  const vn = useVietnam();

  const [from, setFrom] = useState<Place | null>(null); // null = current location
  const [editingFrom, setEditingFrom] = useState(false);
  const [fromQ, setFromQ] = useState('');
  const [to, setTo] = useState<Place | null>(null);
  const [toQ, setToQ] = useState('');
  const [mode, setMode] = useState<TripMode>('motorbike');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);
  const [result, setResult] = useState<TripResult | null>(null);

  const fromSearch = usePlaceSearch(editingFrom ? fromQ : '', here, lang);
  const toSearch = usePlaceSearch(to ? '' : toQ, here, lang);
  const start = from?.point ?? here;

  async function check() {
    if (!start || !to) return;
    setBusy(true);
    setError(false);
    setResult(null);
    try {
      const raw = await fetchRoutes(start, to.point, mode);
      const now = new Date();
      const inForce = official.allStatements.filter((s) => isInForce(s, now));
      const rainMm = new Map<string, number>();
      PROVINCES.forEach((p, i) => {
        const r = vn.rain[i];
        if (r) rainMm.set(p.name, Math.max(r.todayMm, r.tomorrowMm));
      });
      const checked = raw.map((r) => checkRoute(r, { roads: situation.roads, inForceNationwide: inForce, provinceRainMm: rainMm }));
      setResult(chooseTrip(checked));
    } catch {
      setError(true);
    } finally {
      setBusy(false);
    }
  }

  const routes = result?.kind === 'route' ? [result.best.geometry, ...result.alternatives.map((a) => a.geometry)] : [];
  const fit = useMemo(
    () => (routes.length ? routes[0] : start && to ? [start, to.point] : null),
    [result, start?.latitude, to?.point.latitude],
  );

  return (
    <View style={styles.wrap}>
      <T t="title" w="bold">{c.trip_title}</T>

      <FloodMap
        states={states}
        feedUnavailable={false}
        statements={official.statements}
        routes={routes}
        origin={start}
        destination={to?.point ?? null}
        height={280}
        fitTo={fit}
      >
        <LiveOverlays />
      </FloodMap>

      {/* From */}
      <View style={styles.field}>
        <Icon source="crosshairs-gps" size={20} color="#1D4ED8" />
        <View style={styles.flex}>
          <T t="tiny" color={COLORS.inkSoft}>{c.trip_from}</T>
          {editingFrom ? (
            <TextInput value={fromQ} onChangeText={setFromQ} placeholder={c.trip_type_from} autoFocus style={styles.input} />
          ) : (
            <T w="semibold" numberOfLines={1}>{from ? from.name : here ? c.trip_here : c.trip_searching}</T>
          )}
        </View>
        <Pressable
          onPress={() => {
            if (editingFrom || from) {
              setFrom(null);
              setEditingFrom(false);
              setFromQ('');
            } else setEditingFrom(true);
            setResult(null);
          }}
          style={styles.smallBtn}
        >
          <T t="small" w="semibold">{editingFrom || from ? c.trip_use_here : c.trip_change}</T>
        </Pressable>
      </View>
      {editingFrom && (
        <Hints search={fromSearch} q={fromQ} c={c} onPick={(p) => { setFrom(p); setEditingFrom(false); setResult(null); }} />
      )}

      {/* To */}
      <View style={styles.field}>
        <Icon source="map-marker" size={20} color="#7A1F5C" />
        <View style={styles.flex}>
          <T t="tiny" color={COLORS.inkSoft}>{c.trip_to}</T>
          {to ? (
            <Pressable onPress={() => { setTo(null); setResult(null); }}>
              <T w="semibold" numberOfLines={1}>{to.name}</T>
              <T t="tiny" color={COLORS.inkSoft} numberOfLines={1}>{to.address}</T>
            </Pressable>
          ) : (
            <TextInput value={toQ} onChangeText={setToQ} placeholder={c.trip_type_to} style={styles.input} returnKeyType="search" />
          )}
        </View>
        {to && (
          <Pressable onPress={() => { setTo(null); setResult(null); }} hitSlop={8}>
            <Icon source="close" size={20} color={COLORS.inkSoft} />
          </Pressable>
        )}
      </View>
      {!to && <Hints search={toSearch} q={toQ} c={c} onPick={(p) => { setTo(p); setToQ(p.name); setResult(null); }} />}

      {/* Mode */}
      <View style={styles.modes}>
        {(['motorbike', 'car', 'walk'] as TripMode[]).map((m) => (
          <Pressable key={m} onPress={() => { setMode(m); setResult(null); }} style={[styles.mode, mode === m && styles.modeOn]}>
            <Icon source={m === 'motorbike' ? 'motorbike' : m === 'car' ? 'car' : 'walk'} size={18} color={mode === m ? COLORS.white : COLORS.ink} />
            <T t="small" w="semibold" color={mode === m ? COLORS.white : COLORS.ink}>{c[`trip_mode_${m}`]}</T>
          </Pressable>
        ))}
      </View>

      <Pressable onPress={check} disabled={!start || !to || busy} style={[styles.primary, (!start || !to || busy) && { opacity: 0.4 }]}>
        {busy ? <ActivityIndicator color={COLORS.white} /> : <Icon source="shield-search" size={18} color={COLORS.white} />}
        <T w="semibold" color={COLORS.white}>{busy ? c.trip_checking : c.trip_check}</T>
      </Pressable>

      {error && <T t="small" color={COLORS.danger}>{c.trip_error}</T>}
      {result && <ResultCard result={result} c={c} to={to} />}
      <T t="tiny" color={COLORS.inkSoft}>{c.trip_note}</T>
    </View>
  );
}

function Hints({ search, q, c, onPick }: { search: { hits: Place[]; busy: boolean }; q: string; c: (typeof LIVE)['vi']; onPick: (p: Place) => void }) {
  if (q.trim().length < 2) return null;
  return (
    <View style={styles.hints}>
      {search.busy && <T t="small" color={COLORS.inkSoft}>{c.trip_searching}</T>}
      {!search.busy && search.hits.length === 0 && <T t="small" color={COLORS.inkSoft}>{c.trip_no_hits}</T>}
      {search.hits.map((h, i) => (
        <Pressable key={`${h.name}-${i}`} onPress={() => onPick(h)} style={styles.hint} accessibilityRole="button">
          <Icon source="map-marker-outline" size={18} color={COLORS.inkSoft} />
          <View style={styles.flex}>
            <T t="small" w="semibold" numberOfLines={1}>{h.name}</T>
            {!!h.address && <T t="tiny" color={COLORS.inkSoft} numberOfLines={1}>{h.address}</T>}
          </View>
        </Pressable>
      ))}
    </View>
  );
}

function issueText(i: TripIssue, c: (typeof LIVE)['vi']) {
  switch (i.kind) {
    case 'avoid_road': return c.trip_issue_avoid(i.name ?? c.unnamed);
    case 'discouraged_road': return c.trip_issue_discouraged(i.name ?? c.unnamed);
    case 'official': return c.trip_issue_official(i.province);
    case 'heavy_rain': return c.trip_issue_rain(i.province, Math.round(i.mm));
  }
}

function ResultCard({ result, c, to }: { result: TripResult; c: (typeof LIVE)['vi']; to: Place | null }) {
  if (result.kind === 'no_route') return <View style={styles.card}><T>{c.trip_no_route}</T></View>;
  if (result.kind === 'refuse') {
    return (
      <View style={[styles.card, { borderColor: COLORS.danger, borderWidth: 2 }]}>
        <T w="bold" color={COLORS.danger}>{c.trip_refuse}</T>
        <T t="small">{c.trip_refuse_why}</T>
        {result.reasons.map((r, i) => <T key={i} t="small">• {issueText(r, c)}</T>)}
        <T t="small" w="semibold">{c.trip_wait}</T>
      </View>
    );
  }
  const r = result.best;
  return (
    <View style={styles.card}>
      <T w="bold">{c.trip_route}</T>
      <T t="small">{c.trip_distance((r.distanceM / 1000).toFixed(1))}</T>
      {r.issues.length === 0 ? <T t="small">{c.trip_issues_none}</T> : r.issues.map((i, k) => <T key={k} t="small" color={COLORS.warningInk}>• {issueText(i, c)}</T>)}
      {to && (
        <Pressable onPress={() => openDirections(to.point, to.name)} style={styles.secondary}>
          <Icon source="directions" size={18} color={COLORS.ink} />
          <T t="small" w="semibold">{c.trip_open_maps}</T>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 10, paddingBottom: 24 },
  flex: { flex: 1 },
  field: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: COLORS.surface, borderRadius: RADIUS.md, borderWidth: 1, borderColor: COLORS.outline, paddingHorizontal: 12, paddingVertical: 8, minHeight: 56 },
  input: { fontSize: 16, paddingVertical: 4, color: COLORS.ink },
  smallBtn: { paddingHorizontal: 10, minHeight: 36, justifyContent: 'center', borderRadius: RADIUS.pill, backgroundColor: COLORS.surfaceSoft },
  hints: { backgroundColor: COLORS.surface, borderRadius: RADIUS.md, borderWidth: 1, borderColor: COLORS.outline, paddingVertical: 4, paddingHorizontal: 8 },
  hint: { flexDirection: 'row', alignItems: 'center', gap: 8, minHeight: 48 },
  modes: { flexDirection: 'row', gap: 8 },
  mode: { flex: 1, flexDirection: 'row', gap: 6, alignItems: 'center', justifyContent: 'center', minHeight: 44, borderRadius: RADIUS.pill, backgroundColor: COLORS.surfaceSoft },
  modeOn: { backgroundColor: COLORS.ink },
  primary: { flexDirection: 'row', gap: 8, alignItems: 'center', justifyContent: 'center', minHeight: 52, borderRadius: RADIUS.pill, backgroundColor: COLORS.ink },
  card: { backgroundColor: COLORS.surface, borderRadius: RADIUS.md, padding: 12, gap: 6, borderWidth: 1, borderColor: COLORS.outline },
  secondary: { flexDirection: 'row', gap: 6, alignItems: 'center', alignSelf: 'flex-start', minHeight: 40, paddingHorizontal: 12, borderRadius: RADIUS.pill, backgroundColor: COLORS.surfaceSoft },
});
