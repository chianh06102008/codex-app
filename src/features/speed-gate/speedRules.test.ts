// T07: above 15 km/h, route detail and the camera are replaced by the pull-over gate.
import { isMoving, kmhFromGps } from './speedRules';

describe('T07 speed gate', () => {
  test('above the threshold the gate shows', () => {
    expect(isMoving({ kmh: 25, simulatedKmh: null })).toBe(true);
    expect(isMoving({ kmh: 15.1, simulatedKmh: null })).toBe(true);
  });

  test('at or below the threshold, or with no reading, the screen shows', () => {
    expect(isMoving({ kmh: 15, simulatedKmh: null })).toBe(false);
    expect(isMoving({ kmh: 3, simulatedKmh: null })).toBe(false);
    expect(isMoving({ kmh: null, simulatedKmh: null })).toBe(false);
  });

  test('demo simulation overrides the GPS reading both ways', () => {
    expect(isMoving({ kmh: 0, simulatedKmh: 25 })).toBe(true);
    expect(isMoving({ kmh: 30, simulatedKmh: 0 })).toBe(false);
  });

  test('GPS m/s converts to km/h; negative or missing speed is unknown', () => {
    expect(kmhFromGps(10)).toBeCloseTo(36, 5);
    expect(kmhFromGps(-1)).toBeNull();
    expect(kmhFromGps(null)).toBeNull();
    expect(kmhFromGps(undefined)).toBeNull();
  });
});
