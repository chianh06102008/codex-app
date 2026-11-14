// Fusion: official floor + crowd reports -> SegmentState (PRD §8).
// Pure functions, no UI. Every rule here is a safety rule; see fusion.test.ts.
//
// Invariants:
//  - Official warnings are a floor. Reports can raise risk, never lower it (P2).
//  - There is no "safe" bonus: no evidence ever makes a segment calmer than
//    `no_adverse_evidence`, and that state is never called a clearance (P1).
//  - Evidence expires: weight is 0 after REPORT_HARD_ZERO_HOURS (P5).
//  - Feed down means at least `uncertain` (P10).
import {
  DECAY_HALFLIFE_QUIET_MIN,
  DECAY_HALFLIFE_RAIN_MIN,
  FRESH_WEIGHT_MIN,
  REPORT_HARD_ZERO_HOURS,
} from '@/config';
import type {
  Floor,
  OfficialFeedStatus,
  OfficialStatement,
  Report,
  SegmentState,
  SegmentStateKey,
  StateReason,
  TravelMode,
} from '@/domain/types';

export type FusionContext = {
  now: Date;
  feedStatus: OfficialFeedStatus;
  /** Official statements whose area covers this segment (Dev 2 does the geometry intersection). */
  statements: OfficialStatement[];
  /** Reports snapped to this segment. */
  reports: Report[];
  /** Rain context (labeled as a model). Heavy rain makes crowd evidence decay faster. */
  heavyRain: boolean;
};

const RANK: Record<SegmentStateKey, number> = { no_adverse_evidence: 0, uncertain: 1, discouraged: 2, avoid: 3 };

export function stricter(a: SegmentStateKey, b: SegmentStateKey): SegmentStateKey {
  return RANK[a] >= RANK[b] ? a : b;
}

/** Report routing weight in [0, 1] (PRD §8 Decay). */
export function reportWeight(report: Report, now: Date, heavyRain: boolean): number {
  if (report.status === 'retracted' || report.retracted_at) return 0;
  if (report.status === 'draft' || report.status === 'expired') return 0;
  const ageMin = (now.getTime() - new Date(report.created_at).getTime()) / 60_000;
  if (ageMin < 0) return 1;
  if (ageMin > REPORT_HARD_ZERO_HOURS * 60) return 0;
  const halfLife = heavyRain ? DECAY_HALFLIFE_RAIN_MIN : DECAY_HALFLIFE_QUIET_MIN;
  return Math.pow(0.5, ageMin / halfLife);
}

function isActive(statement: OfficialStatement, now: Date): boolean {
  if (statement.valid_from && new Date(statement.valid_from) > now) return false;
  // A statement past its validity is not a floor anymore. Dev 2 may keep showing it as last-known.
  if (statement.valid_until && new Date(statement.valid_until) < now) return false;
  return true;
}

