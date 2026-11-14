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

function metersBetween(a: [number, number], b: [number, number]): number {
  const cosLat = Math.cos(((a[1] + b[1]) * 0.5 * Math.PI) / 180)
  const dx = (b[0] - a[0]) * 111_320 * cosLat
  const dy = (b[1] - a[1]) * 110_540
  return Math.hypot(dx, dy)
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
  if (hazardCoords.length === 1) {
    return routeCoords.some((pt) => metersBetween(pt, hazardCoords[0]) <= thresholdMeters)
  }
  for (let i = 0; i < routeCoords.length; i++) {
    const rPt = routeCoords[i]
    for (let j = 0; j < hazardCoords.length - 1; j++) {
      if (pointToSegmentMeters(rPt, hazardCoords[j], hazardCoords[j + 1]) <= thresholdMeters) {
        return true
      }
    }
  }
  return false
}

async function geocodeTextIfNeeded(text: string, fallback: GeocodePlace): Promise<GeocodePlace> {
  const clean = text.trim()
  if (!clean || clean === 'Vị trí hiện tại' || clean === 'Current location') {
    return fallback
  }
  if (clean.toLowerCase().includes('biblio')) {
    return DEFAULT_DEST
  }

  try {
    const url = `https://nominatim.openstreetmap.org/search?format=jsonv2&q=${encodeURIComponent(
      clean.includes('Hà Nội') || clean.includes('Hòa Bình') ? clean : `${clean}, Hà Nội`,
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
  return { ...fallback, label: clean }
}

interface CandidateOsrmRoute {
  coordinates: Array<[number, number]>
  distanceKm: number
  durationMin: number
  streetSummary: string
}

async function fetchOsrmRoutes(
  waypoints: Array<[number, number]>,
  mode: TravelMode,
  alternatives = false,
): Promise<CandidateOsrmRoute[]> {
  try {
    const profile = mode === 'walk' ? 'foot' : 'driving'
    const coordStr = waypoints.map((w) => `${w[0]},${w[1]}`).join(';')
    const url = `https://router.project-osrm.org/route/v1/${profile}/${coordStr}?overview=full&geometries=geojson&steps=true&alternatives=${
      alternatives ? 'true' : 'false'
    }`
    const r = await fetch(url, { signal: AbortSignal.timeout(5500) })
    if (!r.ok) return []
    const j = await r.json()
    return (Array.isArray(j?.routes) ? j.routes : []).map((rt: any) => {
      const steps = (rt.legs ?? []).flatMap((l: any) => l.steps ?? [])
      const uniqueStreets = Array.from(
        new Set(
          steps.map((s: any) => String(s.name || '').trim()).filter((n: string) => n.length > 1),
        ),
      ).slice(0, 4)
      const speedAdjust = mode === 'motorbike' ? 0.85 : 1
      return {
        coordinates: rt.geometry?.coordinates ?? [],
        distanceKm: Number(((rt.distance ?? 1000) / 1000).toFixed(2)),
        durationMin: Math.max(2, Math.round(((rt.duration ?? 180) * speedAdjust) / 60)),
        streetSummary: uniqueStreets.join(' → ') || 'Tuyến đường nội đô',
      }
    })
  } catch {
    return []
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const mode: TravelMode = body?.mode === 'walk' || body?.mode === 'car' ? body.mode : 'motorbike'

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
      ...((rainRaw?.hourly?.precipitation as number[] | undefined)?.slice(0, 12) ?? [2]),
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
    if (destDirectlyInFlood.length > 0 && mode !== 'car') {
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

    const directCandidates = await fetchOsrmRoutes([startPt, endPt], mode, true)

    const midLon = (startPt[0] + endPt[0]) / 2
    const midLat = (startPt[1] + endPt[1]) / 2
    const span = Math.max(
      0.009,
      Math.min(0.032, Math.hypot(endPt[0] - startPt[0], endPt[1] - startPt[1]) * 0.8),
    )

    const detourWaypoints: Array<[number, number]> = [
      [105.8062, 21.0068], // North corridor via Đường Láng / Lê Văn Thiêm / Nhân Chính
      [105.7925, 21.0055], // West-North corridor via Trần Duy Hưng / Hoàng Minh Giám
      [midLon, midLat + span],
      [midLon, midLat - span],
      [midLon - span, midLat + span * 0.7],
      [midLon + span, midLat - span * 0.7],
    ]

    const detourResults = await Promise.all(
      detourWaypoints.map((wp) => fetchOsrmRoutes([startPt, wp, endPt], mode, false)),
    )

    const allCandidates = [...directCandidates, ...detourResults.flat()].filter(
      (c) => c.coordinates.length >= 2,
    )

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

    const best = evaluated[0]
    const directFirst = directCandidates[0]
    const directHits = directFirst
      ? hazardZones.filter((hz) => routeIntersectsPolyline(directFirst.coordinates, hz.coords, 26))
      : []

    if (!best || (best.hitAvoid.length > 0 && mode !== 'car')) {
      const blocking = best?.hitAvoid.length
        ? best.hitAvoid
        : hazardZones.filter((h) => h.severity === 'avoid').slice(0, 2)
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

    const avoidedList =
      directHits.length > 0
        ? directHits
        : hazardZones
            .filter(
              (hz) =>
                hz.severity === 'avoid' &&
                !best.hitAvoid.some((b) => b.id === hz.id) &&
                metersBetween(hz.coords[0], startPt) < 4500,
            )
            .slice(0, 2)

    const okResp: SafeRouteResponse = {
      status: 'route-found',
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
