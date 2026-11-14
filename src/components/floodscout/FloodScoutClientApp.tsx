'use client'

import { useRouter } from 'next/navigation'
import React, { useCallback, useEffect, useRef, useState } from 'react'
import { PersistentWhiteFooter } from '@/components/floodscout/SharedPrimitives'
import { AskScreen } from '@/components/floodscout/screens/AskScreen'
import { HomeScreen } from '@/components/floodscout/screens/HomeScreen'
import { ReportScreen } from '@/components/floodscout/screens/ReportScreen'
import { RouteResultScreen } from '@/components/floodscout/screens/RouteResultScreen'
import { SegmentScreen } from '@/components/floodscout/screens/SegmentScreen'
import { SettingsScreen } from '@/components/floodscout/screens/SettingsScreen'
import { SpeedGateScreen } from '@/components/floodscout/screens/SpeedGateScreen'
import { WarningScreen } from '@/components/floodscout/screens/WarningScreen'
import { useCameraSafeTopInset } from '@/hooks/useGsap'
import type {
  EnabledDisasterSources,
  FloodReportDTO,
  GeocodePlace,
  HazardSegmentDTO,
  Language,
  LiveHazardSnapshot,
  SafeRouteResponse,
  ScreenId,
  TextSize,
  TravelMode,
} from '@/types/floodscout'

const VALID_SCREENS: ScreenId[] = [
  'home',
  'warning',
  'ask',
  'route-found',
  'route-blocked',
  'segment',
  'report',
  'settings',
  'speed-gate',
]

const INITIAL_ORIGIN: GeocodePlace = {
  id: 'origin-royal-city',
  label: 'Royal City · 72A Đường Nguyễn Trãi',
  address: '72A Đường Nguyễn Trãi, Phường Thượng Đình, Quận Thanh Xuân, Hà Nội',
  district: 'Quận Thanh Xuân, Hà Nội',
  lon: 105.8148,
  lat: 21.0025,
}

const INITIAL_DESTINATION: GeocodePlace = {
  id: 'dest-biblio',
  label: 'Biblio · 79 Phố Ngụy Như Kon Tum',
  address: '79 Phố Ngụy Như Kon Tum, Phường Nhân Chính, Quận Thanh Xuân, Hà Nội',
  district: 'Quận Thanh Xuân, Hà Nội',
  lon: 105.8042,
  lat: 21.0016,
}

