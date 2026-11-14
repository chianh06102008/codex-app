// Penalized router over the pilot OSM graph (PRD §11).
// The requirement is the penalty, not the brand: this is a small Dijkstra that a
// self-hosted Valhalla/GraphHopper/OSRM can replace later behind the same function.
//
// Rules:
//  1. Never traverse an `avoid` edge.
//  2. Refuse if a fresh ankle / wheel / water-unknown segment remains on a motorbike or walking route.
//  3. Refuse if discouraged length exceeds DISCOURAGED_SHARE_MAX of the trip.
//  4. Nothing survives -> refusal with zero options. No fallback polyline, ever.
//  5. Travel time only breaks ties between routes that already passed.
import {
  ALT_ROUTE_MIN_DIFFERENCE,
  DISCOURAGED_SHARE_MAX,
  MAX_ROUTE_OPTIONS,
  MOTOBIKE_ANKLE_SEGMENTS_ALLOWED,
  PENALTY_DISCOURAGED,
  PENALTY_UNCERTAIN,
  SPEED_KMH,
} from '@/config';
import type {
  ExplanationFact,
  LatLon,
  OfficialStatement,
  RouteOption,
  RouteResult,
  Segment,
  SegmentState,
  SegmentStateKey,
  TravelMode,
} from '@/domain/types';
import { effectiveState, hasFreshDepth } from '@/features/fusion/fusion';

export type Graph = { nodeCount: number; segments: Segment[] };

type Edge = { to: number; seg: Segment; forward: boolean };

function adjacency(graph: Graph, mode: TravelMode): Edge[][] {
  const adj: Edge[][] = Array.from({ length: graph.nodeCount }, () => []);
  for (const s of graph.segments) {
    adj[s.from_node].push({ to: s.to_node, seg: s, forward: true });
    if (!(mode === 'car' && s.oneway)) adj[s.to_node].push({ to: s.from_node, seg: s, forward: false });
  }
  return adj;
}

function multiplier(state: SegmentStateKey): number {
  if (state === 'avoid') return Infinity;
  if (state === 'discouraged') return PENALTY_DISCOURAGED;
  if (state === 'uncertain') return PENALTY_UNCERTAIN;
  return 1; // never below 1: there is no "safe" bonus
}

function dijkstra(
  adj: Edge[][],
  from: number,
  to: number,
  cost: (seg: Segment) => number,
): Edge[] | null {
  const n = adj.length;
  const dist = new Float64Array(n).fill(Infinity);
  const prev: (Edge & { from: number })[] = new Array(n);
  const done = new Uint8Array(n);
  dist[from] = 0;
  // Small graph (~1k nodes): a linear-scan priority queue is fast enough on a phone.
  for (;;) {
    let u = -1, best = Infinity;
    for (let i = 0; i < n; i++) if (!done[i] && dist[i] < best) { best = dist[i]; u = i; }
    if (u === -1 || u === to) break;
    done[u] = 1;
    for (const e of adj[u]) {
      const c = cost(e.seg);
      if (!Number.isFinite(c)) continue;
      const nd = dist[u] + c;
      if (nd < dist[e.to]) { dist[e.to] = nd; prev[e.to] = { ...e, from: u }; }
    }
  }
  if (!Number.isFinite(dist[to])) return null;
  const path: Edge[] = [];
  for (let v = to; v !== from; v = prev[v].from) path.unshift(prev[v]);
  return path;
}

function toOption(path: Edge[], states: Map<string, SegmentState>, mode: TravelMode): RouteOption {
  const counts: Record<SegmentStateKey, number> = { avoid: 0, discouraged: 0, uncertain: 0, no_adverse_evidence: 0 };
  const geometry: LatLon[] = [];
  let length = 0;
  for (const e of path) {
    const st = states.get(e.seg.id)?.state ?? 'no_adverse_evidence';
    counts[st]++;
    length += e.seg.length_m;
    const g = e.forward ? e.seg.geometry : [...e.seg.geometry].reverse();
    geometry.push(...(geometry.length ? g.slice(1) : g));
  }
  return {
    geometry,
    segments: path.map((e) => e.seg.id),
    state_counts: counts,
    explanation_facts: [],
    length_m: length,
    // Omitted for motorbikes: a minute count invites a race (PRD §7 S4, persona Hùng).
    duration_s: mode === 'motorbike' ? null : Math.round(length / ((SPEED_KMH[mode] * 1000) / 3600)),
  };
}

type Verdict = { ok: boolean; facts: ExplanationFact[]; discouragedM: number };

