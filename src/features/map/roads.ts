// Road graph for the pilot slice, built from a real OpenStreetMap extract
// (fixtures/segments/haichau.json, regenerate with scripts/build-road-fixture.py).
import type { LatLon, Segment } from '@/domain/types';
import raw from '../../../fixtures/segments/haichau.json';

type RawFixture = {
  source: string;
  license: string;
  retrieved_at: string | null;
  area: string;
  bbox: [number, number, number, number];
  nodes: [number, number][];
  segments: {
    id: string;
    w: number;
    n: string | null;
    h: string;
    a: number;
    b: number;
    o: boolean;
    len: number;
    g: [number, number][];
  }[];
};

const fixture = raw as unknown as RawFixture;

export const ROAD_SOURCE = {
  source: fixture.source,
  license: fixture.license,
  retrievedAt: fixture.retrieved_at,
  area: fixture.area,
};

export const NODES: LatLon[] = fixture.nodes.map(([latitude, longitude]) => ({ latitude, longitude }));

export const SEGMENTS: Segment[] = fixture.segments.map((s) => ({
  id: s.id,
  osm_way_id: s.w,
  geometry: s.g.map(([latitude, longitude]) => ({ latitude, longitude })),
  name: s.n,
  highway: s.h,
  length_m: s.len,
  oneway: s.o,
  from_node: s.a,
  to_node: s.b,
  admin_ids: ['hai-chau'],
  dem_sample_m: null,
}));

export const SEGMENT_BY_ID = new Map(SEGMENTS.map((s) => [s.id, s]));

const [minLat, minLon, maxLat, maxLon] = fixture.bbox;

export const SLICE_REGION = {
  latitude: (minLat + maxLat) / 2,
  longitude: (minLon + maxLon) / 2,
  latitudeDelta: (maxLat - minLat) * 1.15,
  longitudeDelta: (maxLon - minLon) * 1.15,
};

/** Rectangle around the pilot slice, used to tint the whole area when official status is unknown. */
export const SLICE_POLYGON: LatLon[] = [
  { latitude: minLat, longitude: minLon },
  { latitude: minLat, longitude: maxLon },
  { latitude: maxLat, longitude: maxLon },
  { latitude: maxLat, longitude: minLon },
];

export function insideSlice(p: LatLon): boolean {
  return p.latitude >= minLat && p.latitude <= maxLat && p.longitude >= minLon && p.longitude <= maxLon;
}

// ---------- geometry helpers ----------

const R = 6371000;
const rad = (d: number) => (d * Math.PI) / 180;

export function distanceM(a: LatLon, b: LatLon): number {
  const dLat = rad(b.latitude - a.latitude);
  const dLon = rad(b.longitude - a.longitude);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.latitude)) * Math.cos(rad(b.latitude)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

/** Distance from p to segment ab in meters, with a local flat projection (fine at city scale). */
function pointToLineM(p: LatLon, a: LatLon, b: LatLon): { d: number; t: number } {
  const k = Math.cos(rad(p.latitude));
  const ax = a.longitude * k, ay = a.latitude, bx = b.longitude * k, by = b.latitude;
  const px = p.longitude * k, py = p.latitude;
  const dx = bx - ax, dy = by - ay;
  const len2 = dx * dx + dy * dy;
  const t = len2 === 0 ? 0 : Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / len2));
  const proj = { latitude: ay + t * dy, longitude: (ax + t * dx) / k };
  return { d: distanceM(p, proj), t };
}

export type Snap = { segment: Segment; distance_m: number; point: LatLon };

/** Nearest mapped road to a point, or null if none within maxM. */
export function snapToRoad(p: LatLon, maxM: number): Snap | null {
  let best: Snap | null = null;
  for (const s of SEGMENTS) {
    for (let i = 0; i < s.geometry.length - 1; i++) {
      const a = s.geometry[i], b = s.geometry[i + 1];
      const { d, t } = pointToLineM(p, a, b);
      if (!best || d < best.distance_m) {
        best = {
          segment: s,
          distance_m: d,
          point: { latitude: a.latitude + t * (b.latitude - a.latitude), longitude: a.longitude + t * (b.longitude - a.longitude) },
        };
      }
    }
  }
  return best && best.distance_m <= maxM ? best : null;
}

/** Nearest graph node to a point (route endpoints). */
export function nearestNode(p: LatLon): number {
  let best = 0, bestD = Infinity;
  NODES.forEach((n, i) => {
    const d = distanceM(p, n);
    if (d < bestD) { bestD = d; best = i; }
  });
  return best;
}

export type NamedPlace = { name: string; point: LatLon };

/** One point per named main road in the slice: a destination list that always lies on the graph. */
export const NAMED_ROADS: NamedPlace[] = (() => {
  const byName = new Map<string, Segment[]>();
  for (const s of SEGMENTS) {
    if (!s.name || !['primary', 'secondary', 'tertiary'].includes(s.highway)) continue;
    byName.set(s.name, [...(byName.get(s.name) ?? []), s]);
  }
  return [...byName.entries()]
    .map(([name, segs]) => {
      const mid = segs[Math.floor(segs.length / 2)];
      return { name, point: mid.geometry[Math.floor(mid.geometry.length / 2)] };
    })
    .sort((a, b) => a.name.localeCompare(b.name, 'vi'));
})();
