// Speed gate (PRD P7, T07). Above SPEED_GATE_KMH, route detail and the camera are
// replaced by a full-screen pull-over message. Location is while-in-use only and
// only after the person agreed in our own explanation first.
import * as Location from 'expo-location';
import { useEffect } from 'react';

import { createStore, useStore } from '@/lib/store';
import { kmhFromGps } from './speedRules';

export { isMoving } from './speedRules';

type SpeedState = {
  kmh: number | null;
  simulatedKmh: number | null;
  permission: 'unknown' | 'granted' | 'denied';
};

export const speedStore = createStore<SpeedState>({ kmh: null, simulatedKmh: null, permission: 'unknown' });

export function useSpeed() {
  return useStore(speedStore);
}

export function simulateSpeed(kmh: number | null) {
  speedStore.set((s) => ({ ...s, simulatedKmh: kmh }));
}

/** Ask for while-in-use location. Call only after showing our own explanation. */
export async function requestLocation(): Promise<boolean> {
  try {
    const { status } = await Location.requestForegroundPermissionsAsync();
    const granted = status === 'granted';
    speedStore.set((s) => ({ ...s, permission: granted ? 'granted' : 'denied' }));
    return granted;
  } catch {
    speedStore.set((s) => ({ ...s, permission: 'denied' }));
    return false;
  }
}

/** Watches speed while mounted, if permission was already granted. Never asks by itself. */
export function useSpeedWatcher() {
  const { permission } = useSpeed();
  useEffect(() => {
    if (permission !== 'granted') return;
    let sub: Location.LocationSubscription | null = null;
    let cancelled = false;
    Location.watchPositionAsync(
      { accuracy: Location.Accuracy.Balanced, timeInterval: 2000, distanceInterval: 5 },
      (pos) => {
        speedStore.set((s) => ({ ...s, kmh: kmhFromGps(pos.coords.speed) }));
      },
    )
      .then((s) => {
        if (cancelled) s.remove();
        else sub = s;
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
      sub?.remove();
    };
  }, [permission]);
}
