import { hasManagedFloodData } from '@/lib/floodscout-runtime'
import { chooseEquivalentRoute } from '@/lib/floodscout-ai'
import { NextResponse } from 'next/server'
import {
  computeReportFreshness,
  getCachedFloodReports,
  getCachedHazardSegments,
} from '@/lib/floodscout-queries'
import type { GeocodePlace, HazardKind, SafeRouteResponse, TravelMode } from '@/types/floodscout'

const DEFAULT_ORIGIN: GeocodePlace = {
  id: 'default-origin',
  label: 'Royal City · 72A Đường Nguyễn Trãi',
  address: '72A Đường Nguyễn Trãi, Phường Thượng Đình, Quận Thanh Xuân, Hà Nội',
  district: 'Quận Thanh Xuân, Hà Nội',
  lon: 105.8148,
  lat: 21.0025,
}

const DEFAULT_DEST: GeocodePlace = {
  id: 'default-biblio',
  label: 'Biblio · 79 Phố Ngụy Như Kon Tum',
  address: '79 Phố Ngụy Như Kon Tum, Phường Nhân Chính, Quận Thanh Xuân, Hà Nội',
  district: 'Quận Thanh Xuân, Hà Nội',
  lon: 105.8042,
  lat: 21.0016,
}

function pointToSegmentMeters(
  p: [number, number],
  a: [number, number],
  b: [number, number],
): number {
  const cosLat = Math.cos((p[1] * Math.PI) / 180)
  const px = p[0] * 111_320 * cosLat
  const py = p[1] * 110_540
  const ax = a[0] * 111_320 * cosLat
  const ay = a[1] * 110_540
  const bx = b[0] * 111_320 * cosLat
  const by = b[1] * 110_540

  const vx = bx - ax
  const vy = by - ay
  const lenSq = vx * vx + vy * vy
  if (lenSq === 0) return Math.hypot(px - ax, py - ay)
  const t = Math.max(0, Math.min(1, ((px - ax) * vx + (py - ay) * vy) / lenSq))
  return Math.hypot(px - (ax + t * vx), py - (ay + t * vy))
}

function routeIntersectsPolyline(
  routeCoords: Array<[number, number]>,
  hazardCoords: Array<[number, number]>,
  thresholdMeters = 26,
): boolean {
  if (routeCoords.length === 0 || hazardCoords.length === 0) return false
  const cross = (a: [number, number], b: [number, number], c: [number, number]) =>
    (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0])
  for (let i = 0; i < Math.max(1, routeCoords.length - 1); i++) {
    const a = routeCoords[i]
    const b = routeCoords[i + 1] ?? a
    for (let j = 0; j < Math.max(1, hazardCoords.length - 1); j++) {
      const c = hazardCoords[j]
      const d = hazardCoords[j + 1] ?? c
      if (cross(a, b, c) * cross(a, b, d) < 0 && cross(c, d, a) * cross(c, d, b) < 0) return true
      if (pointToSegmentMeters(a, c, d) <= thresholdMeters || pointToSegmentMeters(b, c, d) <= thresholdMeters
        || pointToSegmentMeters(c, a, b) <= thresholdMeters || pointToSegmentMeters(d, a, b) <= thresholdMeters) return true
    }
  }
  return false
}

async function geocodeTextIfNeeded(text: string, fallback: GeocodePlace): Promise<GeocodePlace> {
  const clean = text.trim()
  if (!clean) {
    return fallback
  }
  if (clean.toLowerCase() === 'biblio') {
    return DEFAULT_DEST
  }

  try {
    const url = `https://nominatim.openstreetmap.org/search?format=jsonv2&q=${encodeURIComponent(
      clean,
    )}&countrycodes=vn&limit=1&addressdetails=1&accept-language=vi`
    const r = await fetch(url, {
      headers: { 'User-Agent': 'FloodScoutVN/2.0 (safe-routing)' },
      signal: AbortSignal.timeout(4500),
    })
    if (r.ok) {
      const arr = await r.json()
      const first = Array.isArray(arr) ? arr[0] : null
      if (first) {
        const addr = first.address ?? {}
        return {
          id: `geo-${first.place_id}`,
          label: String(first.name || addr.road || clean),
          address: String(first.display_name || clean),
          district: String(addr.city_district || addr.city || 'Việt Nam'),
          lon: Number(first.lon),
          lat: Number(first.lat),
        }
      }
    }
  } catch {
    // Fallback
  }
  throw new Error('Address could not be resolved')
}