function judge(path: Edge[], states: Map<string, SegmentState>, mode: TravelMode): Verdict {
  const facts: ExplanationFact[] = [];
  let total = 0, discouragedM = 0, freshDepth = 0, avoided = 0;
  for (const e of path) {
    const s = states.get(e.seg.id);
    total += e.seg.length_m;
    if (!s) continue;
    const eff = effectiveState(s.state, mode);
    if (eff === 'avoid') avoided++;
    if (eff === 'discouraged') discouragedM += e.seg.length_m;
    if ((mode === 'motorbike' || mode === 'walk') && hasFreshDepth(s)) {
      freshDepth++;
      const r = s.reasons.find((x) => x.kind === 'report_ankle' || x.kind === 'report_wheel' || x.kind === 'report_unknown_water');
      facts.push({
        kind: 'fresh_depth_on_route',
        segment_id: e.seg.id,
        category: r?.kind === 'report_ankle' ? 'ankle' : r?.kind === 'report_wheel' ? 'wheel' : 'unknown',
      });
    }
  }
  const share = total ? discouragedM / total : 0;
  if (share > 0) facts.push({ kind: 'discouraged_share', share, limit: DISCOURAGED_SHARE_MAX });
  const ok = avoided === 0 && freshDepth <= MOTOBIKE_ANKLE_SEGMENTS_ALLOWED && share <= DISCOURAGED_SHARE_MAX;
  return { ok, facts, discouragedM };
}

export type RouteRequest = {
  from: number;
  to: number;
  mode: TravelMode;
  states: Map<string, SegmentState>;
  statements: OfficialStatement[];
  feedUnavailable: boolean;
  /** Roads the start and destination points lie on. Reaching a point means entering its road. */
  originSegmentId?: string | null;
  destinationSegmentId?: string | null;
};

/** The start or destination lies on a road we would not route through. */
function endpointBlock(req: RouteRequest): ExplanationFact | null {
  const ends: [string | null | undefined, 'origin' | 'destination'][] = [
    [req.originSegmentId, 'origin'],
    [req.destinationSegmentId, 'destination'],
  ];
  for (const [id, end] of ends) {
    const s = id ? req.states.get(id) : undefined;
    if (!s) continue;
    const exposed = req.mode === 'motorbike' || req.mode === 'walk';
    if (effectiveState(s.state, req.mode) === 'avoid' || (exposed && hasFreshDepth(s))) {
      return { kind: 'endpoint_on_flagged_road', segment_id: s.segment_id, end };
    }
  }
  return null;
}

export function routeOrRefuse(graph: Graph, req: RouteRequest): RouteResult {
  const { from, to, mode, states } = req;
  const base: Omit<RouteResult, 'kind' | 'options' | 'refusal_facts'> = { statements: req.statements, unmapped_caveat: true };
  const contextFacts: ExplanationFact[] = [];
  for (const s of req.statements) contextFacts.push({ kind: 'official_floor', statement_id: s.id, do_not_travel: s.do_not_travel });
  if (req.feedUnavailable) contextFacts.push({ kind: 'feed_unavailable' });

  const avoidedCount = [...states.values()].filter((s) => effectiveState(s.state, mode) === 'avoid').length;
  if (avoidedCount) contextFacts.push({ kind: 'avoided_segments', count: avoidedCount });

  const blockedEnd = endpointBlock(req);
  if (blockedEnd) return { ...base, kind: 'refusal', options: [], refusal_facts: [...contextFacts, blockedEnd] };

  if (from === to) return { ...base, kind: 'refusal', options: [], refusal_facts: [...contextFacts, { kind: 'no_path' }] };

  const adj = adjacency(graph, mode);
  const stateOf = (seg: Segment) => effectiveState(states.get(seg.id)?.state ?? 'no_adverse_evidence', mode);

  // Candidate 1: lowest penalized cost. Candidate 2: same, with candidate 1's roads made pricier.
  const candidates: Edge[][] = [];
  const first = dijkstra(adj, from, to, (seg) => seg.length_m * multiplier(stateOf(seg)));
  if (first) {
    candidates.push(first);
    const used = new Set(first.map((e) => e.seg.id));
    const second = dijkstra(adj, from, to, (seg) => seg.length_m * multiplier(stateOf(seg)) * (used.has(seg.id) ? 2.5 : 1));
    if (second) {
      const overlap = second.filter((e) => used.has(e.seg.id)).length / Math.max(second.length, 1);
      if (1 - overlap >= ALT_ROUTE_MIN_DIFFERENCE) candidates.push(second);
    }
  }

  if (!candidates.length) {
    return { ...base, kind: 'refusal', options: [], refusal_facts: [...contextFacts, { kind: 'no_path' }] };
  }

  const judged = candidates.map((p) => ({ p, v: judge(p, states, mode) }));
  const passing = judged
    .filter((j) => j.v.ok)
    // Rank by how little discouraged road they use, then (only then) by length.
    .sort((a, b) => a.v.discouragedM - b.v.discouragedM || len(a.p) - len(b.p))
    .slice(0, MAX_ROUTE_OPTIONS);

  if (!passing.length) {
    const facts = dedupe([...contextFacts, ...judged.flatMap((j) => j.v.facts)]);
    return { ...base, kind: 'refusal', options: [], refusal_facts: facts };
  }

  return {
    ...base,
    kind: 'route',
    options: passing.map(({ p, v }) => ({ ...toOption(p, states, mode), explanation_facts: [...contextFacts, ...v.facts] })),
    refusal_facts: [],
  };
}

const len = (p: Edge[]) => p.reduce((s, e) => s + e.seg.length_m, 0);

function dedupe(facts: ExplanationFact[]): ExplanationFact[] {
  const seen = new Set<string>();
  return facts.filter((f) => {
    const k = JSON.stringify(f.kind === 'discouraged_share' ? { kind: f.kind } : f);
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
}
