// FloodScout vision server (PRD §12). POST /api/vision {image_base64, mime}
// -> { category: 'ankle'|'wheel'|'unknown', confidence, reference_objects[], provider, mock }
//
// Provider is picked from .env: GEMINI_API_KEY, else OPENAI_API_KEY, else mock.
// Force one with VISION_PROVIDER=gemini|openai|mock. Model ids are configurable
// (GEMINI_MODEL / OPENAI_MODEL) because providers rename models often.
//
// Contract enforcement happens HERE, whatever the model says:
//   - only the three categories; no centimeters or any other field (P4)
//   - no usable reference object -> unknown (T03)
// Keys never leave this process. Do not log images.
import http from 'node:http';
import { createHash } from 'node:crypto';

const port = Number(process.env.VISION_PORT || 8788);
const host = process.env.VISION_SERVER_HOST || '127.0.0.1';
const provider =
  process.env.VISION_PROVIDER ||
  (process.env.GEMINI_API_KEY ? 'gemini' : process.env.OPENAI_API_KEY ? 'openai' : 'mock');
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
const OPENAI_MODEL = process.env.OPENAI_MODEL || 'gpt-4.1-mini';
const TIMEOUT_MS = 10_000;
const MAX_BODY = 2_000_000;

const CATEGORIES = ['ankle', 'wheel', 'unknown'];

// Prompt from Gemini task G1 (server/vision.prompt.md): stricter reference objects,
// explicit abstentions, borderline ankle/wheel -> wheel.
const PROMPT = `You classify one outdoor street photo from Vietnam for a flood-risk reporting tool.
Return JSON only, matching the schema with exactly these fields:
- "category": one of "ankle", "wheel", or "unknown".
- "confidence": number between 0 and 1.
- "reference_objects": array of short strings naming only physical objects of known height that are visibly in direct contact with the standing water surface and used to judge depth.

Classification rules:
1. "wheel": standing floodwater reaches half a motorbike wheel (the wheel hub/axle or exhaust pipe) or higher against a visible reference object in the water (e.g. "motorbike wheel", "car tyre", "car bumper", "pedestrian shin"). If depth is borderline between "ankle" and "wheel", choose "wheel".
2. "ankle": standing floodwater is clearly visible and reaches roughly ankle height (below half a motorbike wheel) against a visible reference object in direct contact with the water (e.g. "curb", "motorbike tire bottom", "ankle", "sandal", "door sill", "step").
3. "unknown": required in ALL of the following cases:
   - No standing water is visible on the ground (dry road, damp asphalt sheen only, sky, or wall close-up).
   - Standing water is visible, but no physical reference object of known scale touches the waterline (e.g. open water surface, water reflections, canal overflow, overhead rooftop view).
   - Nighttime or dark frames where the waterline intersection against a reference object cannot be verified with certainty.
   - Motion-blurred, out-of-focus, or rain-smeared frames where reference object edges are indistinct.
   - Screenshots of a phone screen (status bar, navigation bar, chat bubbles, browser UI, or social media overlays), even if a flood photo is visible inside the screenshot.
   - Indoor rooms or interior floors.
   - Frames dominated by a person's face or selfie portrait.

Strict contract invariants (P4, T03):
- Whenever "category" is "unknown", "reference_objects" MUST be [] (an empty array). Do NOT list objects that are visible in a dry street, indoor room, or screenshot if the category is "unknown".
- Never list generic scene elements ("water", "street", "road", "sky", "rain", "building", "wall", "roof", "reflection", "glare") in "reference_objects".
- Never output any measurement in centimeters, millimeters, meters, or inches.
- Only classify depth category; never output travel advice or road-status claims.`;

const SCHEMA = {
  type: 'object',
  properties: {
    category: { type: 'string', enum: CATEGORIES },
    confidence: { type: 'number' },
    reference_objects: { type: 'array', items: { type: 'string' } },
  },
  required: ['category', 'confidence', 'reference_objects'],
  additionalProperties: false,
};

