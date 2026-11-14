// Crowd reports. Kept on this phone (AsyncStorage) and, when EXPO_PUBLIC_VISION_SERVER_URL
// is set, shared through server/vision.mjs so every phone sees them. Seeded sample reports
// are off by default (Demo panel) and always labeled as samples in the UI.
import { timeoutSignal } from '@/lib/timeout';
import AsyncStorage from '@react-native-async-storage/async-storage';

import type { DepthCategory, Report } from '@/domain/types';
import { SEGMENTS } from '@/features/map/roads';
import { createStore, useStore } from '@/lib/store';

const KEY = 'floodscout.reports.v1';

const minutesAgo = (m: number) => new Date(Date.now() - m * 60_000).toISOString();

function seed(
  id: string,
  roadName: string,
  category: DepthCategory,
  ageMin: number,
  extra: Partial<Report> = {},
): Report | null {
  const segs = SEGMENTS.filter((s) => s.name === roadName);
  const seg = segs[Math.floor(segs.length / 2)];
  if (!seg) return null;
  const p = seg.geometry[Math.floor(seg.geometry.length / 2)];
  return {
    id,
    created_at: minutesAgo(ageMin),
    server_received_at: null,
    segment_id: seg.id,
    lat: p.latitude,
    lon: p.longitude,
    accuracy_m: 10,
    model_category: category,
    model_confidence: 0.6,
    model_reference_objects: category === 'unknown' ? [] : ['curb'],
    human_category: category,
    water_visible: category !== 'unknown' || !!extra.water_visible,
    obstruction: 'none',
    vehicle_context: 'motorbike',
    no_water: false,
    reporter_trust: 'low',
    perceptual_hash: null,
    status: 'published',
    retracted_at: null,
    sample: true,
    ...extra,
  };
}

function sampleReports(): Report[] {
  return [
    seed('sample-1', 'Đường Bạch Đằng', 'wheel', 18),
    seed('sample-2', 'Đường Hoàng Diệu', 'ankle', 32),
    seed('sample-3', 'Đường Nguyễn Văn Linh', 'unknown', 50, { water_visible: true }),
    seed('sample-4', 'Đường Ông Ích Khiêm', 'ankle', 70),
    // Older than 12 h: kept on the timeline, routing weight 0.
    seed('sample-5', 'Đường Hùng Vương', 'wheel', 13 * 60),
  ].filter((r): r is Report => r !== null);
}

type State = { reports: Report[]; loaded: boolean; showSamples: boolean };

export const reportStore = createStore<State>({ reports: sampleReports(), loaded: false, showSamples: false });

export async function loadReports(): Promise<void> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    const mine: Report[] = raw ? JSON.parse(raw) : [];
    reportStore.set((s) => ({ ...s, reports: [...sampleReports(), ...mine], loaded: true }));
  } catch {
    reportStore.set((s) => ({ ...s, loaded: true }));
  }
}

// ---------- Shared reports (server/vision.mjs /api/reports) ----------
function reportServer(): string | null {
  const base = process.env.EXPO_PUBLIC_VISION_SERVER_URL;
  return base ? base.replace(/\/$/, '') : null;
}

/** Pulls reports made on other phones. Failure leaves local reports untouched. */
export async function syncSharedReports(): Promise<boolean> {
  const base = reportServer();
  if (!base) return false;
  try {
    const res = await fetch(`${base}/api/reports`, { signal: timeoutSignal(10000) });
    if (!res.ok) return false;
    const body = (await res.json()) as { reports?: Report[] };
    if (!Array.isArray(body.reports)) return false;
    reportStore.set((s) => {
      const localIds = new Set(s.reports.filter((r) => !r.shared).map((r) => r.id));
      const shared = body.reports!
        .filter((r) => !localIds.has(r.id) && ['ankle', 'wheel', 'unknown'].includes(r.human_category))
        .map((r) => ({ ...r, shared: true, sample: false, photo_uri: null }));
      return { ...s, reports: [...s.reports.filter((r) => !r.shared), ...shared] };
    });
    return true;
  } catch {
    return false;
  }
}

async function pushReport(report: Report, path = '') {
  const base = reportServer();
  if (!base) return;
  try {
    const { photo_uri: _photo, sample: _sample, shared: _shared, ...body } = report;
    await fetch(`${base}/api/reports${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(path ? {} : body),
      signal: timeoutSignal(10000),
    });
  } catch {
    // Offline: the report still counts on this phone; the next sync does not resend (MVP).
  }
}

async function persist() {
  const mine = reportStore.get().reports.filter((r) => !r.sample && !r.shared);
  try {
    await AsyncStorage.setItem(KEY, JSON.stringify(mine));
  } catch {
    // Storage failure keeps the in-memory copy; nothing to show the user beyond "not saved".
  }
}

export async function addReport(report: Report): Promise<void> {
  reportStore.set((s) => ({ ...s, reports: [...s.reports, report] }));
  await persist();
  void pushReport(report);
}

export async function retractReport(id: string): Promise<void> {
  const now = new Date().toISOString();
  reportStore.set((s) => ({
    ...s,
    reports: s.reports.map((r) => (r.id === id ? { ...r, status: 'retracted', retracted_at: now } : r)),
  }));
  await persist();
  void pushReport({ id } as Report, `/${encodeURIComponent(id)}/retract`);
}

/** Removes every report made on this phone (S8 "delete my reports"). Samples stay. */
export async function deleteMyReports(): Promise<void> {
  reportStore.set((s) => ({ ...s, reports: s.reports.filter((r) => r.sample || r.shared) }));
  await persist();
}

export function setShowSamples(showSamples: boolean) {
  reportStore.set((s) => ({ ...s, showSamples }));
}

/** Reports that take part in fusion (samples can be switched off for a clean demo). */
export function activeReports(s: State = reportStore.get()): Report[] {
  return s.reports.filter((r) => s.showSamples || !r.sample);
}

export function useReports() {
  return useStore(reportStore);
}
