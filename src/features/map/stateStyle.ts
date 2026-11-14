// Colors for the four segment states. Designer: move these into src/theme/ and
// re-export here. Rules (PRD §8, R16): no green anywhere; the calmest state is a
// neutral slate, never a "go" color; uncertain must not look like a quiet road.
import type { SegmentStateKey } from '@/domain/types';
import { COLORS } from '@/theme/tokens';

export type StateStyle = { line: string; bg: string; fg: string; width: number; icon: string };

export const STATE_STYLE: Record<SegmentStateKey, StateStyle> = {
  avoid: { line: '#C62828', bg: '#FDE8E7', fg: '#8E1B1B', width: 7, icon: 'cancel' },
  discouraged: { line: '#E07B00', bg: '#FFF1DC', fg: '#8A4B00', width: 6, icon: 'alert' },
  uncertain: { line: '#6E5BAA', bg: '#EFEBFA', fg: '#45397A', width: 5, icon: 'help-circle-outline' },
  no_adverse_evidence: { line: '#5D7480', bg: '#E9EFF1', fg: '#33454E', width: 3, icon: 'minus-circle-outline' },
};

// Brand colors now come from the shared design tokens (src/theme, Dev 1's shell palette).
// Kept under the old names so existing screens need no change.
export const BRAND = {
  primary: COLORS.ink,
  primarySoft: COLORS.surfaceSoft,
  ink: COLORS.ink,
  inkSoft: COLORS.inkSoft,
  surface: COLORS.surface,
  background: COLORS.background,
  warningBand: COLORS.warningBand,
  warningInk: COLORS.warningInk,
  route: COLORS.ink,
  routeAlt: COLORS.inkSoft,
  outline: COLORS.outline,
};
