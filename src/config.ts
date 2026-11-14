// PRD §21 config constants. Starting values; tune only toward stricter unless a
// written safety review says otherwise. No magic numbers in components.

export const SPEED_GATE_KMH = 15;
export const GPS_CONFIRM_ABOVE_M = 50;
export const REPORT_HARD_ZERO_HOURS = 12;
export const DECAY_HALFLIFE_RAIN_MIN = 45;
export const DECAY_HALFLIFE_QUIET_MIN = 180;
export const MAX_ROUTE_OPTIONS = 2;
export const MOTOBIKE_ANKLE_SEGMENTS_ALLOWED = 0;
export const PHOTO_MAX_BYTES = 500_000;

// Added by Dev 3/4 (not in §21, documented here so it is not magic):
/** A report counts as "fresh" for refusal while its decayed weight is at least this. */
export const FRESH_WEIGHT_MIN = 0.25;
/** §11.4: refuse when discouraged length exceeds this share of the trip. Start strict. */
export const DISCOURAGED_SHARE_MAX = 0.1;
/** Routing cost multipliers. There is no value below 1: no "safe" bonus exists. */
export const PENALTY_DISCOURAGED = 8;
export const PENALTY_UNCERTAIN = 3;
/** Second option must differ from the first by at least this share of its segments. */
export const ALT_ROUTE_MIN_DIFFERENCE = 0.3;
/** Vision request timeout before the client offers only `unknown`. */
export const VISION_TIMEOUT_MS = 12_000;
/** Snap a tap or GPS fix to a road only within this distance. */
export const SNAP_MAX_M = 120;
/** Typical urban speeds, used only to tie-break and for an optional secondary duration. */
export const SPEED_KMH: Record<'motorbike' | 'walk' | 'car', number> = { motorbike: 22, walk: 4.5, car: 18 };
