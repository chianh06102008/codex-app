// Feeds Dev 2's NCHMF bulletins into the official store (PRD P2, P10).
// 1. At start: the bulletin pinned in fixtures/ is shown as "last known", with its time and link.
//    It is never promoted to "ok": an old file is not a live feed.
// 2. If EXPO_PUBLIC_BULLETIN_SERVER_URL is set (npm run bulletin-server on the laptop), the
//    last 24 h of NCHMF bulletins are fetched; success makes the feed "ok".
// A failed fetch keeps "last known" — it never becomes an all-clear.
import * as Location from 'expo-location';

import { OFFICIAL_REFRESH_MS, PILOT_PROVINCE, RAIN_REFRESH_MS } from '@/config';
import type { OfficialStatement } from '@/domain/types';
import { SLICE_REGION, insideSlice } from '@/features/map/roads';
import { sessionStore, updateSession } from '@/features/routing/session';
import { syncSharedReports } from '@/features/report/reportStore';
import { fetchRainAt } from './rain';
import { officialStore, setOfficialSource } from '@/features/fusion/officialSource';
import { timeoutSignal } from '@/lib/timeout';
import pinned from '../../../fixtures/statements/2026-11-13_lqsl-984.json';

const PINNED = pinned as unknown as OfficialStatement[];

export function loadPinnedBulletin() {
  const retrievedAt = PINNED.map((s) => s.retrieved_at).sort().at(-1) ?? null;
  setOfficialSource({ feedStatus: 'last_known', statements: PINNED, retrievedAt, simulated: false });
}

export async function refreshOfficial(): Promise<boolean> {
  const base = process.env.EXPO_PUBLIC_BULLETIN_SERVER_URL;
  if (!base) return false;
  try {
    const res = await fetch(`${base.replace(/\/$/, '')}/api/official/recent?hours=24`, { signal: timeoutSignal(20000) });
    if (!res.ok) return false;
    const body = (await res.json()) as { retrieved_at?: string; statements?: OfficialStatement[] };
    if (!Array.isArray(body.statements)) return false;
    // Parse failures come back without an issuer; keep only bulletins that were actually read.
    // NCHMF bulletins are national. A statement with no geometry covers the whole pilot slice,
    // so only bulletins that name the pilot province may enter (else Lâm Đồng would floor Đà Nẵng).
    const read = body.statements.filter((s) => s && s.id && s.issuer);
    const statements = read.filter((s) => namesPilot(s));
    // If any bulletin could not be read, the picture is incomplete: say "last known", not "ok".
    const complete = read.length === body.statements.length;
    setOfficialSource({
      feedStatus: complete ? 'ok' : 'last_known',
      statements,
      retrievedAt: body.retrieved_at ?? new Date().toISOString(),
      simulated: false,
    });
    return true;
  } catch {
    return false;
  }
}

function namesPilot(s: OfficialStatement): boolean {
  const text = [...(s.area_names ?? []), s.instruction_text ?? ''].join(' ');
  return text.includes(PILOT_PROVINCE);
}

/** The phone's position if permission is given; null otherwise (never blocks the app). */
async function currentPosition() {
  try {
    const perm = await Location.requestForegroundPermissionsAsync();
    if (perm.status !== 'granted') return null;
    const last = await Location.getLastKnownPositionAsync();
    const pos = last ?? (await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }));
    return { latitude: pos.coords.latitude, longitude: pos.coords.longitude };
  } catch {
    return null;
  }
}

export async function refreshRain(): Promise<void> {
  const here = (await currentPosition()) ?? null;
  if (here) {
    setOfficialSource({ userLocation: here });
    // Inside the pilot slice the trip starts where the phone is, unless the user already chose a start.
    if (insideSlice(here) && sessionStore.get().origin.kind === 'default') {
      updateSession({ origin: { point: here, label: '', kind: 'gps' } });
    }
  }
  // No permission: read rain over the pilot slice instead, and the UI says where it was read.
  const at = here ?? { latitude: SLICE_REGION.latitude, longitude: SLICE_REGION.longitude };
  const rain = await fetchRainAt(at.latitude, at.longitude);
  if (!rain) return;
  const simulated = officialStore.get().heavyRainSimulated;
  setOfficialSource({ rain, heavyRain: rain.heavy || simulated });
}

let timers: ReturnType<typeof setInterval>[] = [];

/** Starts every live source. Safe to call once at app start. */
export function startLiveData() {
  loadPinnedBulletin();
  void refreshOfficial();
  void refreshRain();
  void syncSharedReports();
  timers.forEach(clearInterval);
  timers = [
    setInterval(() => void refreshOfficial(), OFFICIAL_REFRESH_MS),
    setInterval(() => void refreshRain(), RAIN_REFRESH_MS),
    setInterval(() => void syncSharedReports(), 30 * 1000),
  ];
}
