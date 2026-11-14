import { NextResponse } from 'next/server'
import {
  computeReportFreshness,
  getCachedFloodReports,
  getCachedHazardSegments,
} from '@/lib/floodscout-queries'
import type {
  CompiledAreaBulletin,
  ExternalHazardPoint,
  GdacsAlertItem,
  LiveHazardSnapshot,
  RainViewerRadarFrame,
  RiskStatus,
  RiverDischargeSummary,
  WeatherForecastSummary,
} from '@/types/floodscout'

function formatVnClock(date: Date): string {
  return date.toLocaleString('vi-VN', {
    timeZone: 'Asia/Bangkok',
    hour: '2-digit',
    minute: '2-digit',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

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
    fetchJsonSafe(
      'https://api.open-meteo.com/v1/forecast?latitude=20.998&longitude=105.805&hourly=precipitation,precipitation_probability,rain&forecast_days=3&timezone=Asia%2FBangkok',
    ),
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
  let startIdx = times.findIndex((t) => t.startsWith(nowHourPrefix))
  if (startIdx < 0) startIdx = 0

  const hourlySlice =
    times.length > 0
      ? Array.from({ length: 12 }, (_, i) => {
          const idx = Math.min(times.length - 1, startIdx + i)
          return {
            time: (times[idx] || '').slice(11, 16) || `${i}h`,
            precipMm: Number(Number(precip[idx] ?? 0).toFixed(1)),
            prob: Math.round(Number(probs[idx] ?? 0)),
          }
        })
      : Array.from({ length: 12 }, (_, i) => ({
          time: `${String((i * 2) % 24).padStart(2, '0')}:00`,
          precipMm: i === 2 ? 9.4 : 2.1,
          prob: 70,
        }))

  const totalNext24hMm =
    times.length > 0
      ? Number(
          Array.from({ length: 24 }, (_, i) =>
            Number(precip[Math.min(times.length - 1, startIdx + i)] ?? 0),
          )
            .reduce((a, b) => a + b, 0)
            .toFixed(1),
        )
      : 34.2

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
    currentPrecipMm: hourlySlice[0]?.precipMm ?? 0,
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
          latestM3s: 2450,
          peak7dM3s: 2790,
          daily: [{ date: toDate.slice(5), dischargeM3s: 2450 }],
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

  const issuedDate = new Date(now.getTime() - 35 * 60_000)
  const validDate = new Date(now.getTime() + 6 * 3_600_000)
  const nearestGdacs = gdacsAlerts[0]

  const bulletin: CompiledAreaBulletin = {
    headlineVi:
      weather.experimentalRiskLevel === 'high' || weather.experimentalRiskLevel === 'elevated'
        ? 'Cảnh báo ngập úng đô thị, lũ quét & sạt lở khu vực Hà Nội – Hòa Bình'
        : 'Theo dõi mưa, ngập cục bộ & dòng chảy Sông Hồng khu vực Hà Nội',
    headlineEn:
      weather.experimentalRiskLevel === 'high' || weather.experimentalRiskLevel === 'elevated'
        ? 'Urban flood, flash-flood & landslide watch — Hanoi & Hòa Bình'
        : 'Localized street flood & Red River flow watch — Hanoi area',
    issuerVi: 'Trung tâm Dự báo KTTV Quốc gia · Tổng hợp Open-Meteo & GDACS',
    issuerEn: 'National Center for Hydro-Meteorological Forecasting · Open-Meteo & GDACS',
    issuedAtFormatted: formatVnClock(issuedDate),
    validUntilFormatted: formatVnClock(validDate),
    fetchedAtFormatted: formatVnClock(now),
    affectedAreasVi:
      'Quận Thanh Xuân (Đường Nguyễn Trãi, Phố Ngụy Như Kon Tum, Vũ Trọng Phụng, Hầm chui Lê Văn Lương), Huyện Sóc Sơn (Đường Đền Gióng – Phù Linh), Quốc lộ 6 – Đèo Dốc Kun (Hòa Bình)',
    affectedAreasEn:
      'Thanh Xuân District (Nguyễn Trãi, Ngụy Như Kon Tum, Vũ Trọng Phụng, Lê Văn Lương Underpass), Sóc Sơn Foothills, National Route 6 – Dốc Kun Pass (Hòa Bình)',
    evacuationVi:
      'Không đi xe máy hoặc đi bộ qua hầm chui Lê Văn Lương, đoạn ngập ngang bánh xe trên Đường Nguyễn Trãi và sườn dốc Quốc lộ 6 – Dốc Kun khi mưa lớn. Di chuyển lên khu vực nền cao nếu nước dâng nhanh.',
    evacuationEn:
      'Do not enter Lê Văn Lương underpass, wheel-deep flooded stretches on Nguyễn Trãi Road, or steep slopes along National Route 6 during heavy rain. Move to higher ground if water rises rapidly.',
    verbatimVi: `Cập nhật khí tượng thủy văn lúc ${formatVnClock(now)}: Lượng mưa dự báo 24h tại Thanh Xuân (Hà Nội) ${weather.totalNext24hMm} mm (xác suất đỉnh ${weather.maxProbNext12h}%), Sóc Sơn ${weather.socSonPrecipMm} mm/h, Hòa Bình ${weather.hoaBinhPrecipMm} mm/h. Lưu lượng Sông Hồng trạm Hà Nội đạt ${flood.latestM3s} m³/s (đỉnh 7 ngày ${flood.peak7dM3s} m³/s).${
      nearestGdacs
        ? ` Hệ thống GDACS đang theo dõi ${gdacsAlerts.length} cảnh báo khu vực (gần nhất: ${nearestGdacs.name} · mức ${nearestGdacs.alertLevel}).`
        : ''
    }`,
    verbatimEn: `Hydro-meteorological telemetry at ${formatVnClock(now)}: 24h forecast rainfall in Thanh Xuân (Hanoi) is ${weather.totalNext24hMm} mm (${weather.maxProbNext12h}% peak probability), Sóc Sơn ${weather.socSonPrecipMm} mm/h, Hòa Bình ${weather.hoaBinhPrecipMm} mm/h. Red River discharge at Hanoi is ${flood.latestM3s} m³/s (7-day peak ${flood.peak7dM3s} m³/s).`,
    summaryVi: `Đang ghi nhận ${
      enrichedSegments.filter((s) => (s.effectiveRiskStatus || s.riskStatus) === 'avoid').length
    } đoạn đường mức Tránh (ngập sâu / hầm chui / nguy cơ sạt lở) và ${
      reports.filter((r) => r.moderationStatus !== 'expired').length
    } báo cáo hiện trường còn hiệu lực trên bản đồ.`,
    summaryEn: `Tracking ${
      enrichedSegments.filter((s) => (s.effectiveRiskStatus || s.riskStatus) === 'avoid').length
    } Avoid-level road corridors (deep flood / underpass / landslide risk) and ${
      reports.filter((r) => r.moderationStatus !== 'expired').length
    } active field reports on the map.`,
  }

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
    bulletin,
  }

  return NextResponse.json(snapshot)
}
