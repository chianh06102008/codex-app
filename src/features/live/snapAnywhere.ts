// Place a report on a road anywhere in Vietnam:
//   1. inside the Hải Châu pilot: the pilot road graph (routing uses it);
//   2. elsewhere: the live OpenStreetMap roads loaded around the phone;
//   3. no road data yet: the exact point (live assessment reads report lat/lon, so it still counts).
import { SNAP_MAX_M } from '@/config';
import type { LatLon } from '@/domain/types';
import { SEGMENT_BY_ID, distanceM, insideSlice, snapToRoad } from '@/features/map/roads';
import { liveStore } from './liveStore';

export type Snap = { segmentId: string; point: LatLon; name: string | null; geometry: LatLon[] | null };

function nearestOnLine(p: LatLon, a: LatLon, b: LatLon): LatLon {
  const ax = a.longitude, ay = a.latitude, bx = b.longitude, by = b.latitude;
  const dx = bx - ax, dy = by - ay;
  const len = dx * dx + dy * dy;
  const t = len ? Math.max(0, Math.min(1, ((p.longitude - ax) * dx + (p.latitude - ay) * dy) / len)) : 0;
  return { latitude: ay + t * dy, longitude: ax + t * dx };
}

export function snapAnywhere(p: LatLon, allowPoint = true): Snap | null {
  if (insideSlice(p)) {
    const s = snapToRoad(p, SNAP_MAX_M);
    if (s) return { segmentId: s.segment.id, point: s.point, name: s.segment.name, geometry: s.segment.geometry };
  }
  let best: (Snap & { d: number }) | null = null;
  for (const r of liveStore.get().roads) {
    for (let i = 0; i < r.geometry.length - 1; i++) {
      const q = nearestOnLine(p, r.geometry[i], r.geometry[i + 1]);
      const d = distanceM(p, q);
      if (d <= SNAP_MAX_M && (!best || d < best.d)) best = { segmentId: r.id, point: q, name: r.name, geometry: r.geometry, d };
    }
  }
  if (best) return { segmentId: best.segmentId, point: best.point, name: best.name, geometry: best.geometry };
  return allowPoint ? { segmentId: `pt:${p.latitude.toFixed(5)},${p.longitude.toFixed(5)}`, point: p, name: null, geometry: null } : null;
}

/** Name/geometry for a stored segment id from any of the three sources. */
export function describeSegment(id: string | null): { name: string | null; geometry: LatLon[] | null } | null {
  if (!id) return null;
  const pilot = SEGMENT_BY_ID.get(id);
  if (pilot) return { name: pilot.name, geometry: pilot.geometry };
  const live = liveStore.get().roads.find((r) => r.id === id);
  if (live) return { name: live.name, geometry: live.geometry };
  return { name: null, geometry: null };
}
