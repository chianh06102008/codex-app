// Live sources the phone calls directly. All free, no key, work anywhere in Vietnam.
//   Weather + clouds      Open-Meteo forecast     https://open-meteo.com (CC BY 4.0)
//   River flood forecast  Open-Meteo Flood/GloFAS https://open-meteo.com/en/docs/flood-api
//   Terrain elevation     Open-Meteo Elevation (Copernicus DEM 90 m)
//   Rain radar            RainViewer               https://www.rainviewer.com/api.html
//   Disaster alerts       GDACS (UN/EC)            https://www.gdacs.org
//   Roads, hospitals...   OpenStreetMap Overpass   © OpenStreetMap contributors, ODbL
// Each is a model or a third party, labeled as such in the UI; none sets the official floor.
import type { LatLon } from '@/domain/types';
import { distanceM } from '@/features/map/roads';
import { timeoutSignal } from '@/lib/timeout';

async function getJson<T>(url: string, ms = 20000, init?: RequestInit): Promise<T> {
  const res = await fetch(url, { ...init, signal: timeoutSignal(ms) });
  if (!res.ok) throw new Error(`${res.status} ${url}`);
  const text = await res.text();
  // 204 / empty body = "nothing to report" (GDACS does this when no event is open).
  return (text.trim() ? JSON.parse(text) : null) as T;
}

// ---------- Weather, clouds, rain (Open-Meteo) ----------
export type Weather = {
  retrievedAt: string;
  temperatureC: number | null;
  precipitationMm: number | null; // last hour
  weatherCode: number | null;
  cloudCoverPct: number | null;
  windGustKmh: number | null;
  humidityPct: number | null;
  feelsLikeC: number | null;
  windKmh: number | null;
  windDirDeg: number | null;
  pressureHpa: number | null;
  visibilityM: number | null;
  uvIndex: number | null;
  isDay: boolean | null;
  hourly: { time: string; mm: number; probability: number | null; cloud: number | null }[]; // next 12 h
  next24hMm: number;
  next3dMm: number[]; // daily sums, today first
};

export async function fetchWeather(p: LatLon): Promise<Weather> {
  const url =
    `https://api.open-meteo.com/v1/forecast?latitude=${p.latitude.toFixed(4)}&longitude=${p.longitude.toFixed(4)}` +
    '&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,cloud_cover,wind_speed_10m,wind_direction_10m,wind_gusts_10m,surface_pressure,visibility,uv_index,is_day' +
    '&hourly=precipitation,precipitation_probability,cloud_cover&forecast_hours=24' +
    '&daily=precipitation_sum&forecast_days=3&timezone=auto';
  type R = {
    current?: Record<string, number | string | null>;
    hourly?: { time: string[]; precipitation: (number | null)[]; precipitation_probability: (number | null)[]; cloud_cover: (number | null)[] };
    daily?: { precipitation_sum: (number | null)[] };
  };
  const b = await getJson<R>(url);
  const num = (v: unknown) => (typeof v === 'number' && Number.isFinite(v) ? v : null);
  const h = b.hourly;
  const hourly = h
    ? h.time.map((time, i) => ({ time, mm: num(h.precipitation[i]) ?? 0, probability: num(h.precipitation_probability[i]), cloud: num(h.cloud_cover[i]) }))
    : [];
  return {
    retrievedAt: new Date().toISOString(),
    temperatureC: num(b.current?.temperature_2m),
    precipitationMm: num(b.current?.precipitation),
    weatherCode: num(b.current?.weather_code),
    cloudCoverPct: num(b.current?.cloud_cover),
    windGustKmh: num(b.current?.wind_gusts_10m),
    humidityPct: num(b.current?.relative_humidity_2m),
    feelsLikeC: num(b.current?.apparent_temperature),
    windKmh: num(b.current?.wind_speed_10m),
    windDirDeg: num(b.current?.wind_direction_10m),
    pressureHpa: num(b.current?.surface_pressure),
    visibilityM: num(b.current?.visibility),
    uvIndex: num(b.current?.uv_index),
    isDay: b.current?.is_day == null ? null : b.current.is_day === 1,
    hourly: hourly.slice(0, 12),
    next24hMm: Math.round(hourly.reduce((a, x) => a + x.mm, 0) * 10) / 10,
    next3dMm: (b.daily?.precipitation_sum ?? []).map((x) => num(x) ?? 0),
  };
}

// ---------- River flood forecast (GloFAS via Open-Meteo) ----------
export type RiverFlood = {
  retrievedAt: string;
  days: { date: string; m3s: number }[]; // 3 past days, then today and 7 forecast days
  todayIndex: number;
  today: number;
  peak: number;
  peakDate: string;
  /** Forecast peak relative to today's flow. */
  ratio: number;
};

