// Trips anywhere in Vietnam: OpenStreetMap routing (FOSSGIS OSRM, free), then every
// candidate route is checked against live evidence. Same promises as the pilot router:
// a route touching an "avoid" road or a do-not-travel warning is refused with no line (P3),
// an official warning on the way is shown first (P2), and nothing is called safe (P1).
import type { LatLon, OfficialStatement } from '@/domain/types';
import { distanceM } from '@/features/map/roads';
import { timeoutSignal } from '@/lib/timeout';
import type { RoadRisk } from './assess';
import { PROVINCES, statementsFor, type Province } from './vietnam';

export type Place = { name: string; address: string; point: LatLon };
export type TripMode = 'motorbike' | 'car' | 'walk';

// ---------- Place search with suggestions (Photon, OpenStreetMap) ----------
export async function suggestPlaces(q: string, near: LatLon | null, lang: 'vi' | 'en'): Promise<Place[]> {
  const params = new URLSearchParams({ q, limit: '6', bbox: '102,8,110,24' });
  if (near) {
    params.set('lat', near.latitude.toFixed(4));
    params.set('lon', near.longitude.toFixed(4));
  }
  if (lang === 'en') params.set('lang', 'en');
  const res = await fetch(`https://photon.komoot.io/api/?${params}`, { signal: timeoutSignal(8000) });
  if (!res.ok) throw new Error(String(res.status));
  const d = (await res.json()) as { features?: { geometry: { coordinates: [number, number] }; properties: Record<string, string | undefined> }[] };
  return (d.features ?? []).map((f) => {
    const p = f.properties;
    const street = [p.housenumber, p.street].filter(Boolean).join(' ');
    return {
      name: p.name ?? (street || q),
      address: [p.name ? street : '', p.district, p.city ?? p.county, p.state].filter(Boolean).join(', '),
      point: { latitude: f.geometry.coordinates[1], longitude: f.geometry.coordinates[0] },
    };
  });
}

// ---------- Routing (OSRM on routing.openstreetmap.de) ----------
export type RawRoute = { geometry: LatLon[]; distanceM: number; durationS: number };

const PROFILE: Record<TripMode, string> = { motorbike: 'routed-car/route/v1/driving', car: 'routed-car/route/v1/driving', walk: 'routed-foot/route/v1/foot' };

export async function fetchRoutes(from: LatLon, to: LatLon, mode: TripMode): Promise<RawRoute[]> {
  const url =
    `https://routing.openstreetmap.de/${PROFILE[mode]}/` +
    `${from.longitude},${from.latitude};${to.longitude},${to.latitude}?alternatives=3&overview=full&geometries=geojson`;
  const res = await fetch(url, { signal: timeoutSignal(20000) });
  if (!res.ok) throw new Error(String(res.status));
  const d = (await res.json()) as { code: string; routes?: { distance: number; duration: number; geometry: { coordinates: [number, number][] } }[] };
  if (d.code !== 'Ok' || !d.routes) return [];
  return d.routes.map((r) => ({
    geometry: r.geometry.coordinates.map(([lon, lat]) => ({ latitude: lat, longitude: lon })),
    distanceM: r.distance,
    durationS: r.duration,
  }));
}

// ---------- Checking a route against live evidence ----------
export type TripIssue =
  | { kind: 'avoid_road'; name: string | null }
  | { kind: 'discouraged_road'; name: string | null }
  | { kind: 'official'; province: string; statement: OfficialStatement; doNotTravel: boolean }
  | { kind: 'heavy_rain'; province: string; mm: number };

export type CheckedRoute = RawRoute & { issues: TripIssue[]; blocked: boolean; score: number };
export type TripResult =
  | { kind: 'route'; best: CheckedRoute; alternatives: CheckedRoute[] }
  | { kind: 'refuse'; reasons: TripIssue[] }
  | { kind: 'no_route' };

function sample(geometry: LatLon[], everyM: number): LatLon[] {
  const out: LatLon[] = [];
  let acc = everyM;
  for (let i = 1; i < geometry.length; i++) {
    acc += distanceM(geometry[i - 1], geometry[i]);
    if (acc >= everyM) {
      out.push(geometry[i]);
      acc = 0;
    }
  }
  return [geometry[0], ...out, geometry[geometry.length - 1]];
}

function nearestProvince(p: LatLon): Province {
  return PROVINCES.reduce((a, b) => (distanceM(p, b.center) < distanceM(p, a.center) ? b : a));
}

export function checkRoute(
  r: RawRoute,
  ctx: { roads: RoadRisk[]; inForceNationwide: OfficialStatement[]; provinceRainMm: Map<string, number> },
): CheckedRoute {
  const issues: TripIssue[] = [];
  // 1. Flagged roads near the phone (assessed live): any route vertex within 25 m of one.
  const pts = sample(r.geometry, 40);
  for (const rr of ctx.roads) {
    if (rr.state !== 'avoid' && rr.state !== 'discouraged') continue;
    const hit = rr.road.geometry.some((g) => pts.some((p) => distanceM(g, p) <= 25));
    if (hit) issues.push({ kind: rr.state === 'avoid' ? 'avoid_road' : 'discouraged_road', name: rr.road.name });
  }
  // 2. Provinces the route passes through (nearest provincial centre to each ~5 km sample).
  const provinces = new Set(sample(r.geometry, 5000).map((p) => nearestProvince(p).name));
  for (const name of provinces) {
    const prov = PROVINCES.find((p) => p.name === name)!;
    for (const st of statementsFor(prov, ctx.inForceNationwide)) {
      issues.push({ kind: 'official', province: name, statement: st, doNotTravel: st.do_not_travel });
    }
    const mm = ctx.provinceRainMm.get(name) ?? 0;
    if (mm >= 50) issues.push({ kind: 'heavy_rain', province: name, mm });
  }
  const blocked = issues.some((i) => i.kind === 'avoid_road' || (i.kind === 'official' && i.doNotTravel));
  const score =
    r.distanceM *
    (1 + 3 * issues.filter((i) => i.kind === 'discouraged_road').length + 2 * issues.filter((i) => i.kind === 'official').length);
  return { ...r, issues, blocked, score };
}

export function chooseTrip(routes: CheckedRoute[]): TripResult {
  if (!routes.length) return { kind: 'no_route' };
  const open = routes.filter((r) => !r.blocked).sort((a, b) => a.score - b.score);
  if (!open.length) {
    const seen = new Set<string>();
    const reasons = routes.flatMap((r) => r.issues).filter((i) => {
      const k = JSON.stringify([i.kind, 'name' in i ? i.name : '', 'province' in i ? i.province : '']);
      return seen.has(k) ? false : (seen.add(k), true);
    });
    return { kind: 'refuse', reasons };
  }
  return { kind: 'route', best: open[0], alternatives: open.slice(1, 2) };
}
