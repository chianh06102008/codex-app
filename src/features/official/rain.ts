// Real rain context at the phone's location, straight from Open-Meteo (free, no key).
// It is a model, labeled as such, and never sets the official floor (PRD P2): it only
// shortens how long crowd reports count when heavy rain is forecast.
import { RAIN_HEAVY_MM_PER_H } from '@/config';
import { timeoutSignal } from '@/lib/timeout';

export type RainContext = {
  source: 'Open-Meteo';
  latitude: number;
  longitude: number;
  retrievedAt: string;
  /** Next 3 hours, mm. */
  next3hMm: number;
  maxMmPerHour: number;
  maxProbability: number | null;
  heavy: boolean;
};

export async function fetchRainAt(latitude: number, longitude: number): Promise<RainContext | null> {
  const url =
    `https://api.open-meteo.com/v1/forecast?latitude=${latitude.toFixed(4)}&longitude=${longitude.toFixed(4)}` +
    '&hourly=precipitation,precipitation_probability&forecast_hours=3&timezone=auto';
  try {
    const res = await fetch(url, { signal: timeoutSignal(15000) });
    if (!res.ok) return null;
    const body = (await res.json()) as {
      hourly?: { precipitation?: (number | null)[]; precipitation_probability?: (number | null)[] };
    };
    const mm = (body.hourly?.precipitation ?? []).filter((x): x is number => typeof x === 'number');
    if (mm.length === 0) return null;
    const prob = (body.hourly?.precipitation_probability ?? []).filter((x): x is number => typeof x === 'number');
    const maxMmPerHour = Math.max(...mm);
    return {
      source: 'Open-Meteo',
      latitude,
      longitude,
      retrievedAt: new Date().toISOString(),
      next3hMm: Math.round(mm.reduce((a, b) => a + b, 0) * 10) / 10,
      maxMmPerHour,
      maxProbability: prob.length ? Math.max(...prob) : null,
      heavy: maxMmPerHour >= RAIN_HEAVY_MM_PER_H,
    };
  } catch {
    return null;
  }
}