export async function fetchRiverFlood(p: LatLon): Promise<RiverFlood | null> {
  const url =
    `https://flood-api.open-meteo.com/v1/flood?latitude=${p.latitude.toFixed(4)}&longitude=${p.longitude.toFixed(4)}` +
    '&daily=river_discharge&past_days=3&forecast_days=8';
  const b = await getJson<{ daily?: { time: string[]; river_discharge: (number | null)[] } }>(url);
  if (!b.daily) return null;
  const days = b.daily.time
    .map((date, i) => ({ date, m3s: b.daily!.river_discharge[i] }))
    .filter((d): d is { date: string; m3s: number } => typeof d.m3s === 'number');
  if (days.length < 5) return null;
  const todayIso = new Date().toISOString().slice(0, 10);
  const todayIndex = Math.max(0, days.findIndex((d) => d.date >= todayIso));
  const future = days.slice(todayIndex);
  const peakDay = future.reduce((a, d) => (d.m3s > a.m3s ? d : a), future[0]);
  const today = days[todayIndex].m3s;
  return {
    retrievedAt: new Date().toISOString(),
    days,
    todayIndex,
    today,
    peak: peakDay.m3s,
    peakDate: peakDay.date,
    ratio: today > 0 ? peakDay.m3s / today : 1,
  };
}

// ---------- Rain radar frames (RainViewer) ----------
export type RadarFrame = { time: number; url: string; nowcast: boolean };

export async function fetchRadarFrames(): Promise<RadarFrame[]> {
  type F = { time: number; path: string };
  const b = await getJson<{ host: string; radar: { past: F[]; nowcast?: F[] } }>('https://api.rainviewer.com/public/weather-maps.json');
  const tile = (f: F, nowcast: boolean) => ({
    time: f.time,
    nowcast,
    // 256 px tiles, color scheme 2 (universal blue), smoothed, snow shown.
    url: `${b.host}${f.path}/256/{z}/{x}/{y}/2/1_1.png`,
  });
  return [...b.radar.past.map((f) => tile(f, false)), ...(b.radar.nowcast ?? []).map((f) => tile(f, true))];
}

// ---------- Disaster alerts (GDACS) ----------
export type DisasterAlert = {
  id: string;
  type: 'flood' | 'cyclone';
  level: 'Green' | 'Orange' | 'Red';
  name: string;
  from: string;
  to: string;
  current: boolean;
  point: LatLon;
  distanceKm: number;
  url: string | null;
};

export async function fetchDisasterAlerts(here: LatLon): Promise<DisasterAlert[]> {
  type G = {
    features: {
      geometry: { coordinates: [number, number] };
      properties: {
        eventtype: string; eventid: number; alertlevel: string; name: string; fromdate: string; todate: string;
        iscurrent: string | boolean; url?: { report?: string };
      };
    }[];
  };
  const b = await getJson<G>(
    'https://www.gdacs.org/gdacsapi/api/events/geteventlist/SEARCH?eventlist=TC;FL&country=Vietnam',
    25000,
  );
  if (!b?.features) return [];
  return b.features
    .map((f) => {
      const [lon, lat] = f.geometry.coordinates;
      const point = { latitude: lat, longitude: lon };
      const p = f.properties;
      return {
        id: `${p.eventtype}-${p.eventid}`,
        type: p.eventtype === 'TC' ? 'cyclone' : 'flood',
        level: (['Green', 'Orange', 'Red'].includes(p.alertlevel) ? p.alertlevel : 'Green') as DisasterAlert['level'],
        name: p.name,
        from: p.fromdate,
        to: p.todate,
        current: p.iscurrent === true || p.iscurrent === 'true',
        point,
        distanceKm: Math.round(distanceM(here, point) / 1000),
        url: p.url?.report ?? null,
      } as DisasterAlert;
    })
    .filter((a) => a.current || Date.parse(a.to) > Date.now() - 3 * 24 * 3600 * 1000)
    .sort((a, b) => a.distanceKm - b.distanceKm);
}

// ---------- Roads and help around the phone (OpenStreetMap) ----------
export type AreaRoad = { id: string; name: string | null; highway: string; geometry: LatLon[]; mid: LatLon };
export type HelpPlace = {
  id: string;
  kind: 'hospital' | 'clinic' | 'police' | 'fire_station' | 'shelter' | 'assembly_point' | 'school';
  name: string | null;
  point: LatLon;
  distanceM: number;
};

const OVERPASS = [
  'https://overpass-api.de/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter',
  'https://overpass.private.coffee/api/interpreter',
];

