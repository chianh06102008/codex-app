// Colors for the four segment states. Designer: move these into src/theme/ and
// re-export here. Rules (PRD §8, R16): no green anywhere; the calmest state is a
// neutral slate, never a "go" color; uncertain must not look like a quiet road.
import type { SegmentStateKey } from '@/domain/types';

export type StateStyle = { line: string; bg: string; fg: string; width: number; icon: string };

export const STATE_STYLE: Record<SegmentStateKey, StateStyle> = {
  avoid: { line: '#C62828', bg: '#FDE8E7', fg: '#8E1B1B', width: 7, icon: 'cancel' },
  discouraged: { line: '#E07B00', bg: '#FFF1DC', fg: '#8A4B00', width: 6, icon: 'alert' },
  uncertain: { line: '#6E5BAA', bg: '#EFEBFA', fg: '#45397A', width: 5, icon: 'help-circle-outline' },
  no_adverse_evidence: { line: '#5D7480', bg: '#E9EFF1', fg: '#33454E', width: 3, icon: 'minus-circle-outline' },
};

export const BRAND = {
  primary: '#16465C',
  primarySoft: '#CEE8F0',
  ink: '#152B36',
  inkSoft: '#405863',
  surface: '#FFFFFF',
  background: '#F3F6F6',
  warningBand: '#FFEDCE',
  warningInk: '#5C3B00',
  route: '#16465C',
  routeAlt: '#4F8FA8',
  outline: '#D5DFE1',
};
