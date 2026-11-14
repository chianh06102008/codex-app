// One hook that combines live sources, the official feed and crowd reports into what the UI shows.
import { useMemo } from 'react';

import { useOfficialSource } from '@/features/fusion/officialSource';
import { summarizeOfficial } from '@/features/official/officialView';
import { activeReports, useReports } from '@/features/report/reportStore';
import { assessRoads, isWet, median, overallLevel } from './assess';
import { useLive } from './liveStore';

export function useLiveSituation() {
  const live = useLive();
  const official = useOfficialSource();
  const reportsState = useReports();
  const view = summarizeOfficial(official);
  const officialInForce = view.inForce.length > 0;

  return useMemo(() => {
    const now = new Date();
    const wet = isWet(live.weather, live.river);
    const roads = live.here
      ? assessRoads({
          roads: live.roads,
          elevations: live.roads.map((_, i) => live.roadElevations[i] ?? null),
          here: live.here,
          reports: activeReports(reportsState),
          now,
          feedOk: official.feedStatus === 'ok',
          officialInForce,
          wet,
          heavyRain: official.heavyRain,
        })
      : [];
    const near = roads.filter((r) => r.distanceM <= 300);
    const base = median(live.roadElevations.filter((e): e is number => e !== null));
    const hereRel = live.hereElevation !== null && base !== null ? live.hereElevation - base : null;
    const hereLowAndWet = hereRel !== null && hereRel <= -2 && wet;
    const overall = overallLevel({ officialInForce, weather: live.weather, river: live.river, alerts: live.alerts, nearRoads: near, hereLowAndWet });
    return { live, official, view, officialInForce, wet, roads, near, hereRel, overall };
  }, [live, official, reportsState, view, officialInForce]);
}
