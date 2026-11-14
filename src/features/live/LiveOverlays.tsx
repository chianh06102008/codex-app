// Map layers for the live situation: animated rain radar, risky roads around the phone,
// help places and the nearest higher ground. Rendered inside FloodMap's MapView.
import { useEffect, useState } from 'react';
import { Marker, Polyline, UrlTile } from 'react-native-maps';

import { STATE_STYLE } from '@/features/map/stateStyle';
import { openDirections } from '@/screens/LiveScreen';
import { useLive } from './liveStore';
import { useLiveSituation } from './useLiveSituation';

const HELP_COLOR: Record<string, string> = {
  hospital: '#DC2626', clinic: '#F87171', police: '#1D4ED8', fire_station: '#EA580C', shelter: '#7C3AED', assembly_point: '#7C3AED', school: '#0F766E',
};

export function LiveOverlays() {
  const live = useLive();
  const s = useLiveSituation();

  // Loop through the radar frames (past hour + short forecast), then hold on "now" for a beat.
  const frames = live.radar;
  const [i, setI] = useState(0);
  useEffect(() => {
    if (!live.showRadar || frames.length === 0) return;
    const t = setInterval(() => setI((x) => (x + 1) % (frames.length + 3)), 650);
    return () => clearInterval(t);
  }, [live.showRadar, frames.length]);
  const nowIndex = Math.max(0, frames.findIndex((f) => f.nowcast) - 1);
  const frame = frames.length ? frames[i < frames.length ? i : nowIndex >= 0 ? nowIndex : frames.length - 1] : null;

  return (
    <>
      {live.showRadar && frame && (
        <UrlTile key={frame.url} urlTemplate={frame.url} maximumZ={12} opacity={0.55} zIndex={1} tileSize={256} />
      )}
      {s.roads
        .filter((r) => r.state !== 'no_adverse_evidence')
        .slice(0, 150)
        .map((r) => (
          <Polyline
            key={r.road.id}
            coordinates={r.road.geometry}
            strokeColor={STATE_STYLE[r.state].line}
            strokeWidth={STATE_STYLE[r.state].width}
            lineDashPattern={r.state === 'uncertain' ? [6, 6] : undefined}
            lineCap="round"
            zIndex={r.state === 'avoid' ? 4 : 3}
          />
        ))}
      {live.help
        .filter((h) => h.kind !== 'school')
        .slice(0, 12)
        .map((h) => (
          <Marker
            key={h.id}
            coordinate={h.point}
            pinColor={HELP_COLOR[h.kind]}
            title={h.name ?? h.kind}
            description={`${h.distanceM} m`}
            onCalloutPress={() => openDirections(h.point, h.name)}
          />
        ))}
      {live.higher && (
        <Marker
          coordinate={live.higher.point}
          pinColor="#15803D"
          title={`▲ +${live.higher.riseM} m`}
          description={`${live.higher.distanceM} m`}
          onCalloutPress={() => openDirections(live.higher!.point)}
        />
      )}
    </>
  );
}