export function computeSegmentState(segmentId: string, mode: TravelMode, ctx: FusionContext): SegmentState {
  const at = ctx.now.toISOString();
  const reasons: StateReason[] = [];
  let state: SegmentStateKey = 'no_adverse_evidence';
  let floor: Floor = 'none';
  let floorStatementId: string | null = null;

  // 1. Official floor. If two overlap, the stricter one wins.
  for (const s of ctx.statements.filter((x) => isActive(x, ctx.now))) {
    if (s.do_not_travel) {
      state = 'avoid';
      floor = 'do_not_travel';
      floorStatementId = s.id;
      reasons.push({ kind: 'official_do_not_travel', statement_id: s.id, at: s.retrieved_at });
    } else if (s.hazard_type === 'flash_flood' || s.hazard_type === 'landslide') {
      state = 'avoid';
      if (floor === 'none') { floor = 'warning'; floorStatementId = s.id; }
      reasons.push({ kind: 'official_hazard', statement_id: s.id, at: s.retrieved_at, hazard: s.hazard_type });
    } else {
      state = stricter(state, 'discouraged');
      if (floor === 'none') { floor = 'warning'; floorStatementId = s.id; }
      reasons.push({ kind: 'official_warning', statement_id: s.id, at: s.retrieved_at });
    }
  }

  // 2. Feed down or only last-known: never keep an all-clear. Must match the banner, which
  //    says "degraded" for anything but a confirmed live feed (officialView.summarizeOfficial).
  if (ctx.feedStatus !== 'ok') {
    state = stricter(state, 'uncertain');
    reasons.push({ kind: 'feed_unavailable', at });
  }

  // 3. Crowd reports. Each one can only raise the state.
  const live = ctx.reports
    .map((r) => ({ r, w: reportWeight(r, ctx.now, ctx.heavyRain) }))
    .sort((a, b) => new Date(b.r.created_at).getTime() - new Date(a.r.created_at).getTime());

  for (const { r, w } of live) {
    if (w === 0 && r.status !== 'retracted') reasons.push({ kind: 'report_expired', report_id: r.id, at: r.created_at });
  }

  const adverse = live.filter(({ r, w }) => w >= FRESH_WEIGHT_MIN && !r.no_water);
  const noWater = live.filter(({ r, w }) => w >= FRESH_WEIGHT_MIN && r.no_water);

  // Two independent fresh no-water reports, newer than every adverse report, may retire a
  // crowd penalty early — only with a healthy feed, no floor and quiet rain. The segment then
  // goes to `uncertain`, never straight to `no_adverse_evidence`.
  const newestAdverse = adverse.length ? new Date(adverse[0].r.created_at).getTime() : -Infinity;
  const newerNoWater = noWater.filter(({ r }) => new Date(r.created_at).getTime() > newestAdverse);
  const canRetire =
    adverse.length > 0 && newerNoWater.length >= 2 && ctx.feedStatus === 'ok' && floor === 'none' && !ctx.heavyRain;

  if (canRetire) {
    state = stricter(state, 'uncertain');
    reasons.push({ kind: 'no_water_retired_penalty', report_ids: newerNoWater.map(({ r }) => r.id), at });
  } else {
    for (const { r, w } of adverse) {
      const exposed = mode === 'walk' || mode === 'motorbike';
      if (r.obstruction !== 'none') {
        state = 'avoid';
        reasons.push({ kind: 'report_obstruction', report_id: r.id, at: r.created_at, weight: w });
      } else if (r.human_category === 'wheel') {
        state = stricter(state, exposed ? 'avoid' : 'discouraged');
        reasons.push({ kind: 'report_wheel', report_id: r.id, at: r.created_at, weight: w });
      } else if (r.human_category === 'unknown' && r.water_visible) {
        state = stricter(state, exposed ? 'avoid' : 'discouraged');
        reasons.push({ kind: 'report_unknown_water', report_id: r.id, at: r.created_at, weight: w });
      } else if (r.human_category === 'ankle') {
        // Ankle describes a photo. It is not permission to cross: discouraged for every mode.
        state = stricter(state, 'discouraged');
        reasons.push({ kind: 'report_ankle', report_id: r.id, at: r.created_at, weight: w });
      }
    }
  }

  return { segment_id: segmentId, state, floor, floor_statement_id: floorStatementId, reasons, computed_at: at };
}

/** For routing: walking and motorbike treat `uncertain` as discouraged (PRD §8). */
export function effectiveState(state: SegmentStateKey, mode: TravelMode): SegmentStateKey {
  if (state === 'uncertain' && (mode === 'walk' || mode === 'motorbike')) return 'discouraged';
  return state;
}

/** True when this segment carries fresh depth evidence that blocks a motorbike/walking route (PRD §11.3). */
export function hasFreshDepth(s: SegmentState): boolean {
  return s.reasons.some((r) => r.kind === 'report_ankle' || r.kind === 'report_unknown_water' || r.kind === 'report_wheel');
}
