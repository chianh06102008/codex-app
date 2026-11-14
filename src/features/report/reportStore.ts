// Crowd reports. MVP has no shared backend: reports are kept on this phone
// (AsyncStorage) and feed local fusion so the effect is visible. Seeded sample
// reports sit on real Hải Châu roads and are always labeled as samples in the UI.
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

export const reportStore = createStore<State>({ reports: sampleReports(), loaded: false, showSamples: true });

export async function loadReports(): Promise<void> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    const mine: Report[] = raw ? JSON.parse(raw) : [];
    reportStore.set((s) => ({ ...s, reports: [...sampleReports(), ...mine], loaded: true }));
  } catch {
    reportStore.set((s) => ({ ...s, loaded: true }));
  }
}

async function persist() {
  const mine = reportStore.get().reports.filter((r) => !r.sample);
  try {
    await AsyncStorage.setItem(KEY, JSON.stringify(mine));
  } catch {
    // Storage failure keeps the in-memory copy; nothing to show the user beyond "not saved".
  }
}

export async function addReport(report: Report): Promise<void> {
  reportStore.set((s) => ({ ...s, reports: [...s.reports, report] }));
  await persist();
}

export async function retractReport(id: string): Promise<void> {
  const now = new Date().toISOString();
  reportStore.set((s) => ({
    ...s,
    reports: s.reports.map((r) => (r.id === id ? { ...r, status: 'retracted', retracted_at: now } : r)),
  }));
  await persist();
}

/** Removes every report made on this phone (S8 "delete my reports"). Samples stay. */
export async function deleteMyReports(): Promise<void> {
  reportStore.set((s) => ({ ...s, reports: s.reports.filter((r) => r.sample) }));
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
