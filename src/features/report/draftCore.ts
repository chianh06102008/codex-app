// Draft persistence logic over any key-value storage, so it can be tested without a phone.
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

export type KeyValueStorage = {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
  removeItem(key: string): Promise<void>;
};

export const DRAFT_KEY = 'floodscout.reportDraft.v1';

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

export function createDraftStore(storage: KeyValueStorage) {
  return {
    async load(): Promise<ReportDraft | null> {
      try {
        const raw = await storage.getItem(DRAFT_KEY);
        return raw ? (JSON.parse(raw) as ReportDraft) : null;
      } catch {
        return null;
      }
    },
    async save(d: ReportDraft): Promise<void> {
      try {
        await storage.setItem(DRAFT_KEY, JSON.stringify(d));
      } catch {
        // keep going; the in-memory draft still works
      }
    },
    async clear(): Promise<void> {
      try {
        await storage.removeItem(DRAFT_KEY);
      } catch {
        // ignore
      }
    },
  };
}
