// Turns live sources into what a person should do (pure, unit-tested).
// Same four states as the pilot (PRD §8) and the same promises: never "safe" (P1),
// an official warning is a floor (P2), no data means uncertain, not calm (P10).
import { FRESH_WEIGHT_MIN, RAIN_HEAVY_MM_PER_H } from '@/config';
import type { LatLon, Report, SegmentStateKey } from '@/domain/types';
import { reportWeight } from '@/features/fusion/fusion';
import { distanceM } from '@/features/map/roads';
import type { AreaRoad, DisasterAlert, RiverFlood, Weather } from './sources';

export type RoadReason = 'feed' | 'official' | 'report_wheel' | 'report_ankle' | 'report_water' | 'low_wet' | 'low';
export type RoadRisk = { road: AreaRoad; state: SegmentStateKey; reasons: RoadReason[]; distanceM: number; elevRelM: number | null };
export type Level = 'act' | 'prepare' | 'watch';

const ORDER: SegmentStateKey[] = ['no_adverse_evidence', 'uncertain', 'discouraged', 'avoid'];
const raise = (a: SegmentStateKey, b: SegmentStateKey) => (ORDER.indexOf(b) > ORDER.indexOf(a) ? b : a);
const REPORT_NEAR_M = 35;
const LOW_M = -2; // road at least 2 m below the local median terrain

export function median(xs: number[]): number | null {
  if (!xs.length) return null;
  const s = [...xs].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
}

/** Wet now or soon: heavy rain falling or forecast within 3 h, or the river forecast to double. */
export function isWet(weather: Weather | null, river: RiverFlood | null): boolean {
  const now = weather?.precipitationMm ?? 0;
  const soon = Math.max(0, ...(weather?.hourly.slice(0, 3).map((h) => h.mm) ?? [0]));
  return now >= 2 || soon >= RAIN_HEAVY_MM_PER_H || (river?.ratio ?? 1) >= 2;
}

export function assessRoads(input: {
  roads: AreaRoad[];
  elevations: (number | null)[]; // one per road midpoint
  here: LatLon;
  reports: Report[];
  now: Date;
  feedOk: boolean;
  officialInForce: boolean;
  wet: boolean;
  heavyRain: boolean;
}): RoadRisk[] {
  const known = input.elevations.filter((e): e is number => e !== null);
  const base = median(known);
  return input.roads
    .map((road, i) => {
      const reasons: RoadReason[] = [];
      let state: SegmentStateKey = input.feedOk ? 'no_adverse_evidence' : 'uncertain';
      if (!input.feedOk) reasons.push('feed');
      if (input.officialInForce) {
        state = raise(state, 'discouraged');
        reasons.push('official');
      }
      for (const r of input.reports) {
        if (r.status === 'retracted' || r.no_water) continue;
        if (reportWeight(r, input.now, input.heavyRain) < FRESH_WEIGHT_MIN) continue;
        const p = { latitude: r.lat, longitude: r.lon };
        if (!road.geometry.some((g) => distanceM(g, p) <= REPORT_NEAR_M)) continue;
        if (r.human_category === 'wheel') { state = raise(state, 'avoid'); reasons.push('report_wheel'); }
        else if (r.human_category === 'ankle') { state = raise(state, 'discouraged'); reasons.push('report_ankle'); }
        else if (r.water_visible) { state = raise(state, 'uncertain'); reasons.push('report_water'); }
      }
      const e = input.elevations[i];
      const elevRelM = e !== null && base !== null ? Math.round((e - base) * 10) / 10 : null;
      if (elevRelM !== null && elevRelM <= LOW_M) {
        if (input.wet) { state = raise(state, 'discouraged'); reasons.push('low_wet'); }
        else { state = raise(state, 'uncertain'); reasons.push('low'); }
      }
      const d = Math.min(...road.geometry.map((g) => distanceM(input.here, g)));
      return { road, state, reasons: [...new Set(reasons)], distanceM: Math.round(d), elevRelM };
    })
    .sort((a, b) => ORDER.indexOf(b.state) - ORDER.indexOf(a.state) || a.distanceM - b.distanceM);
}

export type HigherGround = { point: LatLon; distanceM: number; riseM: number; bearing: number } | null;

/** Nearest sampled point at least 3 m above the phone's ground; null when none within the rings. */
export function findHigherGround(points: LatLon[], elevations: (number | null)[], bearing: (a: LatLon, b: LatLon) => number): HigherGround {
  const here = points[0];
  const hereE = elevations[0];
  if (hereE === null || hereE === undefined) return null;
  let best: HigherGround = null;
  points.forEach((p, i) => {
    const e = elevations[i];
    if (i === 0 || e === null || e - hereE < 3) return;
    const d = distanceM(here, p);
    if (!best || d < best.distanceM || (d === best.distanceM && e - hereE > best.riseM)) {
      best = { point: p, distanceM: Math.round(d), riseM: Math.round(e - hereE), bearing: Math.round(bearing(here, p)) };
    }
  });
  return best;
}

export function overallLevel(input: {
  officialInForce: boolean;
  weather: Weather | null;
  river: RiverFlood | null;
  alerts: DisasterAlert[];
  nearRoads: RoadRisk[]; // within 300 m
  hereLowAndWet: boolean;
}): { level: Level; why: string[] } {
  const why: string[] = [];
  const w = input.weather;
  const maxHour = Math.max(0, ...(w?.hourly.map((h) => h.mm) ?? [0]));
  const severeAlert = input.alerts.find((a) => a.current && a.level !== 'Green' && a.distanceKm <= 150);
  const nearAlert = input.alerts.find((a) => a.current && a.distanceKm <= 300);

  if (input.officialInForce) why.push('official');
  if ((w?.precipitationMm ?? 0) >= RAIN_HEAVY_MM_PER_H) why.push('rain_now');
  if (input.nearRoads.some((r) => r.state === 'avoid')) why.push('road_avoid');
  if (severeAlert) why.push('alert_severe');
  if (input.hereLowAndWet) why.push('here_low_wet');
  if (why.length) return { level: 'act', why };

  if (maxHour >= RAIN_HEAVY_MM_PER_H || (w?.next24hMm ?? 0) >= 30) why.push('rain_soon');
  if ((input.river?.ratio ?? 1) >= 1.5) why.push('river_rising');
  if (nearAlert) why.push('alert_near');
  if (input.nearRoads.some((r) => r.state === 'discouraged')) why.push('road_discouraged');
  if (why.length) return { level: 'prepare', why };
  return { level: 'watch', why };
}
