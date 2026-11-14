// Report draft persistence (PRD T08): killing the app mid-report keeps the draft.
import AsyncStorage from '@react-native-async-storage/async-storage';

import type { DepthCategory, LatLon } from '@/domain/types';
import type { VisionResult } from './vision';

export type ReportDraft = {
  step: 1 | 2 | 3 | 4 | 5;
  dryAck: boolean;
  photoUri: string | null;
  photoBytes: number | null;
  segmentId: string | null;
  point: LatLon | null;
  category: DepthCategory | null;
  waterVisible: boolean;
  obstruction: boolean;
  vision: VisionResult | null;
  startedAt: string;
};

const KEY = 'floodscout.reportDraft.v1';

export const emptyDraft = (): ReportDraft => ({
  step: 1,
  dryAck: false,
  photoUri: null,
  photoBytes: null,
  segmentId: null,
  point: null,
  category: null,
  waterVisible: false,
  obstruction: false,
  vision: null,
  startedAt: new Date().toISOString(),
});

export async function loadDraft(): Promise<ReportDraft | null> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as ReportDraft) : null;
  } catch {
    return null;
  }
}

export async function saveDraft(d: ReportDraft): Promise<void> {
  try {
    await AsyncStorage.setItem(KEY, JSON.stringify(d));
  } catch {
    // keep going; the in-memory draft still works
  }
}

export async function clearDraft(): Promise<void> {
  try {
    await AsyncStorage.removeItem(KEY);
  } catch {
    // ignore
  }
}
