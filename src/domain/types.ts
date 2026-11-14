// Domain model from PRD §9. Names may change; fields may not silently disappear.
// Shared file: change it in a small PR and tell the team (TEAM.md §1).

export type LatLon = { latitude: number; longitude: number };

export type TravelMode = 'motorbike' | 'walk' | 'car';

// ---------- Official statements (Dev 2 fills these) ----------

export type HazardType = 'heavy_rain' | 'flood' | 'flash_flood' | 'landslide' | 'storm' | 'other';

export type OfficialStatement = {
  id: string;
  source_url: string;
  retrieved_at: string; // ISO
  issuer: string;
  hazard_type: HazardType;
  area_names: string[];
  geometry: LatLon[] | null; // polygon ring; null if only names were parsed
  valid_from: string | null;
  valid_until: string | null;
  instruction_text: string;
  instruction_text_vi: string | null;
  instruction_text_en: string | null;
  severity: string; // as published; never downgraded
  do_not_travel: boolean;
  pinned_by: string | null;
  parse_status: 'ok' | 'partial' | 'failed';
};

export type OfficialFeedStatus = 'ok' | 'last_known' | 'unavailable';

// ---------- Road graph ----------

export type Segment = {
  id: string; // `${osm_way_id}:${part}`
  osm_way_id: number;
  geometry: LatLon[];
  name: string | null;
  highway: string;
  length_m: number;
  oneway: boolean;
  from_node: number;
  to_node: number;
  admin_ids: string[];
  dem_sample_m: number | null;
};

// ---------- Crowd reports (Dev 4) ----------

export type DepthCategory = 'ankle' | 'wheel' | 'unknown';

export type ReportStatus = 'draft' | 'queued' | 'published' | 'retracted' | 'expired';

export type Report = {
  id: string;
  created_at: string;
  server_received_at: string | null;
  segment_id: string;
  lat: number; // confirmed snap, not a raw track
  lon: number;
  accuracy_m: number | null;
  model_category: DepthCategory | null;
  model_confidence: number | null;
  model_reference_objects: string[];
  human_category: DepthCategory; // fusion uses this one
  water_visible: boolean;
  obstruction: 'none' | 'debris' | 'landslide';
  vehicle_context: 'foot' | 'motorbike' | 'car' | null;
  no_water: boolean;
  reporter_trust: 'low' | 'normal';
  perceptual_hash: string | null;
  status: ReportStatus;
  retracted_at: string | null;
  photo_uri?: string | null; // local, redacted image only
  sample?: boolean; // seeded demo data, always labeled in the UI
  shared?: boolean; // made on another phone, received from the report server
};

// ---------- Derived state (Dev 3) ----------

export type SegmentStateKey = 'avoid' | 'discouraged' | 'uncertain' | 'no_adverse_evidence';

export type Floor = 'none' | 'warning' | 'do_not_travel';

export type StateReason =
  | { kind: 'official_do_not_travel'; statement_id: string; at: string }
  | { kind: 'official_hazard'; statement_id: string; at: string; hazard: HazardType }
  | { kind: 'official_warning'; statement_id: string; at: string }
  | { kind: 'feed_unavailable'; at: string }
  | { kind: 'report_wheel'; report_id: string; at: string; weight: number }
  | { kind: 'report_unknown_water'; report_id: string; at: string; weight: number }
  | { kind: 'report_ankle'; report_id: string; at: string; weight: number }
  | { kind: 'report_obstruction'; report_id: string; at: string; weight: number }
  | { kind: 'report_expired'; report_id: string; at: string }
  | { kind: 'no_water_retired_penalty'; report_ids: string[]; at: string };

export type SegmentState = {
  segment_id: string;
  state: SegmentStateKey;
  floor: Floor;
  floor_statement_id: string | null;
  reasons: StateReason[];
  computed_at: string;
};

// ---------- Routing result ----------

export type ExplanationFact =
  | { kind: 'avoided_segments'; count: number }
  | { kind: 'discouraged_share'; share: number; limit: number }
  | { kind: 'fresh_depth_on_route'; segment_id: string; category: DepthCategory }
  | { kind: 'no_path' }
  | { kind: 'endpoint_on_flagged_road'; segment_id: string; end: 'origin' | 'destination' }
  | { kind: 'official_floor'; statement_id: string; do_not_travel: boolean }
  | { kind: 'feed_unavailable' };

export type RouteOption = {
  geometry: LatLon[];
  segments: string[];
  state_counts: Record<SegmentStateKey, number>;
  explanation_facts: ExplanationFact[];
  length_m: number;
  duration_s: number | null;
};

export type RouteResult = {
  kind: 'route' | 'refusal';
  statements: OfficialStatement[];
  options: RouteOption[]; // 0, 1, or 2. Always 0 on refusal: no fallback polyline.
  refusal_facts: ExplanationFact[];
  unmapped_caveat: true;
};
