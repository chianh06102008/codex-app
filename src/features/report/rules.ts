// Pure report-flow rules used by ReportScreen (tested in rules.test.ts).
import type { DepthCategory } from '@/domain/types';
import type { ReportDraft } from './draftCore';
import type { VisionResult } from './vision';

const ALL: DepthCategory[] = ['ankle', 'wheel', 'unknown'];

/**
 * Categories the person may tap. While the model is running, or when it is down,
 * timed out or broke the contract, the only depth choice is `unknown` (PRD Flow: report).
 */
export function allowedCategories(vision: VisionResult | null, analyzing: boolean): DepthCategory[] {
  if (analyzing || !vision || !vision.ok) return ['unknown'];
  return ALL;
}

/** T04: no publish without dry-ground ack, a confirmed road and an explicit, allowed category tap. */
export function canPublish(d: ReportDraft, analyzing: boolean): boolean {
  if (!d.dryAck || !d.segmentId || !d.point || !d.category) return false;
  return allowedCategories(d.vision, analyzing).includes(d.category);
}

/** A draft restored after the app was killed (T08). A vision call cannot survive a restart. */
export function restoreDraft(d: ReportDraft | null): ReportDraft | null {
  if (!d || d.step <= 1 || d.step >= 5) return null;
  const vision: VisionResult = d.vision ?? { ok: false, reason: 'error' };
  const category = d.category && allowedCategories(vision, false).includes(d.category) ? d.category : null;
  return { ...d, vision, category };
}
