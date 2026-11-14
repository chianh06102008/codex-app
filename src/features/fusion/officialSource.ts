// Adapter between Dev 2's official-status module and fusion/routing.
//
// Until Dev 2's `getOfficialStatus()` lands, the honest default is
// "official status unavailable" (PRD P2/P10): every segment is at least
// `uncertain`, so motorbike/walking routes are refused. A demo switch can
// simulate a healthy feed with no statements; it is labeled in the UI and
// NEVER invents a warning (PRD §13 honest demo rule).
//
// Dev 2: call `setOfficialSource({ feedStatus, statements, retrievedAt })`
// whenever your fetch/cache resolves, and implement `statementsForSegment`
// with real geometry intersection.
import type { LatLon, OfficialFeedStatus, OfficialStatement, Segment } from '@/domain/types';
import { createStore, useStore } from '@/lib/store';
import type { RainContext } from '@/features/official/rain';

export type OfficialSource = {
  feedStatus: OfficialFeedStatus;
  statements: OfficialStatement[];
  retrievedAt: string | null;
  /** True when the status comes from the demo switch rather than a real source. */
  simulated: boolean;
  /** Rain context, labeled as a model (Open-Meteo). Heavy rain speeds up report decay. */
  heavyRain: boolean;
  heavyRainSimulated: boolean;
  /** Real Open-Meteo reading at the phone's location (null until fetched). */
  rain: RainContext | null;
  /** Where the phone is, when location permission was given. */
  userLocation: LatLon | null;
};

export const officialStore = createStore<OfficialSource>({
  feedStatus: 'unavailable',
  statements: [],
  retrievedAt: null,
  simulated: false,
  heavyRain: false,
  heavyRainSimulated: false,
  rain: null,
  userLocation: null,
});

export function setOfficialSource(next: Partial<OfficialSource>) {
  officialStore.set((s) => ({ ...s, ...next }));
}

export function useOfficialSource() {
  return useStore(officialStore);
}

/** Demo only: pretend the feed answered with no statements. Labeled "simulated" everywhere. */
export function simulateHealthyFeed(on: boolean) {
  setOfficialSource(
    on
      ? { feedStatus: 'ok', statements: [], retrievedAt: new Date().toISOString(), simulated: true }
      : { feedStatus: 'unavailable', statements: [], retrievedAt: null, simulated: false },
  );
}

export function simulateHeavyRain(on: boolean) {
  // Switching the simulation off falls back to the real reading, not to "no rain".
  const real = officialStore.get().rain?.heavy ?? false;
  setOfficialSource({ heavyRain: on || real, heavyRainSimulated: on });
}

function pointInPolygon(p: LatLon, ring: LatLon[]): boolean {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const a = ring[i], b = ring[j];
    if (
      a.latitude > p.latitude !== b.latitude > p.latitude &&
      p.longitude < ((b.longitude - a.longitude) * (p.latitude - a.latitude)) / (b.latitude - a.latitude) + a.longitude
    ) inside = !inside;
  }
  return inside;
}

/**
 * Statements that cover a segment. A statement with no parsed geometry covers the
 * whole pilot slice (conservative: the floor applies everywhere it might apply).
 */
export function statementsForSegment(segment: Segment, statements: OfficialStatement[]): OfficialStatement[] {
  return statements.filter((s) => !s.geometry || segment.geometry.some((p) => pointInPolygon(p, s.geometry!)));
}
