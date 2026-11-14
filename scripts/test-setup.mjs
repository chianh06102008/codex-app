// Runs the pure-logic *.test.ts files with Node's built-in test runner (Node 22.18+
// strips TypeScript types natively), so tests work without downloading Jest.
// The tests use Jest-style describe/test/expect, so they also run unchanged under
// jest-expo once Dev 1 adds it.
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { registerHooks } from 'node:module';
import { describe, test } from 'node:test';
import { fileURLToPath, pathToFileURL } from 'node:url';

// ---------- resolve "@/..." and extensionless .ts imports; load .json as a module ----------
const SRC = new URL('../src/', import.meta.url);
const EXTS = ['.ts', '.tsx', '/index.ts', '/index.tsx'];

function withExt(url) {
  const path = fileURLToPath(url);
  if (existsSync(path) && /\.[a-z]+$/i.test(path)) return url;
  for (const ext of EXTS) if (existsSync(path + ext)) return pathToFileURL(path + ext).href;
  return null;
}

registerHooks({
  resolve(specifier, context, next) {
    if (specifier.startsWith('@/')) {
      const hit = withExt(new URL(specifier.slice(2), SRC).href);
      if (hit) return { url: hit, shortCircuit: true };
    }
    if ((specifier.startsWith('./') || specifier.startsWith('../')) && context.parentURL?.startsWith('file:')) {
      const hit = withExt(new URL(specifier, context.parentURL).href);
      if (hit) return { url: hit, shortCircuit: true };
    }
    return next(specifier, context);
  },
  load(url, context, next) {
    // Metro imports JSON without attributes; mirror that for tests.
    if (url.startsWith('file:') && url.endsWith('.json')) {
      return { format: 'module', source: `export default ${readFileSync(fileURLToPath(url), 'utf8')};`, shortCircuit: true };
    }
    return next(url, context);
  },
});

// ---------- minimal Jest-style expect ----------
const close = (a, e, digits = 2) => Math.abs(a - e) < Math.pow(10, -digits) / 2;

function matchers(actual, negate = false) {
  const check = (ok, msg) => assert.ok(negate ? !ok : ok, msg);
  return {
    toBe: (e) => (negate ? assert.notStrictEqual(actual, e) : assert.strictEqual(actual, e)),
    toEqual: (e) => (negate ? assert.notDeepStrictEqual(actual, e) : assert.deepStrictEqual(actual, e)),
    toBeCloseTo: (e, d) => check(close(actual, e, d), `${actual} ≈ ${e}`),
    toContain: (e) => check(actual.includes(e), `${JSON.stringify(actual)} contains ${JSON.stringify(e)}`),
    toHaveLength: (n) => check(actual.length === n, `length ${actual.length} = ${n}`),
    toBeNull: () => check(actual === null, `${actual} is null`),
    toBeLessThanOrEqual: (n) => check(actual <= n, `${actual} <= ${n}`),
    toBeGreaterThan: (n) => check(actual > n, `${actual} > ${n}`),
  };
}

globalThis.describe = describe;
globalThis.test = test;
globalThis.it = test;
globalThis.expect = (actual) => ({ ...matchers(actual), not: matchers(actual, true) });