interface RouteCandidate {
  coordinates: Array<[number, number]>
  distanceKm: number
  durationMin: number
  streetSummary: string
}

async function fetchRoutes(
  waypoints: Array<[number, number]>,
  mode: TravelMode,
  alternatives = false,
  lang = 'vi',
  exclusions: Array<[number, number]> = [],
): Promise<RouteCandidate[]> {
  try {
    const costing = { car: 'auto', bicycle: 'bicycle', walk: 'pedestrian', motorbike: 'motor_scooter' }[mode]
    const base = process.env.APP_ROUTING_BASE_URL || 'https://valhalla1.openstreetmap.de'
    const options = {
      locations: waypoints.map(([lon, lat]) => ({ lon, lat })),
      costing,
      alternates: alternatives ? 2 : 0,
      exclude_locations: exclusions.map(([lon, lat]) => ({ lon, lat })),
      format: 'osrm',
      shape_format: 'geojson',
      units: 'kilometers',
      language: lang === 'vi' ? 'vi-VN' : 'en-US',
    }
    const url = new URL('route', base.replace(/\/?$/, '/'))
    url.searchParams.set('json', JSON.stringify(options))
    const response = await fetch(url, { signal: AbortSignal.timeout(6500) })
    if (!response.ok) return []
    const data = await response.json()
    const routes: unknown[] = Array.isArray(data.routes) ? data.routes : []
    return routes.flatMap((entry) => {
      if (!entry || typeof entry !== 'object') return []
      const route = entry as {
        distance: number
        duration: number
        geometry?: { coordinates?: Array<[number, number]> }
        legs?: Array<{ steps?: Array<{ name?: string }> }>
      }
      const coordinates = route.geometry?.coordinates
      if (!Number.isFinite(route.distance) || !Number.isFinite(route.duration)
        || !Array.isArray(coordinates) || coordinates.length < 2
        || !coordinates.every((point) => Array.isArray(point) && point.length === 2 && point.every(Number.isFinite))) return []
      const streets = (route.legs ?? []).flatMap((leg) => (leg.steps ?? []).map((step) => step.name).filter(Boolean))
      return [{
        coordinates,
        distanceKm: route.distance / 1000,
        durationMin: Math.max(1, Math.round(route.duration / 60)),
        streetSummary: [...new Set(streets)].slice(0, 5).join(' · '),
      }]
    })
  } catch {
    return []
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const mode: TravelMode = body?.mode === 'walk' || body?.mode === 'car' || body?.mode === 'bicycle' ? body.mode : 'motorbike'

    const lang = body?.lang === 'en' ? 'en' : 'vi'
    const origin: GeocodePlace =
      body?.originPlace && typeof body.originPlace.lon === 'number'
        ? body.originPlace
        : await geocodeTextIfNeeded(String(body?.originText || ''), DEFAULT_ORIGIN)

    const destination: GeocodePlace =
      body?.destinationPlace && typeof body.destinationPlace.lon === 'number'
        ? body.destinationPlace
        : await geocodeTextIfNeeded(String(body?.destinationText || 'Biblio'), DEFAULT_DEST)

    const [segments, rawReports, rainRaw] = await Promise.all([
      getCachedHazardSegments(),
      getCachedFloodReports(),
      fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${destination.lat}&longitude=${destination.lon}&hourly=precipitation&forecast_days=1&timezone=Asia%2FBangkok`,
        { signal: AbortSignal.timeout(4000) },
      )
        .then((r) => (r.ok ? r.json() : null))
        .catch(() => null),
    ])

    const rainPeak = Math.max(
      0,
      ...((rainRaw?.hourly?.precipitation as number[] | undefined)?.slice(0, 12) ?? []),
    )

    const activeReports = rawReports
      .map((r) => ({ ...r, ...computeReportFreshness(r.createdAt, rainPeak >= 5) }))
      .filter((r) => r.moderationStatus !== 'expired')

    interface HazardZone {
      id: string
      name: string
      address: string
      hazardType: HazardKind
      severity: 'avoid' | 'caution'
      coords: Array<[number, number]>
      reasonVi: string
      reasonEn: string
    }

    const hazardZones: HazardZone[] = segments
      .filter((s) => s.riskStatus === 'avoid' || s.riskStatus === 'caution')
      .map((s) => ({
        id: s.id,
        name: s.name,
        address: s.address,
        hazardType: s.hazardType,
        severity: s.riskStatus === 'avoid' ? 'avoid' : 'caution',
        coords: s.coordinates,
        reasonVi:
          s.hazardType === 'landslide'
            ? `${s.name}: cảnh báo sạt lở đất (${s.address}).`
            : s.hazardType === 'flash-flood'
              ? `${s.name}: cảnh báo ngập nhanh / lũ quét (${s.address}).`
              : `${s.name}: ghi nhận ngập mức ${
                  s.waterDepth === 'wheel' ? 'ngang bánh xe' : 'ngang mắt cá'
                }.`,
        reasonEn:
          s.hazardType === 'landslide'
            ? `${s.name}: landslide alert (${s.address}).`
            : s.hazardType === 'flash-flood'
              ? `${s.name}: flash-flood / underpass flood alert (${s.address}).`
              : `${s.name}: reported ${
                  s.waterDepth === 'wheel' ? 'wheel-deep' : 'ankle-deep'
                } flooding.`,
      }))

    for (const rep of activeReports) {
      if (rep.snappedGeometry.length >= 2) {
        const alreadyCovered = hazardZones.some((hz) => hz.id === rep.segmentId)
        if (!alreadyCovered) {
          hazardZones.push({
            id: rep.id,
            name: rep.segmentName,
            address: rep.address,
            hazardType: 'urban-flood',
            severity: rep.depthCategory === 'wheel' ? 'avoid' : 'caution',
            coords: rep.snappedGeometry,
            reasonVi: `${rep.segmentName}: báo cáo ngập ${
              rep.depthCategory === 'wheel' ? 'ngang bánh xe' : 'ngang mắt cá'
            }, ${rep.ageMinutes} phút trước.`,
            reasonEn: `${rep.segmentName}: ${rep.depthCategory}-deep flood report, ${rep.ageMinutes} min ago.`,
          })
        }
      }
    }

    const startPt: [number, number] = [origin.lon, origin.lat]
    const endPt: [number, number] = [destination.lon, destination.lat]

    const destDirectlyInFlood = hazardZones.filter(
      (hz) => hz.severity === 'avoid' && routeIntersectsPolyline([endPt], hz.coords, 28),
    )
    if (destDirectlyInFlood.length > 0) {
      const blockedResp: SafeRouteResponse = {
        status: 'route-blocked',
        origin,
        destination,
        mode,
        safeRoute: null,
        avoidedDirectRoute: null,
        avoidedHazards: [],
        blockingHazards: destDirectlyInFlood.map((h) => ({
          id: h.id,
          name: h.name,
          address: h.address,
          hazardType: h.hazardType,
          reasonVi: h.reasonVi,
          reasonEn: h.reasonEn,
        })),
        newestReportAgeMinutes: activeReports[0]?.ageMinutes ?? 20,
      }
      return NextResponse.json(blockedResp)
    }

    const directCandidates = await fetchRoutes([startPt, endPt], mode, true, lang)

    const exclusions = hazardZones
      .filter((hazard) => hazard.severity === 'avoid' && hazard.coords.length > 0
        && directCandidates.some((candidate) => routeIntersectsPolyline(candidate.coordinates, hazard.coords)))
      .flatMap((hazard) => [hazard.coords[0], hazard.coords[Math.floor(hazard.coords.length / 2)], hazard.coords[hazard.coords.length - 1]])
      .slice(0, 40)
    const detours = exclusions.length ? await fetchRoutes([startPt, endPt], mode, true, lang, exclusions) : []
    const allCandidates = [...directCandidates, ...detours]
    if (!allCandidates.length) return NextResponse.json({ error: 'No routes available from provider' }, { status: 502 })

    const evaluated = allCandidates.map((cand) => {
      const hitAvoid = hazardZones.filter(
        (hz) => hz.severity === 'avoid' && routeIntersectsPolyline(cand.coordinates, hz.coords, 26),
      )
      const hitCaution = hazardZones.filter(
        (hz) =>
          hz.severity === 'caution' && routeIntersectsPolyline(cand.coordinates, hz.coords, 26),
      )
      const riskPenalty =
        hitAvoid.length * 1000 + hitCaution.length * 65 + cand.distanceKm * 4 + rainPeak * 1.5
      const safetyScore = Math.max(
        5,
        Math.round(100 - hitAvoid.length * 60 - hitCaution.length * 15 - Math.min(12, rainPeak)),
      )
      return {
        cand,
        hitAvoid,
        hitCaution,
        riskPenalty,
        safetyScore,
      }
    })

    evaluated.sort((a, b) => a.riskPenalty - b.riskPenalty)

    const viable = evaluated.filter((route) => route.hitAvoid.length === 0)
      .sort((a, b) => a.hitCaution.length - b.hitCaution.length || a.cand.distanceKm - b.cand.distanceKm || a.cand.durationMin - b.cand.durationMin)
    const first = viable[0]
    const equivalent = first ? viable.filter((route) => route.hitCaution.length === first.hitCaution.length
      && route.cand.distanceKm === first.cand.distanceKm) : []
    const choice = await chooseEquivalentRoute(equivalent.map(({ cand }) => ({
      distanceKm: cand.distanceKm, durationMin: cand.durationMin,
    })), lang)
    const best = equivalent[choice] ?? first
    const directFirst = directCandidates[0]
    const directHits = directFirst
      ? hazardZones.filter((hz) => routeIntersectsPolyline(directFirst.coordinates, hz.coords, 26))
      : []

    if (!best) {
      const blocking = evaluated[0]?.hitAvoid ?? []
      const blockedResp: SafeRouteResponse = {
        status: 'route-blocked',
        origin,
        destination,
        mode,
        safeRoute: null,
        avoidedDirectRoute: directFirst
          ? { coordinates: directFirst.coordinates, distanceKm: directFirst.distanceKm }
          : null,
        avoidedHazards: [],
        blockingHazards: blocking.map((h) => ({
          id: h.id,
          name: h.name,
          address: h.address,
          hazardType: h.hazardType,
          reasonVi: h.reasonVi,
          reasonEn: h.reasonEn,
        })),
        newestReportAgeMinutes: activeReports[0]?.ageMinutes ?? 20,
      }
      return NextResponse.json(blockedResp)
    }

    const avoidedList = directFirst !== best.cand ? directHits : []

    const okResp: SafeRouteResponse = {
      status: 'route-found',
      roadHazardCoverage: hasManagedFloodData(),
      origin,
      destination,
      mode,
      safeRoute: {
        coordinates: best.cand.coordinates,
        distanceKm: best.cand.distanceKm,
        durationMin: best.cand.durationMin,
        streetSummary: best.cand.streetSummary,
        safetyScore: best.safetyScore,
      },
      avoidedDirectRoute:
        directFirst && directHits.length > 0 && directFirst !== best.cand
          ? {
              coordinates: directFirst.coordinates,
              distanceKm: directFirst.distanceKm,
            }
          : null,
      avoidedHazards: avoidedList.map((h) => ({
        id: h.id,
        name: h.name,
        address: h.address,
        hazardType: h.hazardType,
        reasonVi: h.reasonVi,
        reasonEn: h.reasonEn,
      })),
      blockingHazards: [],
      newestReportAgeMinutes: activeReports[0]?.ageMinutes ?? 20,
    }

    return NextResponse.json(okResp)
  } catch (err) {
    return NextResponse.json(
      { error: (err as Error).message || 'Safe route computation failed' },
      { status: 500 },
    )
  }
}
