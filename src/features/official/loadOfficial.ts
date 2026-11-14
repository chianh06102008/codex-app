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
import { updateLivePosition } from '@/features/live/liveStore';
import { officialStore, setOfficialSource } from '@/features/fusion/officialSource';
import { timeoutSignal } from '@/lib/timeout';
import pinned from '../../../fixtures/statements/2026-11-13_lqsl-984.json';

const PINNED = pinned as unknown as OfficialStatement[];

// Every bulletin received, before the province filter. The filter is re-applied when the
// phone's province becomes known, so the order of the two fetches does not matter.
let raw: { statements: OfficialStatement[]; feedStatus: 'ok' | 'last_known'; retrievedAt: string | null } = {
  statements: PINNED,
  feedStatus: 'last_known',
  retrievedAt: PINNED.map((s) => s.retrieved_at).sort().at(-1) ?? null,
};

/** "Thành phố Hà Nội" / "Hanoi" / "TP. Hà Nội" -> "hanoi", for matching bulletin text. */
export function provinceKey(name: string): string {
  return name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[đĐ]/g, 'd')
    .toLowerCase()
    .replace(/\b(thanh pho|tinh|tp\.?|city|province)\b/g, '')
    .replace(/[^a-z]/g, '');
}

function namesProvince(s: OfficialStatement, province: string): boolean {
  const text = provinceKey([...(s.area_names ?? []), (s.instruction_text ?? '').split('\n')[0]].join(' '));
  return text.includes(provinceKey(province));
}

function applyOfficial() {
  const province = officialStore.get().province ?? PILOT_PROVINCE;
  setOfficialSource({
    feedStatus: raw.feedStatus,
    statements: raw.statements.filter((s) => namesProvince(s, province)),
    retrievedAt: raw.retrievedAt,
    simulated: false,
  });
}

export function loadPinnedBulletin() {
  applyOfficial();
}

let retry: ReturnType<typeof setTimeout> | null = null;

export async function refreshOfficial(): Promise<boolean> {
  const base = process.env.EXPO_PUBLIC_BULLETIN_SERVER_URL;
  if (!base) return false;
  if (retry) clearTimeout(retry);
  try {
    // The server reads each NCHMF page on a cold cache: allow a full minute.
    const res = await fetch(`${base.replace(/\/$/, '')}/api/official/recent?hours=24`, { signal: timeoutSignal(60000) });
    if (!res.ok) throw new Error(String(res.status));
    const body = (await res.json()) as { retrieved_at?: string; statements?: OfficialStatement[] };
    if (!Array.isArray(body.statements)) throw new Error('shape');
    // Parse failures come back without an issuer; keep only bulletins that were actually read.
    const read = body.statements.filter((s) => s && s.id && s.issuer);
    // If any bulletin could not be read, the picture is incomplete: "last known", not "ok".
    raw = {
      statements: read,
      feedStatus: read.length === body.statements.length ? 'ok' : 'last_known',
      retrievedAt: body.retrieved_at ?? new Date().toISOString(),
    };
    applyOfficial();
    return true;
  } catch {
    retry = setTimeout(() => void refreshOfficial(), 30000);
    return false;
  }
}

async function detectProvince(p: { latitude: number; longitude: number }) {
  try {
    const [place] = await Location.reverseGeocodeAsync(p);
    const province = place?.region || place?.city || place?.subregion;
    if (province && province !== officialStore.get().province) {
      setOfficialSource({ province });
      applyOfficial();
    }
  } catch {
    // Unknown province: the pilot province stays, and the UI names it.
  }
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
    updateLivePosition(here);
    void detectProvince(here);
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
let watching = false;
async function watchPosition() {
  if (watching) return;
  try {
    const perm = await Location.getForegroundPermissionsAsync();
    if (perm.status !== 'granted') return;
    watching = true;
    await Location.watchPositionAsync({ accuracy: Location.Accuracy.Balanced, distanceInterval: 150 }, (pos) => {
      const p = { latitude: pos.coords.latitude, longitude: pos.coords.longitude };
      setOfficialSource({ userLocation: p });
      updateLivePosition(p);
    });
  } catch {
    watching = false;
  }
}

export function startLiveData() {
  loadPinnedBulletin();
  void refreshOfficial();
  void refreshRain().then(watchPosition);
  void syncSharedReports();
  timers.forEach(clearInterval);
  timers = [
    setInterval(() => void refreshOfficial(), OFFICIAL_REFRESH_MS),
    setInterval(() => void refreshRain(), RAIN_REFRESH_MS),
    setInterval(() => void syncSharedReports(), 30 * 1000),
  ];
}
