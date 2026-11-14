// Client for server/vision.mjs (PRD §12). The response must be exactly a category
// (ankle | wheel | unknown), a confidence and reference objects. Anything that
// looks like a measurement is rejected (P4). Timeout -> only `unknown` is offered.
import { VISION_TIMEOUT_MS } from '@/config';
import type { DepthCategory } from '@/domain/types';
import { isAbort, timeoutSignal } from '@/lib/timeout';

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
  // unknown never carries references, so nothing downstream reads a depth into it.
  const reference_objects = category === 'unknown' ? [] : (refs as string[]);
  return { ok: true, category, confidence, reference_objects, mock: b.mock === true };
}

const PROMPT = `You classify one outdoor street photo from Vietnam for a flood-risk reporting tool.
Return JSON only with exactly: "category" (one of "ankle", "wheel", "unknown"), "confidence" (0-1), "reference_objects" (short names of physical objects of known height visibly touching the standing water surface).
- "wheel": water reaches half a motorbike wheel (hub/axle/exhaust) or higher against a visible reference in the water. Borderline ankle/wheel -> wheel.
- "ankle": standing water clearly visible at roughly ankle height against a reference touching the water (curb, tire bottom, ankle, sandal, door sill, step).
- "unknown" when: no standing water; water but no reference touching the waterline; night/dark; blurred; a screenshot of a screen; indoors; a selfie/face.
If "unknown", reference_objects MUST be []. Never list generic words (water, street, road, sky, rain, building, wall, roof, reflection, glare). Never output any measurement. Never give travel advice.`;

const GENERIC = /^(water|street|road|sky|rain|building|wall|roof|reflection|glare)s?$/i;

/** Direct to Gemini from the phone when the laptop server is out of reach (e.g. on mobile data). */
async function viaGeminiDirect(imageBase64: string): Promise<VisionResult> {
  const key = process.env.EXPO_PUBLIC_GEMINI_API_KEY;
  if (!key) return { ok: false, reason: 'not_configured' };
  try {
    const res = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': key },
      body: JSON.stringify({
        contents: [{ parts: [{ text: PROMPT }, { inline_data: { mime_type: 'image/jpeg', data: imageBase64 } }] }],
        generationConfig: {
          temperature: 0,
          responseMimeType: 'application/json',
          responseSchema: {
            type: 'OBJECT',
            properties: {
              category: { type: 'STRING', enum: CATEGORIES },
              confidence: { type: 'NUMBER' },
              reference_objects: { type: 'ARRAY', items: { type: 'STRING' } },
            },
            required: ['category', 'confidence', 'reference_objects'],
          },
        },
      }),
      signal: timeoutSignal(VISION_TIMEOUT_MS + 8000),
    });
    if (!res.ok) return { ok: false, reason: 'error' };
    const data = await res.json();
    const text: string = data?.candidates?.[0]?.content?.parts?.map((p: { text?: string }) => p.text ?? '').join('') || '{}';
    const raw = JSON.parse(text) as { category?: string; confidence?: number; reference_objects?: unknown[] };
    const refs = (Array.isArray(raw.reference_objects) ? raw.reference_objects : [])
      .filter((x): x is string => typeof x === 'string' && x.length < 60 && !GENERIC.test(x.trim()))
      .slice(0, 8);
    // Same contract as the server: only the three fields go through validateVision.
    return validateVision({ category: raw.category, confidence: raw.confidence, reference_objects: refs, provider: 'gemini' });
  } catch (e) {
    return { ok: false, reason: isAbort(e) ? 'timeout' : 'error' };
  }
}

export async function analyzePhoto(imageBase64: string): Promise<VisionResult> {
  const base = process.env.EXPO_PUBLIC_VISION_SERVER_URL;
  if (!base) return viaGeminiDirect(imageBase64);
  const viaServer = await analyzeViaServer(base, imageBase64);
  // Laptop unreachable (mobile data, other Wi-Fi): go straight to Gemini.
  return viaServer.ok || viaServer.reason === 'invalid' ? viaServer : viaGeminiDirect(imageBase64);
}

async function analyzeViaServer(base: string, imageBase64: string): Promise<VisionResult> {
  try {
    const res = await fetch(`${base.replace(/\/$/, '')}/api/vision`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ image_base64: imageBase64, mime: 'image/jpeg' }),
      signal: timeoutSignal(6000),
    });
    if (!res.ok) return { ok: false, reason: 'error' };
    return validateVision(await res.json());
  } catch (e) {
    return { ok: false, reason: isAbort(e) ? 'timeout' : 'error' };
  }
}
