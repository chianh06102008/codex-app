import { unstable_cache } from 'next/cache'
import { getPayloadClient } from './payload'
import { hasManagedFloodData } from './floodscout-runtime'
import type {
  DepthCategory,
  FloodReportDTO,
  HazardKind,
  HazardSegmentDTO,
  RiskStatus,
} from '@/types/floodscout'

function parseCoords(raw: unknown): Array<[number, number]> {
  if (!Array.isArray(raw)) return []
  const out: Array<[number, number]> = []
  for (const item of raw) {
    if (
      Array.isArray(item) &&
      item.length >= 2 &&
      typeof item[0] === 'number' &&
      typeof item[1] === 'number'
    ) {
      out.push([item[0], item[1]])
    }
  }
  return out
}

export function computeReportFreshness(
  createdAtIso: string,
  heavyRain = true,
): {
  moderationStatus: 'active' | 'decaying' | 'expired'
  ageMinutes: number
  weightFactor: number
} {
  const createdMs = new Date(createdAtIso).getTime()
  const ageMinutes = Math.max(
    1,
    Math.round((Date.now() - (Number.isNaN(createdMs) ? Date.now() : createdMs)) / 60_000),
  )
  // Reports expire after 12 hours (720 min); half-life ~45 min during heavy rain
  if (ageMinutes >= 720) {
    return { moderationStatus: 'expired', ageMinutes, weightFactor: 0 }
  }
  const halfLife = heavyRain ? 45 : 120
  const weightFactor = Number(Math.pow(0.5, ageMinutes / halfLife).toFixed(2))
  return {
    moderationStatus: ageMinutes >= 50 ? 'decaying' : 'active',
    ageMinutes,
    weightFactor,
  }
}

export const getCachedHazardSegments = unstable_cache(
  async (): Promise<HazardSegmentDTO[]> => {
    if (!hasManagedFloodData()) return []
    const payload = await getPayloadClient()
    const res = await payload.find({
      collection: 'hazard-segments',
      overrideAccess: false,
      limit: 50,
      sort: 'createdAt',
    })

    return (res.docs ?? []).map((doc: any) => ({
      id: String(doc.id),
      name: String(doc.name || ''),
      slug: String(doc.slug || ''),
      address: String(doc.address || ''),
      district: String(doc.district || ''),
      hazardType: (doc.hazardType || 'urban-flood') as HazardKind,
      riskStatus: (doc.riskStatus || 'avoid') as RiskStatus,
      waterDepth: (doc.waterDepth || 'wheel') as DepthCategory | 'none',
      freshness: (doc.freshness || 'fresh') as 'fresh' | 'ageing' | 'official',
      centerLon: Number(doc.centerLon ?? 105.805),
      centerLat: Number(doc.centerLat ?? 20.998),
      coordinates: parseCoords(doc.coordinatesJson),
      officialSourceNote: doc.officialSourceNote ? String(doc.officialSourceNote) : undefined,
      updatedAt: doc.updatedAt ? String(doc.updatedAt) : undefined,
    }))
  },
  ['floodscout-hazard-segments-v1'],
  { tags: ['hazard-segments'], revalidate: 3600 },
)

export const getCachedFloodReports = unstable_cache(
  async (): Promise<FloodReportDTO[]> => {
    if (!hasManagedFloodData()) return []
    const payload = await getPayloadClient()
    const res = await payload.find({
      collection: 'flood-reports',
      overrideAccess: false,
      depth: 1,
      limit: 50,
      sort: '-createdAt',
    })

    return (res.docs ?? []).map((doc: any) => {
      const createdIso = String(doc.createdAt || new Date().toISOString())
      const fresh = computeReportFreshness(createdIso, true)
      const photoObj = doc.photo && typeof doc.photo === 'object' ? doc.photo : null
      const segObj = doc.segment && typeof doc.segment === 'object' ? doc.segment : null

      return {
        id: String(doc.id),
        title: String(doc.title || doc.segmentName || 'Báo cáo ngập'),
        segmentId: segObj ? String(segObj.id) : doc.segment ? String(doc.segment) : null,
        segmentName: String(doc.segmentName || segObj?.name || ''),
        address: String(doc.address || segObj?.address || ''),
        longitude: Number(doc.longitude ?? 105.8079),
        latitude: Number(doc.latitude ?? 20.995),
        snappedGeometry: parseCoords(doc.snappedGeometry),
        depthCategory: (doc.depthCategory || 'wheel') as DepthCategory,
        aiProposedCategory: (doc.aiProposedCategory || null) as DepthCategory | null,
        aiConfidence: typeof doc.aiConfidence === 'number' ? doc.aiConfidence : null,
        aiSummary: doc.aiSummary ? String(doc.aiSummary) : null,
        aiProvider: doc.aiProvider ? String(doc.aiProvider) : null,
        transcript: doc.transcript ? String(doc.transcript) : null,
        photoUrl: photoObj?.url ? String(photoObj.url) : null,
        photoAlt: photoObj?.alt ? String(photoObj.alt) : null,
        moderationStatus: fresh.moderationStatus,
        ageMinutes: fresh.ageMinutes,
        weightFactor: fresh.weightFactor,
        createdAt: createdIso,
      }
    })
  },
  ['floodscout-flood-reports-v1'],
  { tags: ['flood-reports'], revalidate: 3600 },
)

/** Snaps a point [lon, lat] onto ~170m of the actual nearest OpenStreetMap road centerline */
export async function snapPointToOsmStreetPolyline(
  lon: number,
  lat: number,
): Promise<{ coordinates: Array<[number, number]>; streetName?: string }> {
  try {
    // Trace along the road via a short NE-SW offset using OSRM foot routing
    const aLon = Number((lon - 0.0008).toFixed(6))
    const aLat = Number((lat - 0.00055).toFixed(6))
    const bLon = Number((lon + 0.0008).toFixed(6))
    const bLat = Number((lat + 0.00055).toFixed(6))
    const url = `https://router.project-osrm.org/route/v1/foot/${aLon},${aLat};${lon},${lat};${bLon},${bLat}?overview=full&geometries=geojson&steps=true`
    const r = await fetch(url, { signal: AbortSignal.timeout(4500) })
    if (r.ok) {
      const j = await r.json()
      const route = j?.routes?.[0]
      const coords = route?.geometry?.coordinates
      const streetName = route?.legs
        ?.flatMap((l: any) => l.steps || [])
        ?.map((s: any) => s.name)
        ?.find((n: string) => Boolean(n && n.trim()))
      if (Array.isArray(coords) && coords.length >= 2) {
        return {
          coordinates: coords.map((pt: number[]) => [
            Number(pt[0].toFixed(6)),
            Number(pt[1].toFixed(6)),
          ]),
          streetName,
        }
      }
    }
  } catch {
    // Fallback short segment
  }
  return {
    coordinates: [
      [Number((lon - 0.0006).toFixed(6)), Number((lat - 0.0004).toFixed(6))],
      [Number(lon.toFixed(6)), Number(lat.toFixed(6))],
      [Number((lon + 0.0006).toFixed(6)), Number((lat + 0.0004).toFixed(6))],
    ],
  }
}
