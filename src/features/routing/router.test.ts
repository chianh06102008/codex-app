import type { Segment, SegmentState, SegmentStateKey } from '@/domain/types';
import { routeOrRefuse, type Graph } from './router';

// A small ladder graph:
//   0 —a— 1 —b— 2
//   |           |
//   c           d
//   |           |
//   3 ——— e ——— 4      route 0 -> 2: short via a,b; long via c,e,d
const pts = [
  { latitude: 0, longitude: 0 }, { latitude: 0, longitude: 1 }, { latitude: 0, longitude: 2 },
  { latitude: 1, longitude: 0 }, { latitude: 1, longitude: 2 },
];
const seg = (id: string, a: number, b: number, len: number): Segment => ({
  id, osm_way_id: 1, geometry: [pts[a], pts[b]], name: id, highway: 'residential', length_m: len,
  oneway: false, from_node: a, to_node: b, admin_ids: [], dem_sample_m: null,
});
const graph: Graph = {
  nodeCount: 5,
  segments: [seg('a', 0, 1, 100), seg('b', 1, 2, 100), seg('c', 0, 3, 100), seg('e', 3, 4, 200), seg('d', 4, 2, 100)],
};

const NOW = new Date().toISOString();
function states(map: Record<string, SegmentStateKey>, depth: string[] = []): Map<string, SegmentState> {
  const m = new Map<string, SegmentState>();
  for (const s of graph.segments) {
    m.set(s.id, {
      segment_id: s.id, state: map[s.id] ?? 'no_adverse_evidence', floor: 'none', floor_statement_id: null,
      reasons: depth.includes(s.id) ? [{ kind: 'report_ankle', report_id: 'r', at: NOW, weight: 1 }] : [], computed_at: NOW,
    });
  }
  return m;
}
const req = (st: Map<string, SegmentState>, mode: 'motorbike' | 'car' = 'motorbike') => ({
  from: 0, to: 2, mode, states: st, statements: [], feedUnavailable: false,
});

describe('router', () => {
  test('no adverse evidence -> route, shortest first', () => {
    const r = routeOrRefuse(graph, req(states({})));
    expect(r.kind).toBe('route');
    expect(r.options[0].segments).toEqual(['a', 'b']);
    expect(r.unmapped_caveat).toBe(true);
  });

  test('never traverses an avoid edge; detours instead', () => {
    const r = routeOrRefuse(graph, req(states({ b: 'avoid' })));
    expect(r.kind).toBe('route');
    for (const o of r.options) expect(o.segments).not.toContain('b');
    expect(r.options[0].segments).toEqual(['c', 'e', 'd']);
  });

  test('T06: every candidate hits a hard block -> refusal with no geometry at all', () => {
    const r = routeOrRefuse(graph, req(states({ b: 'avoid', e: 'avoid' })));
    expect(r.kind).toBe('refusal');
    expect(r.options).toHaveLength(0);
    expect(r.refusal_facts.some((f) => f.kind === 'no_path')).toBe(true);
  });

  test('fresh ankle segment on the only open path -> motorbike refusal', () => {
    const r = routeOrRefuse(graph, req(states({ b: 'avoid', e: 'discouraged' }, ['e'])));
    expect(r.kind).toBe('refusal');
    expect(r.options).toHaveLength(0);
  });

  test('discouraged share over the budget -> refusal (no fallback to fastest)', () => {
    const r = routeOrRefuse(graph, req(states({ a: 'discouraged', b: 'discouraged', c: 'discouraged', e: 'discouraged', d: 'discouraged' }), 'car'));
    expect(r.kind).toBe('refusal');
  });

  test('uncertain everywhere: motorbike refused, car allowed (PRD §8 uncertain rule)', () => {
    const all = states({ a: 'uncertain', b: 'uncertain', c: 'uncertain', d: 'uncertain', e: 'uncertain' });
    expect(routeOrRefuse(graph, req(all, 'motorbike')).kind).toBe('refusal');
    expect(routeOrRefuse(graph, req(all, 'car')).kind).toBe('route');
  });

  test('motorbike option has no duration (no race)', () => {
    const r = routeOrRefuse(graph, req(states({})));
    expect(r.options[0].duration_s).toBeNull();
  });

  test('at most two options', () => {
    expect(routeOrRefuse(graph, req(states({}))).options.length).toBeLessThanOrEqual(2);
  });
});
