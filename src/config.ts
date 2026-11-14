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
/**
 * Basemap: OpenStreetMap data rendered by CARTO ("Positron", light and calm so the
 * four state colors stand out). No API key, no Google. Free tier for low-volume /
 * non-commercial use with attribution. For production, swap to self-hosted or
 * OpenFreeMap vector tiles with MapLibre (needs a dev build). Safety-critical paths
 * never depend on tiles (PRD §11): routing uses the bundled OSM graph.
 */
export const MAP_TILE_URL = 'https://basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png';
export const MAP_TILE_ATTRIBUTION = '© OpenStreetMap contributors © CARTO';
/** Place search: Photon (komoot), OSM-based geocoder, no key. Biased to the pilot slice. */
export const GEOCODER_URL = 'https://photon.komoot.io/api/';
/** Typical urban speeds, used only to tie-break and for an optional secondary duration. */
export const SPEED_KMH: Record<'motorbike' | 'walk' | 'car', number> = { motorbike: 22, walk: 4.5, car: 18 };

// Rain context (Open-Meteo model, never a floor). "Heavy" speeds up report decay only.
export const RAIN_HEAVY_MM_PER_H = 7.6; // WMO/AMS heavy-rain rate
export const RAIN_REFRESH_MS = 10 * 60 * 1000;
export const OFFICIAL_REFRESH_MS = 10 * 60 * 1000;
/** Bulletins are national; only those naming the pilot province can set its floor. */
export const PILOT_PROVINCE = 'Đà Nẵng';
