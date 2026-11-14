// Route question state shared by Ask -> Result -> Segment screens.
import { SNAP_MAX_M } from '@/config';
import type { LatLon, RouteResult, TravelMode } from '@/domain/types';
import { NODES, SEGMENTS, SLICE_REGION, nearestNode, snapToRoad } from '@/features/map/roads';
import { computeAllStates } from '@/features/fusion/segmentStates';
import { officialStore } from '@/features/fusion/officialSource';
import { activeReports, reportStore } from '@/features/report/reportStore';
import { createStore, useStore } from '@/lib/store';
import { routeOrRefuse } from './router';

export type Place = { point: LatLon; label: string; kind: 'gps' | 'default' | 'road' | 'map' | 'search' };

export type RouteSession = {
  mode: TravelMode;
  origin: Place;
  destination: Place | null;
  result: RouteResult | null;
  selectedOption: number;
  segmentId: string | null;
};

const DEFAULT_ORIGIN: Place = {
  point: { latitude: SLICE_REGION.latitude, longitude: SLICE_REGION.longitude },
  label: '',
  kind: 'default',
};

export const sessionStore = createStore<RouteSession>({
  mode: 'motorbike', // PRD §7 S3: motorbike is the default
  origin: DEFAULT_ORIGIN,
  destination: null,
  result: null,
  selectedOption: 0,
  segmentId: null,
});

export function useRouteSession() {
  return useStore(sessionStore);
}

export function updateSession(patch: Partial<RouteSession>) {
  sessionStore.set((s) => ({ ...s, ...patch }));
}

const GRAPH = { nodeCount: NODES.length, segments: SEGMENTS };

/** Runs fusion + routing for the current question and stores the result. */
export function runRouteCheck(): RouteResult | null {
  const s = sessionStore.get();
  if (!s.destination) return null;
  const official = officialStore.get();
  const states = computeAllStates(s.mode, official, activeReports(reportStore.get()));
  const result = routeOrRefuse(GRAPH, {
    from: nearestNode(s.origin.point),
    to: nearestNode(s.destination.point),
    mode: s.mode,
    states,
    statements: official.statements,
    feedUnavailable: official.feedStatus !== 'ok',
    originSegmentId: snapToRoad(s.origin.point, SNAP_MAX_M)?.segment.id ?? null,
    destinationSegmentId: snapToRoad(s.destination.point, SNAP_MAX_M)?.segment.id ?? null,
  });
  updateSession({ result, selectedOption: 0 });
  return result;
}