function parseHashScreen(): { screen: ScreenId; degraded?: boolean } {
  if (typeof window === 'undefined') return { screen: 'home' }
  const raw = window.location.hash.replace(/^#\/?/, '')
  if (raw === 'degraded') return { screen: 'home', degraded: true }
  if ((VALID_SCREENS as string[]).includes(raw)) {
    return { screen: raw as ScreenId }
  }
  return { screen: 'home' }
}

export function FloodScoutClientApp({
  initialSegments,
  initialReports,
}: {
  initialSegments: HazardSegmentDTO[]
  initialReports: FloodReportDTO[]
}) {
  const router = useRouter()
  const topInset = useCameraSafeTopInset()

  const [history, setHistory] = useState<ScreenId[]>(['home'])
  const [lang, setLang] = useState<Language>('vi')
  const [textSize, setTextSize] = useState<TextSize>('default')
  const [dataSaver, setDataSaver] = useState(false)
  const [preciseLocationConsent, setPreciseLocationConsent] = useState(true)
  const [photoConsent, setPhotoConsent] = useState(true)
  const [officialFeedDegraded, setOfficialFeedDegraded] = useState(false)
  const [showCrowdLayer, setShowCrowdLayer] = useState(true)

  const [enabledSources, setEnabledSources] = useState<EnabledDisasterSources>({
    openMeteoWeather: true,
    openMeteoFlood: true,
    gdacs: true,
    rainViewer: true,
    nasaEonet: true,
    usgsQuakes: false,
  })

  const [segments, setSegments] = useState<HazardSegmentDTO[]>(initialSegments)
  const [reports, setReports] = useState<FloodReportDTO[]>(initialReports)
  const [selectedSegment, setSelectedSegment] = useState<HazardSegmentDTO | null>(
    initialSegments[0] ?? null,
  )
  const [hazards, setHazards] = useState<LiveHazardSnapshot | null>(null)
  const [hazardsRefreshVersion, setHazardsRefreshVersion] = useState(0)
  const [hazardsLoading, setHazardsLoading] = useState(false)

  const [originPlace, setOriginPlace] = useState<GeocodePlace>(INITIAL_ORIGIN)
  const [destinationPlace, setDestinationPlace] = useState<GeocodePlace>(INITIAL_DESTINATION)
  const [travelMode, setTravelMode] = useState<TravelMode>('motorbike')
  const [computingRoute, setComputingRoute] = useState(false)
  const [routeResult, setRouteResult] = useState<SafeRouteResponse | null>(null)

  const [deviceToken, setDeviceToken] = useState('fs-anon-session')
  const [ownReportIds, setOwnReportIds] = useState<string[]>([])
  const [toastMessage, setToastMessage] = useState<string | null>(null)

  const currentScreen = history[history.length - 1] ?? 'home'

  // Sync initial hash & per-device anonymous report token
  useEffect(() => {
    const parsed = parseHashScreen()
    if (parsed.degraded) setOfficialFeedDegraded(true)
    if (parsed.screen !== 'home') setHistory(['home', parsed.screen])

    try {
      let tok = window.localStorage.getItem('fs_device_token')
      if (!tok) {
        tok = `fs-${Math.random().toString(36).slice(2)}-${Date.now().toString(36)}`
        window.localStorage.setItem('fs_device_token', tok)
      }
      setDeviceToken(tok)
    } catch {
      // Ignore storage restrictions
    }

    const onHash = () => {
      const p = parseHashScreen()
      if (p.degraded !== undefined) setOfficialFeedDegraded(p.degraded)
      setHistory((prev) => (prev[prev.length - 1] === p.screen ? prev : [...prev, p.screen]))
    }
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [])

  const [warningLocation, setWarningLocation] = useState<{ lat: number; lon: number } | null>(null)
  useEffect(() => {
    if (!preciseLocationConsent || !navigator.geolocation) {
      setWarningLocation(null)
      return
    }
    const watch = navigator.geolocation.watchPosition(({ coords }) => {
      setWarningLocation((previous) => {
        const next = { lat: Number(coords.latitude.toFixed(3)), lon: Number(coords.longitude.toFixed(3)) }
        return previous?.lat === next.lat && previous.lon === next.lon ? previous : next
      })
    }, () => setWarningLocation(null), { maximumAge: 60_000, timeout: 12_000 })
    return () => navigator.geolocation.clearWatch(watch)
  }, [preciseLocationConsent])

  const includeOptional = enabledSources.nasaEonet || enabledSources.usgsQuakes

  const refreshHazards = useCallback(async (signal?: AbortSignal) => {
    if (signal?.aborted) return
    const request = new AbortController()
    const cancel = () => request.abort()
    signal?.addEventListener('abort', cancel, { once: true })
    const timeout = window.setTimeout(cancel, 15_000)
    setHazardsLoading(true)
    try {
      const query = new URLSearchParams({ optional: includeOptional ? '1' : '0' })
      if (preciseLocationConsent && warningLocation) {
        query.set('lat', String(warningLocation.lat))
        query.set('lon', String(warningLocation.lon))
      }
      const res = await fetch(`/runtime/hazards?${query}`, { cache: 'no-store', signal: request.signal })

      if (res.ok) {
        const snap = (await res.json()) as LiveHazardSnapshot
        if (signal?.aborted) return
        setHazards(snap)
        if (snap.segments.length > 0) setSegments(snap.segments)
        if (snap.reports.length > 0) setReports(snap.reports)
      } else if (!signal?.aborted) {
        setHazards(null)
      }
    } catch {
      if (!signal?.aborted) setHazards(null)
    } finally {
      window.clearTimeout(timeout)
      signal?.removeEventListener('abort', cancel)
      if (!signal?.aborted) setHazardsLoading(false)
    }
  }, [includeOptional, preciseLocationConsent, warningLocation])

  useEffect(() => {
    const controller = new AbortController()
    setHazards(null)
    void refreshHazards(controller.signal)
    const timer = window.setInterval(() => void refreshHazards(controller.signal), 120_000)
    return () => {
      controller.abort()
      window.clearInterval(timer)
    }
  }, [refreshHazards, hazardsRefreshVersion])

  useEffect(() => {
    document.title = 'FloodScout VN'
    document.documentElement.lang = lang
  }, [lang])

  useEffect(() => {
    const root = document.documentElement
    if (textSize === 'large') root.style.fontSize = '108%'
    else if (textSize === 'xlarge') root.style.fontSize = '116%'
    else root.style.fontSize = '100%'
  }, [textSize])

  const navigate = (next: ScreenId) => {
    if (next === 'home') setOfficialFeedDegraded(false)
    setHistory((prev) => (prev[prev.length - 1] === next ? prev : [...prev, next]))
    const targetHash = next === 'home' ? '' : `#${next}`
    if (window.location.hash !== targetHash) {
      window.history.pushState(null, '', targetHash || window.location.pathname)
    }
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior })
  }

  const goBack = () => {
    setHistory((prev) => {
      const updated = prev.length > 1 ? prev.slice(0, -1) : (['home'] as ScreenId[])
      const target = updated[updated.length - 1] ?? 'home'
      const targetHash = target === 'home' ? '' : `#${target}`
      window.history.replaceState(null, '', targetHash || window.location.pathname)
      return updated
    })
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior })
  }

  const showToast = (msg: string) => {
    setToastMessage(msg)
    window.setTimeout(() => {
      setToastMessage((cur) => (cur === msg ? null : cur))
    }, 3200)
  }

  const handleComputeSafeRoute = useCallback(
    async (overrideOrigin?: GeocodePlace, overrideDest?: GeocodePlace) => {
      const orig = overrideOrigin || originPlace
      const dest = overrideDest || destinationPlace
      setComputingRoute(true)
      try {
        const payloadBody: Record<string, any> = {
          originText: orig.address || orig.label,
          destinationText: dest.address || dest.label,
          mode: travelMode,
          lang,
        }
        if (!Number.isNaN(orig.lon) && !Number.isNaN(orig.lat)) {
          payloadBody.originPlace = orig
        }
        if (!Number.isNaN(dest.lon) && !Number.isNaN(dest.lat)) {
          payloadBody.destinationPlace = dest
        }

        const res = await fetch('/runtime/safe-route', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payloadBody),
        })
        if (res.ok) {
          const computed = (await res.json()) as SafeRouteResponse
          setRouteResult(computed)
          setOriginPlace(computed.origin)
          setDestinationPlace(computed.destination)
          navigate(computed.status)
        } else {
          showToast(lang === 'vi' ? 'Không thể tính tuyến. Hãy kiểm tra điểm đi và điểm đến.' : 'Could not plan a route. Check the origin and destination.')
        }
      } catch {
        showToast(lang === 'vi' ? 'Không thể kết nối dịch vụ tìm đường.' : 'The route service could not be reached.')
      } finally {
        setComputingRoute(false)
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [originPlace, destinationPlace, travelMode, lang],
  )

  const automaticRouteRequested = useRef(false)

  // If user enters #route-found or #route-blocked directly via URL hash, compute default route automatically
  useEffect(() => {
    if (
      (currentScreen === 'route-found' || currentScreen === 'route-blocked') &&
      !routeResult &&
      !computingRoute &&
      !automaticRouteRequested.current
    ) {
      automaticRouteRequested.current = true
      handleComputeSafeRoute()
    }
  }, [currentScreen, routeResult, computingRoute, handleComputeSafeRoute])

  const handleSelectSegment = (seg: HazardSegmentDTO) => {
    setSelectedSegment(seg)
    navigate('segment')
  }

  const handleReportCreated = (newReport: FloodReportDTO) => {
    setReports((prev) => [newReport, ...prev])
    setOwnReportIds((prev) => [newReport.id, ...prev])
    const matchedSeg = segments.find(
      (s) => s.id === newReport.segmentId || s.name === newReport.segmentName,
    )
    if (matchedSeg) setSelectedSegment(matchedSeg)
    showToast(
      lang === 'vi'
        ? `Đã lưu báo cáo tại ${newReport.segmentName.split('(')[0].trim()}`
        : `Saved flood report for ${newReport.segmentName.split('(')[0].trim()}`,
    )
    router.refresh()
    refreshHazards()
    navigate('segment')
  }

  const handleDeleteOwnReports = async () => {
    const res = await fetch(
      `/runtime/flood-reports?deviceToken=${encodeURIComponent(deviceToken)}`,
      { method: 'DELETE' },
    )
    if (res.ok) {
      setReports((prev) => prev.filter((r) => !ownReportIds.includes(r.id) && !r.isOwn))
      setOwnReportIds([])
      router.refresh()
      refreshHazards()
    }
  }

  return (
    <div className="relative min-h-dvh w-full bg-[#f3f4ef]">
      {currentScreen === 'home' ? (
        <HomeScreen
          lang={lang}
          onToggleLanguage={() => setLang((l) => (l === 'vi' ? 'en' : 'vi'))}
          dataSaver={dataSaver}
          officialFeedDegraded={officialFeedDegraded}
          onChangeOfficialFeedDegraded={setOfficialFeedDegraded}
          showCrowdLayer={showCrowdLayer}
          onChangeShowCrowdLayer={setShowCrowdLayer}
          originPlace={originPlace}
          destinationPlace={destinationPlace}
          segments={segments}
          reports={reports}
          hazards={hazards}
          hazardsLoading={hazardsLoading}
          enabledSources={enabledSources}
          onChangeEnabledSources={setEnabledSources}
          onRefreshHazards={() => setHazardsRefreshVersion((version) => version + 1)}
          onSelectSegment={handleSelectSegment}
          onNavigate={navigate}
        />
      ) : null}

      {currentScreen === 'warning' ? (
        <WarningScreen
          lang={lang}
          hazards={hazards}
          segments={segments}
          onSelectSegment={handleSelectSegment}
          onBack={goBack}
        />
      ) : null}

      {currentScreen === 'ask' ? (
        <AskScreen
          lang={lang}
          bulletin={hazards?.bulletin}
          originPlace={originPlace}
          onChangeOriginPlace={setOriginPlace}
          destinationPlace={destinationPlace}
          onChangeDestinationPlace={setDestinationPlace}
          travelMode={travelMode}
          onChangeTravelMode={setTravelMode}
          computingRoute={computingRoute}
          onBack={goBack}
          onOpenBulletin={() => navigate('warning')}
          onComputeSafeRoute={handleComputeSafeRoute}
        />
      ) : null}

      {currentScreen === 'route-found' || currentScreen === 'route-blocked' ? (
        <RouteResultScreen
          lang={lang}
          dataSaver={dataSaver}
          routeResult={routeResult}
          segments={segments}
          reports={reports}
          hazards={hazards}
          enabledSources={enabledSources}
          onSelectSegment={handleSelectSegment}
          onBack={goBack}
          onNavigate={navigate}
        />
      ) : null}

      {currentScreen === 'segment' ? (
        <SegmentScreen
          lang={lang}
          selectedSegment={selectedSegment}
          segments={segments}
          onSelectSegment={setSelectedSegment}
          reports={reports}
          bulletin={hazards?.bulletin}
          dataSaver={dataSaver}
          onBack={goBack}
          onOpenBulletin={() => navigate('warning')}
        />
      ) : null}

      {currentScreen === 'report' ? (
        <ReportScreen
          lang={lang}
          segments={segments}
          photoConsent={photoConsent}
          preciseLocationConsent={preciseLocationConsent}
          deviceToken={deviceToken}
          onBack={goBack}
          onReportCreated={handleReportCreated}
        />
      ) : null}

      {currentScreen === 'settings' ? (
        <SettingsScreen
          lang={lang}
          onChangeLang={setLang}
          textSize={textSize}
          onChangeTextSize={setTextSize}
          dataSaver={dataSaver}
          onChangeDataSaver={setDataSaver}
          preciseLocationConsent={preciseLocationConsent}
          onChangePreciseLocationConsent={setPreciseLocationConsent}
          photoConsent={photoConsent}
          onChangePhotoConsent={setPhotoConsent}
          ownReportCount={ownReportIds.length}
          onDeleteOwnReports={handleDeleteOwnReports}
          onBack={goBack}
        />
      ) : null}

      {currentScreen === 'speed-gate' ? (
        <SpeedGateScreen
          lang={lang}
          bulletin={hazards?.bulletin}
          onStopped={goBack}
          onOpenBulletin={() => navigate('warning')}
        />
      ) : null}

      {/* Persistent White Footer Navigation Bar across the entire app */}
      {currentScreen !== 'speed-gate' ? (
        <PersistentWhiteFooter currentScreen={currentScreen} onNavigate={navigate} lang={lang} />
      ) : null}

      {toastMessage ? (
        <div
          role="status"
          aria-live="polite"
          className="fixed left-1/2 -translate-x-1/2 z-50 bg-[#191b14] text-white px-[18px] py-[10px] rounded-[999px] shadow-[0px_8px_24px_rgba(26,28,20,0.24)] font-['Plus_Jakarta_Sans:SemiBold'] text-[14px] whitespace-nowrap"
          style={{ top: topInset + 6 }}
        >
          {toastMessage}
        </div>
      ) : null}
    </div>
  )
}
