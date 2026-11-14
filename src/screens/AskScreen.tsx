// S3 Ask: destination + mode. The button asks a question; it never says "Start".
import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Button, Chip, SegmentedButtons, Text, TextInput } from 'react-native-paper';
import * as Location from 'expo-location';

import { SNAP_MAX_M } from '@/config';
import { COPY, type Lang } from '@/copy/mapReport';
import type { LatLon, TravelMode } from '@/domain/types';
import { useOfficialSource } from '@/features/fusion/officialSource';
import { useSegmentStates } from '@/features/fusion/segmentStates';
import { FloodMap } from '@/features/map/FloodMap';
import { Legend } from '@/features/map/StateChip';
import { NAMED_ROADS, insideSlice, snapToRoad } from '@/features/map/roads';
import { BRAND } from '@/features/map/stateStyle';
import { runRouteCheck, updateSession, useRouteSession } from '@/features/routing/session';
import { SpeedGate } from '@/features/speed-gate/SpeedGate';
import { requestLocation, useSpeed } from '@/features/speed-gate/speed';
import { OfficialBanner } from '@/features/ui/OfficialBanner';
import { Card } from '@/features/ui/Card';

type Props = { lang: Lang; go: (screen: 'result') => void };

export function AskScreen({ lang, go }: Props) {
  const c = COPY[lang];
  const session = useRouteSession();
  const official = useOfficialSource();
  const states = useSegmentStates(session.mode);
  const speed = useSpeed();
  const [note, setNote] = useState('');
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<{ name: string; address: string; coordinate: LatLon }[]>([]);
  const [searchStatus, setSearchStatus] = useState('');
  const [busy, setBusy] = useState(false);

  const originLabel =
    session.origin.kind === 'gps' ? c.originHere : c.originDefault;

  async function useMyLocation() {
    const ok = speed.permission === 'granted' || (await requestLocation());
    if (!ok) return;
    try {
      const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const p = { latitude: pos.coords.latitude, longitude: pos.coords.longitude };
      if (insideSlice(p)) {
        updateSession({ origin: { point: p, label: c.originHere, kind: 'gps' } });
        setNote('');
      } else {
        setNote(c.outsidePilot);
      }
    } catch {
      setNote(c.outsidePilot);
    }
  }

  function pickPoint(p: LatLon, label: string, kind: 'road' | 'map' | 'search') {
    if (!insideSlice(p) || !snapToRoad(p, SNAP_MAX_M)) {
      setNote(c.outsideSlice);
      return;
    }
    setNote('');
    updateSession({ destination: { point: p, label, kind }, result: null });
  }

  async function search() {
    const base = process.env.EXPO_PUBLIC_MAPS_SERVER_URL;
    if (!base) { setSearchStatus(c.searchUnavailable); return; }
    setSearchStatus('…');
    try {
      const res = await fetch(`${base.replace(/\/$/, '')}/api/places?q=${encodeURIComponent(query)}&lang=${lang}`, {
        signal: AbortSignal.timeout(8000),
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      const inside = (data.places ?? []).filter((p: { coordinate?: LatLon }) => p.coordinate && insideSlice(p.coordinate));
      setResults(inside);
      setSearchStatus(inside.length ? '' : c.outsideSlice);
    } catch {
      setResults([]);
      setSearchStatus(c.searchUnavailable);
    }
  }

  function check() {
    setBusy(true);
    // Let the button show its busy state before the synchronous graph search.
    setTimeout(() => {
      runRouteCheck();
      setBusy(false);
      go('result');
    }, 30);
  }

  return (
    <SpeedGate lang={lang}>
      <View style={styles.wrap}>
        <Text variant="headlineMedium" style={styles.h1}>{c.askTitle}</Text>
        <OfficialBanner lang={lang} />

        <FloodMap
          states={states}
          feedUnavailable={official.feedStatus === 'unavailable'}
          statements={official.statements}
          origin={session.origin.point}
          destination={session.destination?.point}
          onPress={(p) => pickPoint(p, c.pickedOnMap, 'map')}
          height={280}
          attribution={c.mapAttribution}
        />
        <Legend lang={lang} />

        <Card>
          <Text variant="labelLarge" style={styles.label}>{c.origin}</Text>
          <View style={styles.row}>
            <Text variant="titleMedium" style={styles.flex}>{originLabel}</Text>
            <Button icon="crosshairs-gps" compact onPress={useMyLocation}>{c.useMyLocation}</Button>
          </View>
          {speed.permission !== 'granted' && <Text style={styles.small}>{c.locationWhy}</Text>}
        </Card>

        <Card>
          <Text variant="labelLarge" style={styles.label}>{c.destination}</Text>
          <Text variant="titleMedium">{session.destination?.label ?? c.destinationHint}</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
            {NAMED_ROADS.map((r) => (
              <Chip
                key={r.name}
                selected={session.destination?.label === r.name}
                onPress={() => pickPoint(r.point, r.name, 'road')}
                style={styles.chip}
                showSelectedOverlay
              >
                {r.name.replace(/^Đường /, '')}
              </Chip>
            ))}
          </ScrollView>
          <View style={styles.row}>
            <TextInput
              mode="outlined"
              dense
              style={styles.flex}
              label={c.searchPlaces}
              value={query}
              onChangeText={setQuery}
              onSubmitEditing={search}
              returnKeyType="search"
            />
            <Button mode="outlined" onPress={search} disabled={query.trim().length < 2} style={styles.searchBtn}>
              {c.searchPlaces}
            </Button>
          </View>
          {!!searchStatus && <Text style={styles.small} accessibilityLiveRegion="polite">{searchStatus}</Text>}
          {results.map((p, i) => (
            <Button key={i} mode="text" onPress={() => { pickPoint(p.coordinate, p.name, 'search'); setResults([]); }}>
              {[p.name, p.address].filter(Boolean).join(', ')}
            </Button>
          ))}
          <Text style={styles.small}>{c.pickOnMap}</Text>
        </Card>

        <Card>
          <Text variant="labelLarge" style={styles.label}>{c.mode}</Text>
          <SegmentedButtons
            value={session.mode}
            onValueChange={(v) => updateSession({ mode: v as TravelMode, result: null })}
            buttons={[
              { value: 'motorbike', label: c.bike, icon: 'motorbike' },
              { value: 'walk', label: c.walk, icon: 'walk' },
              { value: 'car', label: c.car, icon: 'car' },
            ]}
          />
        </Card>

        {!!note && <Text style={styles.note} accessibilityLiveRegion="polite">{note}</Text>}

        <Button
          mode="contained"
          icon="map-search-outline"
          onPress={check}
          loading={busy}
          disabled={!session.destination || busy}
          contentStyle={styles.cta}
          labelStyle={styles.ctaLabel}
        >
          {busy ? c.checking : c.check}
        </Button>
      </View>
    </SpeedGate>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 14 },
  h1: { fontWeight: '800', color: BRAND.ink },
  label: { color: BRAND.inkSoft, marginBottom: 4 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  flex: { flex: 1 },
  small: { fontSize: 13, color: BRAND.inkSoft, marginTop: 6 },
  chips: { gap: 8, paddingVertical: 10 },
  chip: { backgroundColor: '#EEF4F5' },
  searchBtn: { alignSelf: 'center' },
  note: { color: '#8A4B00', fontWeight: '600' },
  cta: { minHeight: 56 },
  ctaLabel: { fontSize: 17, fontWeight: '700' },
});
