export type ScreenId =
  | 'home'
  | 'warning'
  | 'ask'
  | 'route-found'
  | 'route-blocked'
  | 'segment'
  | 'report'
  | 'settings'
  | 'speed-gate'

export type Language = 'vi' | 'en'
export type TextSize = 'default' | 'large' | 'xlarge'
export type TravelMode = 'motorbike' | 'bicycle' | 'walk' | 'car'
export type DepthCategory = 'ankle' | 'wheel' | 'unsure'
export type HazardKind = 'urban-flood' | 'flash-flood' | 'landslide' | 'river-overflow'
export type RiskStatus = 'avoid' | 'caution' | 'unknown' | 'normal'
export type MapCameraPreset = 'pilot' | 'red-river' | 'soc-son' | 'hoa-binh' | 'vietnam'

export interface EnabledDisasterSources {
  openMeteoWeather: boolean
  openMeteoFlood: boolean
  gdacs: boolean
  rainViewer: boolean
  nasaEonet: boolean
  usgsQuakes: boolean
}

export interface HazardSegmentDTO {
  id: string
  name: string
  slug: string
  address: string
  district: string
  hazardType: HazardKind
  riskStatus: RiskStatus
  effectiveRiskStatus?: RiskStatus
  waterDepth: DepthCategory | 'none'
  freshness: 'fresh' | 'ageing' | 'official'
  centerLon: number
  centerLat: number
  coordinates: Array<[number, number]>
  officialSourceNote?: string
  liveRainMm?: number
  updatedAt?: string
}

export interface FloodReportDTO {
  id: string
  title: string
  segmentId?: string | null
  segmentName: string
  address: string
  longitude: number
  latitude: number
  snappedGeometry: Array<[number, number]>
  depthCategory: DepthCategory
  aiProposedCategory?: DepthCategory | null
  aiConfidence?: number | null
  aiSummary?: string | null
  aiProvider?: string | null
  transcript?: string | null
  photoUrl?: string | null
  photoAlt?: string | null
  moderationStatus: 'active' | 'decaying' | 'expired'
  ageMinutes: number
  weightFactor: number
  createdAt: string
  isOwn?: boolean
}

export interface WeatherForecastSummary {
  currentPrecipMm: number
  peakNext12hMm: number
  maxProbNext12h: number
  totalNext24hMm: number
  socSonPrecipMm: number
  hoaBinhPrecipMm: number
  hourlySlice: Array<{
    time: string
    precipMm: number
    prob: number
  }>
  experimentalRiskLevel: 'low' | 'watch' | 'elevated' | 'high'
}

export interface RiverDischargeSummary {
  latestM3s: number
  peak7dM3s: number
  daily: Array<{
    date: string
    dischargeM3s: number
  }>
}

export interface GdacsAlertItem {
  id: string
  eventType: string
  name: string
  alertLevel: string
  country: string
  fromDate: string
  coordinates: [number, number]
  url?: string
}

export interface RainViewerRadarFrame {
  time: number
  path: string
  tileUrlTemplate: string
}

export interface ExternalHazardPoint {
  id: string
  source: 'EONET' | 'USGS'
  title: string
  subtitle: string
  coordinates: [number, number]
  magnitudeOrCategory: string
}

export interface CompiledAreaBulletin {
  sourceUrl: string
  headlineVi: string
  headlineEn: string
  issuerVi: string
  issuerEn: string
  issuedAtFormatted: string
  validUntilFormatted: string
  fetchedAtFormatted: string
  affectedAreasVi: string
  affectedAreasEn: string
  evacuationVi: string
  evacuationEn: string
  verbatimVi: string
  verbatimEn: string
  summaryVi: string
  summaryEn: string
}

export interface LiveHazardSnapshot {
  fetchedAt: string
  isLive: boolean
  weather: WeatherForecastSummary
  flood: RiverDischargeSummary
  gdacsAlerts: GdacsAlertItem[]
  radarFrames: RainViewerRadarFrame[]
  eonetEvents: ExternalHazardPoint[]
  usgsQuakes: ExternalHazardPoint[]
  segments: HazardSegmentDTO[]
  reports: FloodReportDTO[]
  bulletin: CompiledAreaBulletin | null
  officialStatus: 'active' | 'dry' | 'unmatched' | 'unavailable'
}

export interface GeocodePlace {
  id: string
  label: string
  address: string
  district: string
  lon: number
  lat: number
}

export interface SafeRouteResponse {
  status: 'route-found' | 'route-blocked'
  origin: GeocodePlace
  destination: GeocodePlace
  mode: TravelMode
  safeRoute: {
    coordinates: Array<[number, number]>
    distanceKm: number
    durationMin: number
    streetSummary: string
    safetyScore: number
  } | null
  avoidedDirectRoute: {
    coordinates: Array<[number, number]>
    distanceKm: number
  } | null
  avoidedHazards: Array<{
    id: string
    name: string
    address: string
    hazardType: HazardKind
    reasonVi: string
    reasonEn: string
  }>
  blockingHazards: Array<{
    id: string
    name: string
    address: string
    hazardType: HazardKind
    reasonVi: string
    reasonEn: string
  }>
  newestReportAgeMinutes: number
}

export interface VisionAnalysisResponse {
  depthCategory: DepthCategory
  waterDetected: boolean
  confidence: number
  provider: 'gemini-vision' | 'openai-vision' | 'sharp-cv-fallback'
  modelName: string
  visionKeyConfigured: boolean
  referenceObjects: string[]
  headlineVi: string
  headlineEn: string
  explanationVi: string
  explanationEn: string
  imageDimensions?: { width: number; height: number }
}
