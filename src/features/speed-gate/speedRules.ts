// Pure speed-gate rule (PRD P7, T07), tested without a phone.
import { SPEED_GATE_KMH } from '@/config';

export type SpeedReading = { kmh: number | null; simulatedKmh: number | null };

/** Above SPEED_GATE_KMH, route detail and the camera are replaced by the pull-over gate. */
export function isMoving(s: SpeedReading): boolean {
  const kmh = s.simulatedKmh ?? s.kmh;
  return kmh !== null && Number.isFinite(kmh) && kmh > SPEED_GATE_KMH;
}

/** GPS speed is m/s and may be negative or null when unknown. */
export function kmhFromGps(mps: number | null | undefined): number | null {
  return typeof mps === 'number' && mps >= 0 ? mps * 3.6 : null;
}
