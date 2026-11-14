// Keeps every live source fresh around the phone's position.
//   weather/clouds 5 min · radar 5 min · river 30 min · GDACS 15 min · roads/help/terrain when moved > 500 m
// A failing source keeps its last good value and records the error; the UI shows its age.
import type { LatLon } from '@/domain/types';
import { distanceM } from '@/features/map/roads';
import { createStore, useStore } from '@/lib/store';
import { findHigherGround, type HigherGround } from './assess';
import {
  bearingDeg, fetchArea, fetchDisasterAlerts, fetchElevations, fetchRadarFrames, fetchRiverFlood, fetchWeather, ringPoints,
  type AreaRoad, type DisasterAlert, type HelpPlace, type RadarFrame, type RiverFlood, type Weather,
} from './sources';

export type SourceKey = 'weather' | 'river' | 'radar' | 'alerts' | 'area' | 'terrain';

export type LiveState = {
  here: LatLon | null;
  weather: Weather | null;
  river: RiverFlood | null;
  radar: RadarFrame[];
  alerts: DisasterAlert[];
  roads: AreaRoad[];
  roadElevations: (number | null)[];
  help: HelpPlace[];
  hereElevation: number | null;
  higher: HigherGround;
  loading: Partial<Record<SourceKey, boolean>>;
  errors: Partial<Record<SourceKey, string>>;
  updated: Partial<Record<SourceKey, string>>;
  showRadar: boolean;
};

export const liveStore = createStore<LiveState>({
  here: null, weather: null, river: null, radar: [], alerts: [], roads: [], roadElevations: [], help: [],
  hereElevation: null, higher: null, loading: {}, errors: {}, updated: {}, showRadar: true,
});

export const useLive = () => useStore(liveStore);
export const setShowRadar = (showRadar: boolean) => liveStore.set((s) => ({ ...s, showRadar }));

async function run<T>(key: SourceKey, job: () => Promise<T>, apply: (v: T) => Partial<LiveState>) {
  liveStore.set((s) => ({ ...s, loading: { ...s.loading, [key]: true } }));
  try {
    const v = await job();
    liveStore.set((s) => ({
      ...s, ...apply(v),
      loading: { ...s.loading, [key]: false },
      errors: { ...s.errors, [key]: undefined },
      updated: { ...s.updated, [key]: new Date().toISOString() },
    }));
  } catch (e) {
    liveStore.set((s) => ({ ...s, loading: { ...s.loading, [key]: false }, errors: { ...s.errors, [key]: String(e) } }));
  }
}

const refreshWeather = (p: LatLon) => run('weather', () => fetchWeather(p), (weather) => ({ weather }));
const refreshRiver = (p: LatLon) => run('river', () => fetchRiverFlood(p), (river) => ({ river }));
const refreshRadar = () => run('radar', fetchRadarFrames, (radar) => ({ radar }));
const refreshAlerts = (p: LatLon) => run('alerts', () => fetchDisasterAlerts(p), (alerts) => ({ alerts }));

async function refreshTerrain(p: LatLon) {
  // Rings out to 2 km: where is the nearest ground at least 3 m above this spot?
  const pts = ringPoints(p, [250, 500, 900, 1400, 2000], 12);
  await run('terrain', () => fetchElevations(pts), (els) => ({
    hereElevation: els[0] ?? null,
    higher: findHigherGround(pts, els, bearingDeg),
  }));
}

async function refreshArea(p: LatLon) {
  await run('area', () => fetchArea(p), (a) => ({ roads: a.roads, help: a.help, roadElevations: [] }));
  const roads = liveStore.get().roads;
  if (roads.length) {
    const els = await fetchElevations(roads.slice(0, 300).map((r) => r.mid));
    liveStore.set((s) => ({ ...s, roadElevations: els }));
  }
}

let areaAt: LatLon | null = null;
let timers: ReturnType<typeof setInterval>[] = [];

/** Called whenever the phone reports a position. Cheap to call often. */
export function updateLivePosition(p: LatLon) {
  const first = liveStore.get().here === null;
  liveStore.set((s) => ({ ...s, here: p }));
  if (!areaAt || distanceM(areaAt, p) > 500) {
    areaAt = p;
    void refreshArea(p);
    void refreshTerrain(p);
    void refreshWeather(p);
    void refreshRiver(p);
    void refreshAlerts(p);
  }
  if (first) {
    void refreshRadar();
    timers.forEach(clearInterval);
    const here = () => liveStore.get().here!;
    timers = [
      setInterval(() => void refreshWeather(here()), 5 * 60_000),
      setInterval(() => void refreshRadar(), 5 * 60_000),
      setInterval(() => void refreshAlerts(here()), 15 * 60_000),
      setInterval(() => void refreshRiver(here()), 30 * 60_000),
    ];
  }
}

/** Pull-to-refresh: everything now. */
export function refreshAllLive() {
  const p = liveStore.get().here;
  void refreshRadar();
  if (!p) return;
  areaAt = p;
  void refreshWeather(p);
  void refreshRiver(p);
  void refreshAlerts(p);
  void refreshArea(p);
  void refreshTerrain(p);
}
