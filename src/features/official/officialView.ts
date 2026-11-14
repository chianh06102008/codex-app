// Turns the official source into what the status band (S1) and the Warning screen (S2) show.
// Pure functions, no UI, so the rules can be unit-tested.
//
// Rules (PRD P2, P10):
// - Feed unreachable -> 'degraded'. Never 'calm': an empty map is not an all-clear.
// - A statement counts as in force with the same test fusion uses for the floor, so the
//   band can never say "calm" while routing still applies a warning.
// - A statement with no end time is treated as still in force.
import type { OfficialStatement } from '@/domain/types';
import type { OfficialSource } from '@/features/fusion/officialSource';

export type OfficialTone = 'warning' | 'degraded' | 'calm';

export type OfficialView = {
  tone: OfficialTone;
  /** In force now, strictest first (do-not-travel before others, then newest). */
  inForce: OfficialStatement[];
  /** Past their stated validity. Shown on S2 as history, never as a current warning. */
  expired: OfficialStatement[];
  simulated: boolean;
};

export function isInForce(statement: OfficialStatement, now: Date): boolean {
  if (statement.valid_from && new Date(statement.valid_from) > now) return false;
  if (statement.valid_until && new Date(statement.valid_until) < now) return false;
  return true;
}

export function summarizeOfficial(
  source: Pick<OfficialSource, 'feedStatus' | 'statements' | 'simulated'>,
  now: Date = new Date(),
): OfficialView {
  const inForce = source.statements
    .filter((s) => isInForce(s, now))
    .sort(
      (a, b) =>
        Number(b.do_not_travel) - Number(a.do_not_travel) ||
        (b.valid_from ?? '').localeCompare(a.valid_from ?? ''),
    );
  const expired = source.statements.filter((s) => !isInForce(s, now));

  let tone: OfficialTone;
  if (inForce.length > 0) tone = 'warning'; // a known warning outranks a feed problem
  else if (source.feedStatus === 'ok') tone = 'calm';
  else tone = 'degraded'; // 'unavailable', and 'last_known' with nothing in force

  return { tone, inForce, expired, simulated: source.simulated };
}

/** First line of the bulletin text, which NCHMF uses as the bulletin's title. */
export function statementTitle(statement: OfficialStatement): string | null {
  const first = (statement.instruction_text ?? '').split('\n')[0]?.trim();
  return first ? first : null;
}