/** Keep only the contract fields. Anything else is dropped; a bad category becomes unknown. */
function enforce(raw, meta) {
  const refs = Array.isArray(raw?.reference_objects)
    ? raw.reference_objects.filter((x) => typeof x === 'string' && x.length < 60).slice(0, 8)
    : [];
  // Generic scene words are not depth references (G1 finding: "roof"/"wall" slipped through).
  const GENERIC = /^(water|street|road|sky|rain|building|wall|roof|reflection|glare)s?$/i;
  const usable = refs.filter((r) => !GENERIC.test(r.trim()));
  let category = CATEGORIES.includes(raw?.category) ? raw.category : 'unknown';
  if (usable.length === 0) category = 'unknown';
  const c = Number(raw?.confidence);
  return {
    category,
    confidence: Number.isFinite(c) ? Math.max(0, Math.min(1, c)) : null,
    // unknown always carries no references, so nothing downstream reads a depth into it.
    reference_objects: category === 'unknown' ? [] : usable,
    ...meta,
  };
}

async function viaGemini(b64, mime) {
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(GEMINI_MODEL)}:generateContent`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': process.env.GEMINI_API_KEY },
      body: JSON.stringify({
        contents: [{ parts: [{ text: PROMPT }, { inline_data: { mime_type: mime, data: b64 } }] }],
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
      signal: AbortSignal.timeout(TIMEOUT_MS),
    },
  );
  if (!res.ok) throw new Error('Gemini ' + res.status);
  const data = await res.json();
  const text = data?.candidates?.[0]?.content?.parts?.map((p) => p.text || '').join('') || '{}';
  return JSON.parse(text);
}

async function viaOpenAI(b64, mime) {
  const res = await fetch('https://api.openai.com/v1/responses', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + process.env.OPENAI_API_KEY },
    body: JSON.stringify({
      model: OPENAI_MODEL,
      input: [
        {
          role: 'user',
          content: [
            { type: 'input_text', text: PROMPT },
            { type: 'input_image', image_url: `data:${mime};base64,${b64}` },
          ],
        },
      ],
      text: { format: { type: 'json_schema', name: 'flood_photo', schema: SCHEMA, strict: true } },
    }),
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  if (!res.ok) throw new Error('OpenAI ' + res.status);
  const data = await res.json();
  const text =
    data.output_text ||
    (data.output || []).flatMap((o) => o.content || []).find((c) => c.type === 'output_text')?.text ||
    '{}';
  return JSON.parse(text);
}

/** Demo only: deterministic fake proposal from the image hash. Always flagged mock:true. */
function viaMock(b64) {
  const h = createHash('sha256').update(b64).digest()[0];
  const category = CATEGORIES[h % 3];
  return { category, confidence: 0.5, reference_objects: category === 'unknown' ? [] : ['curb'] };
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let size = 0;
    const chunks = [];
    req.on('data', (c) => {
      size += c.length;
      if (size > MAX_BODY) { reject(new Error('too large')); req.destroy(); return; }
      chunks.push(c);
    });
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    req.on('error', reject);
  });
}

http
  .createServer(async (req, res) => {
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    const url = new URL(req.url || '/', 'http://localhost');
    if (req.method === 'GET' && url.pathname === '/health') {
      res.writeHead(200).end(JSON.stringify({ ok: true, provider }));
      return;
    }
    if (req.method !== 'POST' || url.pathname !== '/api/vision') {
      res.writeHead(404).end(JSON.stringify({ error: 'Not found' }));
      return;
    }
    let body;
    try {
      body = JSON.parse(await readBody(req));
    } catch {
      res.writeHead(400).end(JSON.stringify({ error: 'Invalid body' }));
      return;
    }
    const b64 = typeof body?.image_base64 === 'string' ? body.image_base64 : '';
    const mime = body?.mime === 'image/png' ? 'image/png' : 'image/jpeg';
    if (b64.length < 100) {
      res.writeHead(400).end(JSON.stringify({ error: 'Missing image' }));
      return;
    }
    try {
      const raw = provider === 'gemini' ? await viaGemini(b64, mime) : provider === 'openai' ? await viaOpenAI(b64, mime) : viaMock(b64);
      res.writeHead(200).end(JSON.stringify(enforce(raw, { provider, mock: provider === 'mock' })));
    } catch (error) {
      // Timeout or provider failure: the app then offers only `unknown`.
      console.error('Vision failed:', error.message);
      res.writeHead(503).end(JSON.stringify({ error: 'Vision unavailable' }));
    }
  })
  .listen(port, host, () => console.log(`Vision server (${provider}) on http://${host}:${port}`));
