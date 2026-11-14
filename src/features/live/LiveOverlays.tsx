// Map layers for the live situation: animated rain radar, risky roads around the phone,
// help places and the nearest higher ground. Rendered inside FloodMap's MapView.
import { useEffect, useState } from 'react';
import { Circle, Marker, Polyline, UrlTile } from 'react-native-maps';

import { useOfficialSource } from '@/features/fusion/officialSource';
import { nationwide, useVietnam, type Severity } from './vietnam';

import { STATE_STYLE } from '@/features/map/stateStyle';
import { openDirections } from '@/screens/LiveScreen';
import { useLive } from './liveStore';
import { useLiveSituation } from './useLiveSituation';

const HELP_COLOR: Record<string, string> = {
  hospital: '#DC2626', clinic: '#F87171', police: '#1D4ED8', fire_station: '#EA580C', shelter: '#7C3AED', assembly_point: '#7C3AED', school: '#0F766E',
};

export const SEV_COLOR: Record<Severity, string> = {
  warning: '#C2410C', heavy: '#B91C1C', rain: '#2563EB', quiet: '#64748B', unknown: '#94A3B8',
};

export function LiveOverlays() {
  const live = useLive();
  const s = useLiveSituation();
  const vn = useVietnam();
  const official = useOfficialSource();
  const provinces = nationwide(vn.rain, official.allStatements);

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
      {/* Nationwide: one circle per province, sized by rain, coloured by the worst signal. */}
      {provinces.map((p) => {
        const mm = Math.max(p.rain?.todayMm ?? 0, p.rain?.tomorrowMm ?? 0);
        const color = SEV_COLOR[p.severity];
        return (
          <Circle
            key={`vn-${p.province.name}`}
            center={p.province.center}
            radius={14000 + Math.min(mm, 120) * 400}
            fillColor={`${color}33`}
            strokeColor={color}
            strokeWidth={p.severity === 'warning' ? 3 : 1}
            zIndex={0}
          />
        );
      })}
      {provinces.map((p) => (
        <Marker
          key={`vnm-${p.province.name}`}
          coordinate={p.province.center}
          pinColor={SEV_COLOR[p.severity]}
          opacity={p.severity === 'quiet' || p.severity === 'unknown' ? 0.55 : 1}
          title={p.province.name}
          description={
            (p.inForce.length ? `⚠ NCHMF ×${p.inForce.length} · ` : '') +
            (p.rain ? `${p.rain.nowMm} mm/h · ${p.rain.todayMm} / ${p.rain.tomorrowMm} mm` : '')
          }
        />
      ))}
      {live.alerts.map((a) => (
        <Marker
          key={a.id}
          coordinate={a.point}
          pinColor={a.level === 'Red' ? '#7F1D1D' : a.level === 'Orange' ? '#EA580C' : '#16A34A'}
          title={`GDACS · ${a.name}`}
          description={`${a.level} · ${a.from.slice(0, 10)}`}
        />
      ))}
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
