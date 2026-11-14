// Computes SegmentState for every road in the slice from the current official
// source and reports. Screens read states only through these functions.
import { useMemo } from 'react';

import type { OfficialStatement, Report, SegmentState, TravelMode } from '@/domain/types';
import { SEGMENTS } from '@/features/map/roads';
import { activeReports, useReports } from '@/features/report/reportStore';
import { computeSegmentState } from './fusion';
import { type OfficialSource, statementsForSegment, useOfficialSource } from './officialSource';

export function computeAllStates(
  mode: TravelMode,
  official: OfficialSource,
  reports: Report[],
  now = new Date(),
): Map<string, SegmentState> {
  const bySegment = new Map<string, Report[]>();
  for (const r of reports) bySegment.set(r.segment_id, [...(bySegment.get(r.segment_id) ?? []), r]);
  const out = new Map<string, SegmentState>();
  for (const seg of SEGMENTS) {
    const statements: OfficialStatement[] = statementsForSegment(seg, official.statements);
    out.set(
      seg.id,
      computeSegmentState(seg.id, mode, {
        now,
        feedStatus: official.feedStatus,
        statements,
        reports: bySegment.get(seg.id) ?? [],
        heavyRain: official.heavyRain,
      }),
    );
  }
  return out;
}

export function useSegmentStates(mode: TravelMode): Map<string, SegmentState> {
  const official = useOfficialSource();
  const reportState = useReports();
  return useMemo(
    () => computeAllStates(mode, official, activeReports(reportState)),
    [mode, official, reportState],
  );
}
