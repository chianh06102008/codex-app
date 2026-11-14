// Client for server/vision.mjs (PRD §12). The response must be exactly a category
// (ankle | wheel | unknown), a confidence and reference objects. Anything that
// looks like a measurement is rejected (P4). Timeout -> only `unknown` is offered.
import { VISION_TIMEOUT_MS } from '@/config';
import type { DepthCategory } from '@/domain/types';

export type VisionResult =
  | { ok: true; category: DepthCategory; confidence: number | null; reference_objects: string[]; mock: boolean }
  | { ok: false; reason: 'not_configured' | 'timeout' | 'error' | 'invalid' };

const CATEGORIES: DepthCategory[] = ['ankle', 'wheel', 'unknown'];
const ALLOWED_KEYS = new Set(['category', 'confidence', 'reference_objects', 'mock', 'provider']);

export function validateVision(body: unknown): VisionResult {
  if (!body || typeof body !== 'object') return { ok: false, reason: 'invalid' };
  const b = body as Record<string, unknown>;
  // Any extra field (cm, depth, height…) means the contract was broken: reject the whole answer.
  if (Object.keys(b).some((k) => !ALLOWED_KEYS.has(k))) return { ok: false, reason: 'invalid' };
  if (!CATEGORIES.includes(b.category as DepthCategory)) return { ok: false, reason: 'invalid' };
  const refs = Array.isArray(b.reference_objects) ? b.reference_objects.filter((x) => typeof x === 'string') : [];
  // No usable reference object -> unknown, whatever the model said (T03).
  const category = refs.length === 0 ? 'unknown' : (b.category as DepthCategory);
  const confidence = typeof b.confidence === 'number' && b.confidence >= 0 && b.confidence <= 1 ? b.confidence : null;
  return { ok: true, category, confidence, reference_objects: refs as string[], mock: b.mock === true };
}

export async function analyzePhoto(imageBase64: string): Promise<VisionResult> {
  const base = process.env.EXPO_PUBLIC_VISION_SERVER_URL;
  if (!base) return { ok: false, reason: 'not_configured' };
  try {
    const res = await fetch(`${base.replace(/\/$/, '')}/api/vision`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ image_base64: imageBase64, mime: 'image/jpeg' }),
      signal: AbortSignal.timeout(VISION_TIMEOUT_MS),
    });
    if (!res.ok) return { ok: false, reason: 'error' };
    return validateVision(await res.json());
  } catch (e) {
    return { ok: false, reason: e instanceof Error && e.name === 'TimeoutError' ? 'timeout' : 'error' };
  }
}
