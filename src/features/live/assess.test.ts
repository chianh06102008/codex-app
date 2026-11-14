import type { Report } from '@/domain/types';
import { assessRoads, findHigherGround, overallLevel } from './assess';
import type { AreaRoad, Weather } from './sources';

const here = { latitude: 21.03, longitude: 105.85 };
const road = (id: string, dLat: number): AreaRoad => {
  const geometry = [
    { latitude: here.latitude + dLat, longitude: here.longitude },
    { latitude: here.latitude + dLat, longitude: here.longitude + 0.001 },
  ];
  return { id, name: id, highway: 'residential', geometry, mid: geometry[0] };
};
const now = new Date('2026-11-14T10:00:00Z');
const report = (p: Partial<Report>): Report => ({
  id: 'r', created_at: '2026-11-14T09:50:00Z', server_received_at: null, segment_id: 'x', lat: here.latitude, lon: here.longitude,
  accuracy_m: null, model_category: null, model_confidence: null, model_reference_objects: [], human_category: 'wheel',
  water_visible: true, obstruction: 'none', vehicle_context: null, no_water: false, reporter_trust: 'normal', perceptual_hash: null,
  status: 'active', retracted_at: null, ...p,
});
const dry: Weather = { retrievedAt: '', temperatureC: 25, precipitationMm: 0, weatherCode: 0, cloudCoverPct: 10, windGustKmh: 5, humidityPct: 60, hourly: [], next24hMm: 0, next3dMm: [] };
const base = { here, reports: [] as Report[], now, feedOk: true, officialInForce: false, wet: false, heavyRain: false };

describe('live road assessment', () => {
  test('no evidence and a live feed -> no_adverse_evidence, never more', () => {
    const [r] = assessRoads({ ...base, roads: [road('a', 0)], elevations: [10] });
    expect(r.state).toBe('no_adverse_evidence');
  });

  test('feed not live -> uncertain (P10)', () => {
    const [r] = assessRoads({ ...base, feedOk: false, roads: [road('a', 0)], elevations: [10] });
    expect(r.state).toBe('uncertain');
  });

  test('official warning is a floor (P2)', () => {
    const [r] = assessRoads({ ...base, officialInForce: true, roads: [road('a', 0)], elevations: [10] });
    expect(r.state).toBe('discouraged');
  });

  test('a fresh wheel-deep report on the road -> avoid', () => {
    const [r] = assessRoads({ ...base, reports: [report({})], roads: [road('a', 0)], elevations: [10] });
    expect(r.state).toBe('avoid');
  });

  test('low-lying road: uncertain when dry, discouraged when wet', () => {
    const roads = [road('low', 0), road('b', 0.002), road('c', 0.004)];
    const elevations = [5, 10, 10];
    expect(assessRoads({ ...base, roads, elevations }).find((r) => r.road.id === 'low')!.state).toBe('uncertain');
    expect(assessRoads({ ...base, wet: true, roads, elevations }).find((r) => r.road.id === 'low')!.state).toBe('discouraged');
  });
});

describe('higher ground and overall level', () => {
  test('picks the nearest point at least 3 m higher', () => {
    const pts = [here, { latitude: 21.033, longitude: 105.85 }, { latitude: 21.04, longitude: 105.85 }];
    const g = findHigherGround(pts, [10, 14, 30], () => 0);
    expect(g!.riseM).toBe(4);
  });

  test('no higher point -> null (UI says go up a solid building instead)', () => {
    expect(findHigherGround([here, { latitude: 21.04, longitude: 105.85 }], [10, 11], () => 0)).toBeNull();
  });

  test('official warning means act; heavy rain forecast means prepare; nothing means watch', () => {
    const quiet = { weather: dry, river: null, alerts: [], nearRoads: [], hereLowAndWet: false };
    expect(overallLevel({ ...quiet, officialInForce: true }).level).toBe('act');
    const rainy = { ...dry, hourly: [{ time: '', mm: 12, probability: 90, cloud: 100 }] };
    expect(overallLevel({ ...quiet, officialInForce: false, weather: rainy }).level).toBe('prepare');
    expect(overallLevel({ ...quiet, officialInForce: false }).level).toBe('watch');
  });
});
