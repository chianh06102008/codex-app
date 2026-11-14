// T02 copy lint (PRD §18). Covers every user-visible string file; add new ones to SOURCES.
import { COPY } from './mapReport';
import { STRINGS } from './strings';
import { LIVE } from './live';

// Allowed negations, removed before scanning.
const ALLOWED = [/không phải xác nhận an toàn/gi, /không nên đi/gi, /not a clearance/gi, /not an all-clear/gi];

const FORBIDDEN_EN = [/\bsafe\b/i, /\bclear\b/i, /\bpassable\b/i, /\bok to cross\b/i, /\ball clear\b/i, /\bsafe route\b/i, /\bfaster through\b/i];
const FORBIDDEN_VI = [/nên đi/i, /đi được/i, /an toàn/i, /đường an toàn/i, /hết ngập/i];

function allStrings(obj: Record<string, unknown>): string[] {
  return Object.values(obj).flatMap((v) => {
    if (typeof v === 'string') return [v];
    if (Array.isArray(v)) return v.filter((x): x is string => typeof x === 'string');
    if (typeof v === 'function') {
      // Template functions: render with sample values.
      const out = (v as (...a: unknown[]) => unknown)(5, 10);
      return typeof out === 'string' ? [out] : [];
    }
    return [];
  });
}

const SOURCES = { mapReport: COPY, strings: STRINGS, live: LIVE };

describe('T02 forbidden copy', () => {
  for (const [name, copy] of Object.entries(SOURCES)) {
    for (const lang of ['vi', 'en'] as const) {
      test(`${name}.${lang} has no forbidden strings`, () => {
        for (const s of allStrings(copy[lang] as unknown as Record<string, unknown>)) {
          const cleaned = ALLOWED.reduce((acc, re) => acc.replace(re, ''), s);
          for (const re of [...FORBIDDEN_EN, ...FORBIDDEN_VI]) {
            expect({ string: s, match: re.test(cleaned) ? String(re) : null }).toEqual({ string: s, match: null });
          }
        }
      });
    }
  }

  test('the bare claim fails and the negation passes', () => {
    const scan = (s: string) => [...FORBIDDEN_EN, ...FORBIDDEN_VI].some((re) => re.test(ALLOWED.reduce((a, r) => a.replace(r, ''), s)));
    expect(scan('Đường này an toàn')).toBe(true);
    expect(scan('Đây không phải xác nhận an toàn.')).toBe(false);
    expect(scan('Safe route')).toBe(true);
  });
});
