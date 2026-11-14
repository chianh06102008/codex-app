// Feeds Dev 2's NCHMF bulletins into the official store (PRD P2, P10).
// 1. At start: the bulletin pinned in fixtures/ is shown as "last known", with its time and link.
//    It is never promoted to "ok": an old file is not a live feed.
// 2. If EXPO_PUBLIC_BULLETIN_SERVER_URL is set (npm run bulletin-server on the laptop), the
//    last 24 h of NCHMF bulletins are fetched; success makes the feed "ok".
// A failed fetch keeps "last known" — it never becomes an all-clear.
import type { OfficialStatement } from '@/domain/types';
import { setOfficialSource } from '@/features/fusion/officialSource';
import { timeoutSignal } from '@/lib/timeout';
import pinned from '../../../fixtures/statements/2026-11-13_lqsl-984.json';

const PINNED = pinned as unknown as OfficialStatement[];

export function loadPinnedBulletin() {
  const retrievedAt = PINNED.map((s) => s.retrieved_at).sort().at(-1) ?? null;
  setOfficialSource({ feedStatus: 'last_known', statements: PINNED, retrievedAt, simulated: false });
}

export async function refreshOfficial(): Promise<boolean> {
  const base = process.env.EXPO_PUBLIC_BULLETIN_SERVER_URL;
  if (!base) return false;
  try {
    const res = await fetch(`${base.replace(/\/$/, '')}/api/official/recent?hours=24`, { signal: timeoutSignal(20000) });
    if (!res.ok) return false;
    const body = (await res.json()) as { retrieved_at?: string; statements?: OfficialStatement[] };
    if (!Array.isArray(body.statements)) return false;
    // Parse failures come back without an issuer; keep only bulletins that were actually read.
    const statements = body.statements.filter((s) => s && s.id && s.issuer);
    // If any bulletin could not be read, the picture is incomplete: say "last known", not "ok".
    const complete = statements.length === body.statements.length;
    setOfficialSource({
      feedStatus: complete ? 'ok' : 'last_known',
      statements,
      retrievedAt: body.retrieved_at ?? new Date().toISOString(),
      simulated: false,
    });
    return true;
  } catch {
    return false;
  }
}
