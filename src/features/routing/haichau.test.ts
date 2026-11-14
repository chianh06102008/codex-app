// Integration: fusion + routing on the real Hải Châu OSM graph, using the same
// sample-report roads as the demo. Guards the demo script in docs/map-report.md.
import type { OfficialFeedStatus, Report, SegmentState, TravelMode } from '@/domain/types';
import { computeSegmentState } from '@/features/fusion/fusion';
import { NAMED_ROADS, NODES, SEGMENTS, SLICE_REGION, nearestNode, snapToRoad } from '@/features/map/roads';
import { routeOrRefuse } from './router';

const now = new Date();
const minsAgo = (m: number) => new Date(now.getTime() - m * 60_000).toISOString();

function reportOn(road: string, category: Report['human_category'], ageMin: number): Report[] {
  // One report per segment of the road, so a detour must leave the road entirely.
  return SEGMENTS.filter((s) => s.name === road).map((s, i) => ({
    id: `${road}-${i}`, created_at: minsAgo(ageMin), server_received_at: null, segment_id: s.id,
    lat: s.geometry[0].latitude, lon: s.geometry[0].longitude, accuracy_m: 10, model_category: null,
    model_confidence: null, model_reference_objects: [], human_category: category, water_visible: true,
    obstruction: 'none', vehicle_context: null, no_water: false, reporter_trust: 'low', perceptual_hash: null,
    status: 'published', retracted_at: null,
  }));
}

function states(mode: TravelMode, feed: OfficialFeedStatus, reports: Report[]) {
  const by = new Map<string, Report[]>();
  for (const r of reports) by.set(r.segment_id, [...(by.get(r.segment_id) ?? []), r]);
  const m = new Map<string, SegmentState>();
  for (const s of SEGMENTS) {
    m.set(s.id, computeSegmentState(s.id, mode, { now, feedStatus: feed, statements: [], reports: by.get(s.id) ?? [], heavyRain: false }));
  }
  return m;
}

const graph = { nodeCount: NODES.length, segments: SEGMENTS };
const center = nearestNode({ latitude: SLICE_REGION.latitude, longitude: SLICE_REGION.longitude });
const dest = (name: string) => nearestNode(NAMED_ROADS.find((r) => r.name === name)!.point);

describe('Hải Châu graph', () => {
  test('fixture is a real, connected road network', () => {
    expect(SEGMENTS.length).toBeGreaterThan(1000);
    expect(NAMED_ROADS.length).toBeGreaterThan(20);
  });

  test('feed unavailable -> motorbike refusal, no geometry (honest default)', () => {
    const r = routeOrRefuse(graph, { from: center, to: dest('Đường Lê Đình Lý'), mode: 'motorbike', states: states('motorbike', 'unavailable', []), statements: [], feedUnavailable: true });
    expect(r.kind).toBe('refusal');
    expect(r.options).toHaveLength(0);
  });

  test('feed ok + wheel on Bạch Đằng: route exists and never uses Bạch Đằng', () => {
    const reports = reportOn('Đường Bạch Đằng', 'wheel', 15);
    const r = routeOrRefuse(graph, { from: center, to: dest('Đường Lê Đình Lý'), mode: 'motorbike', states: states('motorbike', 'ok', reports), statements: [], feedUnavailable: false });
    expect(r.kind).toBe('route');
    const bachDang = new Set(SEGMENTS.filter((s) => s.name === 'Đường Bạch Đằng').map((s) => s.id));
    for (const o of r.options) for (const id of o.segments) expect(bachDang.has(id)).toBe(false);
  });

  test('destination on a road with fresh ankle reports -> motorbike refusal naming that road', () => {
    const reports = reportOn('Đường Hoàng Diệu', 'ankle', 10);
    const point = NAMED_ROADS.find((r) => r.name === 'Đường Hoàng Diệu')!.point;
    const r = routeOrRefuse(graph, {
      from: center, to: dest('Đường Hoàng Diệu'), mode: 'motorbike', states: states('motorbike', 'ok', reports),
      statements: [], feedUnavailable: false, destinationSegmentId: snapToRoad(point, 120)?.segment.id,
    });
    expect(r.kind).toBe('refusal');
    expect(r.options).toHaveLength(0);
    expect(r.refusal_facts.some((f) => f.kind === 'endpoint_on_flagged_road' && f.end === 'destination')).toBe(true);
  });

  test('car may still get a route to that destination (ankle is discouraged, not a block, for cars)', () => {
    const reports = reportOn('Đường Hoàng Diệu', 'ankle', 10);
    const point = NAMED_ROADS.find((r) => r.name === 'Đường Hoàng Diệu')!.point;
    const r = routeOrRefuse(graph, {
      from: center, to: dest('Đường Hoàng Diệu'), mode: 'car', states: states('car', 'ok', reports),
      statements: [], feedUnavailable: false, destinationSegmentId: snapToRoad(point, 120)?.segment.id,
    });
    expect(r.refusal_facts.some((f) => f.kind === 'endpoint_on_flagged_road')).toBe(false);
  });
});
