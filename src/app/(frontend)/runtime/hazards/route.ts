import { fetchOfficialBulletin, readLocation } from '@/lib/floodscout-official'
import { NextResponse } from 'next/server'
import {
  computeReportFreshness,
  getCachedFloodReports,
  getCachedHazardSegments,
} from '@/lib/floodscout-queries'
import type {
  ExternalHazardPoint,
  GdacsAlertItem,
  LiveHazardSnapshot,
  RainViewerRadarFrame,
  RiskStatus,
  RiverDischargeSummary,
  WeatherForecastSummary,
} from '@/types/floodscout'

function computeExperimentalRisk(
  peak12hMm: number,
  total24hMm: number,
  maxProb: number,
): WeatherForecastSummary['experimentalRiskLevel'] {
  if (peak12hMm >= 18 || total24hMm >= 60) return 'high'
  if (peak12hMm >= 7 || total24hMm >= 28 || maxProb >= 80) return 'elevated'
  if (peak12hMm >= 2 || total24hMm >= 8 || maxProb >= 45) return 'watch'
  return 'low'
}

async function fetchJsonSafe(url: string, timeoutMs = 6000): Promise<any | null> {
  try {
    const res = await fetch(url, {
      signal: AbortSignal.timeout(timeoutMs),
      headers: { 'User-Agent': 'FloodScoutVN/2.0' },
      next: { revalidate: 120 },
    })
    if (!res.ok) return null
    return await res.json()
  } catch {
    return null
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const includeOptional = searchParams.get('optional') !== '0'

  const location = readLocation(searchParams)
  const now = new Date()
  const from = new Date(now.getTime() - 21 * 86_400_000)
  const toDate = now.toISOString().slice(0, 10)
  const fromDate = from.toISOString().slice(0, 10)

  const [
    segments,
    rawReports,
    urbanWeatherRaw,
    socSonWeatherRaw,
    hoaBinhWeatherRaw,
    floodRaw,
    gdacsRaw,
    rainRaw,
    eonetRaw,
    usgsRaw,
  ] = await Promise.all([
    getCachedHazardSegments(),
    getCachedFloodReports(),
    location
      ? fetchJsonSafe(
          `https://api.open-meteo.com/v1/forecast?latitude=${location.lat}&longitude=${location.lon}&current=rain&hourly=precipitation,precipitation_probability&forecast_days=3&timezone=Asia%2FBangkok`,
        )
      : Promise.resolve(null),
    fetchJsonSafe(
      'https://api.open-meteo.com/v1/forecast?latitude=21.275&longitude=105.825&hourly=precipitation&forecast_days=2&timezone=Asia%2FBangkok',
    ),
    fetchJsonSafe(
      'https://api.open-meteo.com/v1/forecast?latitude=20.790&longitude=105.312&hourly=precipitation&forecast_days=2&timezone=Asia%2FBangkok',
    ),
    fetchJsonSafe(
      'https://flood-api.open-meteo.com/v1/flood?latitude=21.0278&longitude=105.8342&daily=river_discharge&forecast_days=7',
    ),
    fetchJsonSafe(
      `https://www.gdacs.org/gdacsapi/api/events/geteventlist/SEARCH?eventlist=FL;TC&fromdate=${fromDate}&todate=${toDate}`,
    ),
    fetchJsonSafe('https://api.rainviewer.com/public/weather-maps.json'),
    includeOptional
      ? fetchJsonSafe('https://eonet.gsfc.nasa.gov/api/v3/events?status=open&limit=25')
      : Promise.resolve(null),
    includeOptional
      ? fetchJsonSafe('https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_day.geojson')
      : Promise.resolve(null),
  ])

  const times: string[] = urbanWeatherRaw?.hourly?.time ?? []
  const precip: number[] = urbanWeatherRaw?.hourly?.precipitation ?? []
  const probs: number[] = urbanWeatherRaw?.hourly?.precipitation_probability ?? []
  const nowHourPrefix = new Date(now.getTime() + 7 * 3_600_000).toISOString().slice(0, 13)
  const startIdx = times.findIndex((t) => t.startsWith(nowHourPrefix))
  const hourlySlice = startIdx < 0 ? [] : times.slice(startIdx, startIdx + 12).flatMap((time, offset) => {
    const index = startIdx + offset
    return Number.isFinite(precip[index]) && Number.isFinite(probs[index])
      ? [{ time: time.slice(11, 16), precipMm: precip[index], prob: probs[index] }]
      : []
  })
  const totalNext24hMm = startIdx < 0 ? 0 : Number(
    precip.slice(startIdx, startIdx + 24).reduce((sum, amount) => sum + (amount ?? 0), 0).toFixed(1),
  )

  const socSonPeak = Math.max(
    0,
    ...((socSonWeatherRaw?.hourly?.precipitation as number[] | undefined)?.slice(0, 24) ?? [0]),
  )
  const hoaBinhPeak = Math.max(
    0,
    ...((hoaBinhWeatherRaw?.hourly?.precipitation as number[] | undefined)?.slice(0, 24) ?? [0]),
  )

  const peakNext12hMm = Math.max(0, ...hourlySlice.map((h) => h.precipMm))
  const maxProbNext12h = Math.max(0, ...hourlySlice.map((h) => h.prob))
  const weather: WeatherForecastSummary = {
    currentPrecipMm: urbanWeatherRaw?.current?.rain ?? 0,
    peakNext12hMm,
    maxProbNext12h,
    totalNext24hMm,
    socSonPrecipMm: Number(socSonPeak.toFixed(1)),
    hoaBinhPrecipMm: Number(hoaBinhPeak.toFixed(1)),
    hourlySlice,
    experimentalRiskLevel: computeExperimentalRisk(peakNext12hMm, totalNext24hMm, maxProbNext12h),
  }

  const floodDates: string[] = floodRaw?.daily?.time ?? []
  const floodVals: Array<number | null> = floodRaw?.daily?.river_discharge ?? []
  const dailyDischarge = floodDates.map((d, idx) => ({
    date: d.slice(5),
    dischargeM3s: Number(Number(floodVals[idx] ?? 0).toFixed(1)),
  }))
  const flood: RiverDischargeSummary =
    dailyDischarge.length > 0
      ? {
          latestM3s: dailyDischarge[0].dischargeM3s,
          peak7dM3s: Math.max(...dailyDischarge.map((d) => d.dischargeM3s)),
          daily: dailyDischarge,
        }
      : {
          latestM3s: 0,
          peak7dM3s: 0,
          daily: [],
        }

  const gdacsAlerts: GdacsAlertItem[] = (Array.isArray(gdacsRaw?.features) ? gdacsRaw.features : [])
    .map((f: any) => {
      const coords = f?.geometry?.coordinates
      if (!Array.isArray(coords) || coords.length < 2) return null
      const props = f?.properties ?? {}
      return {
        id: String(props.eventid ?? props.glide ?? `${coords[0]}-${coords[1]}`),
        eventType: String(props.eventtype || 'FL'),
        name: String(props.name || props.eventname || 'GDACS Alert'),
        alertLevel: String(props.alertlevel || 'Orange'),
        country: String(props.country || 'Khu vực lân cận'),
        fromDate: String(props.fromdate || '').slice(0, 10),
        coordinates: [Number(coords[0]), Number(coords[1])] as [number, number],
        url: typeof props?.url?.report === 'string' ? props.url.report : undefined,
      }
    })
    .filter(Boolean)
    .sort(
      (a: GdacsAlertItem, b: GdacsAlertItem) =>
        Math.hypot(a.coordinates[0] - 105.8, a.coordinates[1] - 21.0) -
        Math.hypot(b.coordinates[0] - 105.8, b.coordinates[1] - 21.0),
    )
    .slice(0, 20)

  const host = rainRaw?.host || 'https://tilecache.rainviewer.com'
  const radarFrames: RainViewerRadarFrame[] = (
    Array.isArray(rainRaw?.radar?.past) ? rainRaw.radar.past : []
  )
    .slice(-6)
    .map((fr: any) => ({
      time: Number(fr.time),
      path: String(fr.path),
      tileUrlTemplate: `${host}${fr.path}/256/{z}/{x}/{y}/2/1_1.png`,
    }))

  const eonetEvents: ExternalHazardPoint[] = (
    Array.isArray(eonetRaw?.events) ? eonetRaw.events : []
  )
    .map((ev: any) => {
      const geom = Array.isArray(ev?.geometry) ? ev.geometry[ev.geometry.length - 1] : null
      const coords = geom?.coordinates
      if (!Array.isArray(coords) || typeof coords[0] !== 'number') return null
      const cat = String(ev?.categories?.[0]?.title || 'Natural Hazard')
      return {
        id: String(ev.id),
        source: 'EONET' as const,
        title: String(ev.title || 'NASA EONET'),
        subtitle: `${cat} · ${String(geom?.date || '').slice(0, 10)}`,
        coordinates: [Number(coords[0]), Number(coords[1])] as [number, number],
        magnitudeOrCategory: cat,
      }
    })
    .filter(Boolean)
    .slice(0, 25)

  const usgsQuakes: ExternalHazardPoint[] = (
    Array.isArray(usgsRaw?.features) ? usgsRaw.features : []
  )
    .map((f: any) => {
      const coords = f?.geometry?.coordinates
      const mag = Number(f?.properties?.mag ?? 0)
      if (!Array.isArray(coords) || mag < 2.5) return null
      return {
        id: String(f.id),
        source: 'USGS' as const,
        title: String(f?.properties?.place || 'USGS Earthquake'),
        subtitle: `M${mag.toFixed(1)} · USGS`,
        coordinates: [Number(coords[0]), Number(coords[1])] as [number, number],
        magnitudeOrCategory: `M${mag.toFixed(1)}`,
      }
    })
    .filter(Boolean)
    .sort(
      (a: ExternalHazardPoint, b: ExternalHazardPoint) =>
        Math.hypot(a.coordinates[0] - 105.8, a.coordinates[1] - 20.5) -
        Math.hypot(b.coordinates[0] - 105.8, b.coordinates[1] - 20.5),
    )
    .slice(0, 20)

  const heavyRainActive = weather.peakNext12hMm >= 5 || weather.totalNext24hMm >= 20
  const reports = rawReports.map((r) => {
    const fresh = computeReportFreshness(r.createdAt, heavyRainActive)
    return { ...r, ...fresh }
  })

  const enrichedSegments = segments.map((seg) => {
    let liveRain = weather.peakNext12hMm
    if (seg.district.includes('Sóc Sơn')) liveRain = weather.socSonPrecipMm
    if (seg.district.includes('Hòa Bình')) liveRain = weather.hoaBinhPrecipMm

    const matchingActiveWheelReport = reports.some(
      (r) =>
        r.moderationStatus !== 'expired' &&
        r.depthCategory === 'wheel' &&
        (r.segmentId === seg.id || r.segmentName === seg.name),
    )

    let effectiveRiskStatus: RiskStatus = seg.riskStatus
    if (matchingActiveWheelReport || (seg.hazardType === 'flash-flood' && liveRain >= 10)) {
      effectiveRiskStatus = 'avoid'
    }

    return {
      ...seg,
      liveRainMm: liveRain,
      effectiveRiskStatus,
    }
  })

  const rain = urbanWeatherRaw?.current?.rain
  const official = location && typeof rain === 'number' && rain > 0
    ? await fetchOfficialBulletin(location, now)
    : { bulletin: null, status: location && typeof rain === 'number' ? 'dry' : 'unavailable' } as const

  const snapshot: LiveHazardSnapshot = {
    fetchedAt: now.toISOString(),
    isLive: Boolean(urbanWeatherRaw || floodRaw || rainRaw || gdacsRaw),
    weather,
    flood,
    gdacsAlerts,
    radarFrames,
    eonetEvents,
    usgsQuakes,
    segments: enrichedSegments,
    reports,
    bulletin: official.bulletin,
    officialStatus: official.status,
  }

  return NextResponse.json(snapshot)
}
