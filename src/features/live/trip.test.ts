import type { OfficialStatement } from '@/domain/types';
import type { RoadRisk } from './assess';
import { checkRoute, chooseTrip, type RawRoute } from './trip';

const line = (lat: number): RawRoute => ({
  geometry: [
    { latitude: lat, longitude: 105.85 },
    { latitude: lat, longitude: 105.851 },
    { latitude: lat, longitude: 105.852 },
  ],
  distanceM: 200,
  durationS: 60,
});
const flagged = (lat: number, state: RoadRisk['state']): RoadRisk => ({
  road: { id: 'r', name: 'Phố Ngập', highway: 'residential', geometry: [{ latitude: lat, longitude: 105.851 }], mid: { latitude: lat, longitude: 105.851 } },
  state, reasons: [], distanceM: 0, elevRelM: null,
});
const ctx = (roads: RoadRisk[] = [], st: OfficialStatement[] = []) => ({ roads, inForceNationwide: st, provinceRainMm: new Map<string, number>() });

describe('trip anywhere', () => {
  test('a route through an avoid road is blocked; with no other route the answer is a refusal, no line (P3)', () => {
    const r = checkRoute(line(21.03), ctx([flagged(21.03, 'avoid')]));
    expect(r.blocked).toBe(true);
    expect(chooseTrip([r]).kind).toBe('refuse');
  });

  test('the router picks the route that avoids the flagged road', () => {
    const a = checkRoute(line(21.03), ctx([flagged(21.03, 'avoid')]));
    const b = checkRoute(line(21.04), ctx([flagged(21.03, 'avoid')]));
    const t = chooseTrip([a, b]);
    expect(t.kind).toBe('route');
    if (t.kind === 'route') expect(t.best.geometry[0].latitude).toBe(21.04);
  });

  test('an official warning in force on the way is reported; do-not-travel blocks', () => {
    const st = { id: 'w', area_names: ['Hà Nội'], instruction_text: '', do_not_travel: true } as unknown as OfficialStatement;
    const r = checkRoute(line(21.03), ctx([], [st]));
    expect(r.issues.some((i) => i.kind === 'official')).toBe(true);
    expect(r.blocked).toBe(true);
  });
});