async function overpass<T>(query: string): Promise<T> {
  let last: unknown = null;
  for (let attempt = 0; attempt < 2; attempt++) {
    for (const host of OVERPASS) {
      try {
        return await getJson<T>(host, 30000, {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'User-Agent': 'FloodScout/0.1 (hackathon demo)', Accept: 'application/json' },
          body: `data=${encodeURIComponent(query)}`,
        });
      } catch (e) {
        last = e;
      }
    }
  }
  throw last ?? new Error('overpass');
}

export async function fetchArea(here: LatLon, radiusM = 1200): Promise<{ roads: AreaRoad[]; help: HelpPlace[] }> {
  const at = `${radiusM},${here.latitude.toFixed(5)},${here.longitude.toFixed(5)}`;
  const helpAt = `${radiusM * 3},${here.latitude.toFixed(5)},${here.longitude.toFixed(5)}`;
  const q =
    '[out:json][timeout:25];(' +
    `way[highway~"^(motorway|trunk|primary|secondary|tertiary|unclassified|residential|living_street)$"](around:${at});` +
    ');out geom;(' +
    `nwr[amenity~"^(hospital|clinic|police|fire_station|shelter)$"](around:${helpAt});` +
    `nwr[emergency=assembly_point](around:${helpAt});` +
    `nwr[amenity=school](around:${at});` +
    ');out center 80;';
  type El = {
    type: string; id: number; tags?: Record<string, string>;
    geometry?: { lat: number; lon: number }[]; lat?: number; lon?: number; center?: { lat: number; lon: number };
  };
  const b = await overpass<{ elements: El[] }>(q);
  const roads: AreaRoad[] = [];
  const help: HelpPlace[] = [];
  for (const e of b.elements) {
    if (e.type === 'way' && e.tags?.highway && e.geometry && e.geometry.length >= 2) {
      const geometry = e.geometry.map((g) => ({ latitude: g.lat, longitude: g.lon }));
      roads.push({ id: `w${e.id}`, name: e.tags.name ?? null, highway: e.tags.highway, geometry, mid: geometry[Math.floor(geometry.length / 2)] });
      continue;
    }
    const c = e.center ?? (e.lat != null && e.lon != null ? { lat: e.lat, lon: e.lon } : null);
    const t = e.tags ?? {};
    const kind = (t.emergency === 'assembly_point' ? 'assembly_point' : t.amenity) as HelpPlace['kind'];
    if (!c || !kind) continue;
    const point = { latitude: c.lat, longitude: c.lon };
    help.push({ id: `${e.type}${e.id}`, kind, name: t['name:vi'] ?? t.name ?? null, point, distanceM: Math.round(distanceM(here, point)) });
  }
  help.sort((a, b) => a.distanceM - b.distanceM);
  return { roads, help };
}

// ---------- Terrain (Open-Meteo Elevation, Copernicus DEM ~90 m) ----------
export async function fetchElevations(points: LatLon[]): Promise<(number | null)[]> {
  const out: (number | null)[] = [];
  for (let i = 0; i < points.length; i += 100) {
    const batch = points.slice(i, i + 100);
    const url =
      'https://api.open-meteo.com/v1/elevation?latitude=' +
      batch.map((p) => p.latitude.toFixed(5)).join(',') +
      '&longitude=' +
      batch.map((p) => p.longitude.toFixed(5)).join(',');
    try {
      const b = await getJson<{ elevation: (number | null)[] }>(url);
      out.push(...batch.map((_, j) => (typeof b.elevation[j] === 'number' ? b.elevation[j] : null)));
    } catch {
      out.push(...batch.map(() => null));
    }
  }
  return out;
}

/** Points on rings around `here`, used to look for higher ground. */
export function ringPoints(here: LatLon, radii: number[], perRing = 12): LatLon[] {
  const pts: LatLon[] = [here];
  const mPerDegLat = 111_320;
  const mPerDegLon = 111_320 * Math.cos((here.latitude * Math.PI) / 180);
  for (const r of radii) {
    for (let k = 0; k < perRing; k++) {
      const a = (2 * Math.PI * k) / perRing;
      pts.push({ latitude: here.latitude + (r * Math.cos(a)) / mPerDegLat, longitude: here.longitude + (r * Math.sin(a)) / mPerDegLon });
    }
  }
  return pts;
}

export function bearingDeg(a: LatLon, b: LatLon): number {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const y = Math.sin(toRad(b.longitude - a.longitude)) * Math.cos(toRad(b.latitude));
  const x =
    Math.cos(toRad(a.latitude)) * Math.sin(toRad(b.latitude)) -
    Math.sin(toRad(a.latitude)) * Math.cos(toRad(b.latitude)) * Math.cos(toRad(b.longitude - a.longitude));
  return ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360;
}
