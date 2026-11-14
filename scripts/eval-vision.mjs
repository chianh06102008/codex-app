// Reproducible vision evaluation (PRD §12, T03).
// 1. Start the server with a real key:  npm run vision-server
// 2. Run:  node scripts/eval-vision.mjs [server-url]
// Prints a confusion table and every expected-unknown photo that did NOT return unknown.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const DIR = new URL('../fixtures/golden/', import.meta.url).pathname;
const SERVER = (process.argv[2] || 'http://127.0.0.1:8789').replace(/\/$/, '');
const CATS = ['ankle', 'wheel', 'unknown'];

const rows = readFileSync(join(DIR, 'labels.csv'), 'utf8')
  .trim()
  .split('\n')
  .slice(1)
  .map((line) => {
    const [file, expected] = line.split(',');
    return { file, expected };
  });

const health = await fetch(`${SERVER}/health`).then((r) => r.json()).catch(() => null);
if (!health) {
  console.error(`Vision server not reachable at ${SERVER}. Start it with: npm run vision-server`);
  process.exit(1);
}
console.log(`Provider: ${health.provider}${health.provider === 'mock' ? '  (mock: results are meaningless, set GEMINI_API_KEY)' : ''}\n`);

const matrix = Object.fromEntries(CATS.map((e) => [e, Object.fromEntries([...CATS, 'error'].map((p) => [p, 0]))]));
const t03Misses = [];

for (const { file, expected } of rows) {
  const b64 = readFileSync(join(DIR, file)).toString('base64');
  let got = 'error';
  let refs = [];
  try {
    const res = await fetch(`${SERVER}/api/vision`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ image_base64: b64, mime: 'image/jpeg' }),
    });
    if (res.ok) {
      const body = await res.json();
      got = body.category;
      refs = body.reference_objects;
    }
  } catch {
    // counted as error
  }
  matrix[expected][got]++;
  if (expected === 'unknown' && got !== 'unknown') t03Misses.push({ file, got, refs });
  process.stdout.write(`${got === expected ? '✔' : '✖'} ${file}: expected ${expected}, got ${got}\n`);
}

console.log('\nExpected \\ Got | ankle | wheel | unknown | error');
for (const e of CATS) console.log(`${e.padEnd(14)} | ${CATS.map((p) => String(matrix[e][p]).padStart(5)).join(' | ')} | ${matrix[e].error}`);
const unknownTotal = rows.filter((r) => r.expected === 'unknown').length;
console.log(`\nT03 (expected unknown -> unknown): ${matrix.unknown.unknown}/${unknownTotal}`);
for (const m of t03Misses) console.log(`  MISS ${m.file}: got ${m.got}, refs ${JSON.stringify(m.refs)}`);
process.exit(t03Misses.length ? 2 : 0);
