'use client'

import Image from 'next/image'
import React, { useRef, useState } from 'react'
import { FloodVectorMap, type FloodVectorMapHandle } from '@/components/floodscout/FloodVectorMap'
import {
  MicButton,
  StatusBandDegraded,
  StatusBandFull,
  ToggleSwitch,
  pressDown,
  pressUp,
} from '@/components/floodscout/SharedPrimitives'
import {
  useCameraSafeTopInset,
  useGsapPulse,
  useGsapScreenEntrance,
  useGsapSheetEntrance,
} from '@/hooks/useGsap'
import { ASSETS } from '@/lib/assets'
import type {
  EnabledDisasterSources,
  FloodReportDTO,
  GeocodePlace,
  HazardSegmentDTO,
  Language,
  LiveHazardSnapshot,
  MapCameraPreset,
  ScreenId,
} from '@/types/floodscout'

interface HomeScreenProps {
  lang: Language
  onToggleLanguage: () => void
  dataSaver: boolean
  officialFeedDegraded: boolean
  onChangeOfficialFeedDegraded: (next: boolean) => void
  showCrowdLayer: boolean
  onChangeShowCrowdLayer: (next: boolean) => void
  originPlace: GeocodePlace
  destinationPlace: GeocodePlace
  segments: HazardSegmentDTO[]
  reports: FloodReportDTO[]
  hazards: LiveHazardSnapshot | null
  hazardsLoading: boolean
  enabledSources: EnabledDisasterSources
  onChangeEnabledSources: (next: EnabledDisasterSources) => void
  onRefreshHazards: () => void
  onSelectSegment: (seg: HazardSegmentDTO) => void
  onNavigate: (screen: ScreenId) => void
}

const LEGEND_ITEMS = [
  {
    id: 'avoid',
    icon: ASSETS.dotAvoid,
    style: 'border-red-300 bg-red-50 text-red-900',
    labelVi: 'Tránh (Ngập sâu / Sạt lở)',
    labelEn: 'Avoid (Deep flood / Landslide)',
    descVi:
      'Ngập ngang bánh xe, hầm chui ngập nhanh hoặc cảnh báo sạt lở đất. Tuyến đi loại trừ hoàn toàn cho xe máy và đi bộ.',
    descEn:
      'Wheel-deep floodwater, flooded underpasses, or landslide corridors. Excluded from route suggestions for every travel mode.',
  },
  {
    id: 'caution',
    icon: ASSETS.dotCaution,
    style: 'border-amber-300 bg-amber-50 text-amber-950',
    labelVi: 'Không nên đi',
    labelEn: 'Do not enter if avoidable',
    descVi: 'Mặt đường đọng nước ngang mắt cá hoặc vùng cảnh báo lũ quét sườn dốc.',
    descEn: 'Ankle-deep street water or hillside flash-flood watch corridor.',
  },
  {
    id: 'unknown',
    icon: ASSETS.dotUnknown,
    style: 'border-slate-300 bg-slate-100 text-slate-800',
    labelVi: 'Chưa rõ',
    labelEn: 'Unclear',
    descVi: 'Chưa đủ căn cứ hoặc mất kết nối bản tin chính thức. Không bao giờ coi là an toàn.',
    descEn: 'Insufficient evidence or official feed unavailable. Never treated as safe.',
  },
  {
    id: 'none',
    icon: ASSETS.dotNoAdverse,
    style: 'border-stone-300 bg-white text-stone-800',
    labelVi: 'Chưa thấy dấu hiệu bất lợi',
    labelEn: 'No adverse signs',
    descVi: 'Chưa ghi nhận báo cáo ngập gần đây. Đây không phải xác nhận an toàn.',
    descEn: 'No recent flood reports nearby. This is not a safety confirmation.',
  },
] as const

export function HomeScreen({
  lang,
  onToggleLanguage,
  dataSaver,
  officialFeedDegraded,
  onChangeOfficialFeedDegraded,
  showCrowdLayer,
  onChangeShowCrowdLayer,
  originPlace,
  destinationPlace,
  segments,
  reports,
  hazards,
  hazardsLoading,
  enabledSources,
  onChangeEnabledSources,
  onRefreshHazards,
  onSelectSegment,
  onNavigate,
}: HomeScreenProps) {
  const topInset = useCameraSafeTopInset()
  const mapRef = useRef<FloodVectorMapHandle | null>(null)
  const rootRef = useGsapScreenEntrance([lang, officialFeedDegraded])
  const bottomSheetRef = useGsapSheetEntrance(true)
  const liveDotRef = useGsapPulse(Boolean(hazards?.isLive))
  const langBtnRef = useRef<HTMLButtonElement | null>(null)

  const [layersOpen, setLayersOpen] = useState(false)
  const [selectedLegendId, setSelectedLegendId] = useState<string | null>(null)
  const [activePreset, setActivePreset] = useState<MapCameraPreset>('pilot')
  const [radarFrameIdx, setRadarFrameIdx] = useState<number | undefined>(undefined)

  const modalRef = useGsapSheetEntrance(layersOpen)
  const selectedLegend = LEGEND_ITEMS.find((item) => item.id === selectedLegendId)
  const activeSourceCount = Object.values(enabledSources).filter(Boolean).length
  const radarFrames = hazards?.radarFrames ?? []
  const effectiveRadarIdx =
    radarFrameIdx !== undefined
      ? radarFrameIdx
      : radarFrames.length > 0
        ? radarFrames.length - 1
        : 0

  const handlePreset = (preset: MapCameraPreset) => {
    setActivePreset(preset)
    mapRef.current?.flyToPreset(preset)
  }

  return (
    <div
      ref={rootRef}
      className="bg-[#ecede6] relative w-full min-h-dvh overflow-hidden flex flex-col justify-between pb-[84px]"
    >
      {/* Real MapLibre Vector Map with OpenStreetMap Road-Snapped Blue Flood Lines */}
      <FloodVectorMap
        ref={mapRef}
        variant={officialFeedDegraded ? 'home-degraded' : 'home'}
        lang={lang}
        dataSaver={dataSaver}
        showCrowdLayer={showCrowdLayer}
        originPlace={originPlace}
        destinationPlace={destinationPlace}
        segments={segments}
        reports={reports}
        hazards={hazards}
        enabledSources={enabledSources}
        activeRadarFrameIndex={effectiveRadarIdx}
        onSelectSegment={onSelectSegment}
        onTapDestination={() => onNavigate('ask')}
      />

      {/* Top Camera-Safe Overlay */}
      <div
        className="relative z-10 pointer-events-none flex flex-col items-start w-full"
        style={{ paddingTop: topInset }}
      >
        <div className="pointer-events-auto flex flex-col gap-[8px] items-start px-[16px] w-full md:max-w-[448px]">
          <div className="flex items-center justify-between w-full">
            <div className="bg-white flex items-center min-h-[46px] px-[18px] rounded-[999px] shadow-[0px_8px_24px_rgba(26,28,20,0.14)]">
              <span className="font-['Plus_Jakarta_Sans:ExtraBold'] font-extrabold leading-[26px] text-[#191b14] text-[21px] tracking-[-0.44px]">
                FloodScout
              </span>
            </div>

            <button
              ref={langBtnRef}
              type="button"
              onClick={onToggleLanguage}
              onPointerDown={() => pressDown(langBtnRef.current)}
              onPointerUp={() => pressUp(langBtnRef.current)}
              onPointerLeave={() => pressUp(langBtnRef.current)}
              aria-label={
                lang === 'vi' ? 'Đổi ngôn ngữ sang tiếng Anh' : 'Switch language to Vietnamese'
              }
              className="bg-white flex items-center justify-center min-h-[46px] px-[16px] rounded-[999px] shadow-[0px_8px_24px_rgba(26,28,20,0.14)]"
            >
              <span className="font-['Plus_Jakarta_Sans:SemiBold'] font-semibold text-[#191b14] text-[15px]">
                VI · EN
              </span>
            </button>
          </div>

          {officialFeedDegraded ? (
            <StatusBandDegraded
              lang={lang}
              lastFetchedTime={hazards?.bulletin?.fetchedAtFormatted}
              onRetry={() => {
                onChangeOfficialFeedDegraded(false)
                onRefreshHazards()
              }}
            />
          ) : (
            <StatusBandFull
              lang={lang}
              bulletin={hazards?.bulletin}
              onOpenBulletin={() => onNavigate('warning')}
            />
          )}
        </div>

        {/* Legend Chips */}
        <div className="pointer-events-auto mt-[8px] w-full overflow-x-auto no-scrollbar px-[16px] py-[2px]">
          <div className="flex flex-wrap gap-2 items-center">
            {LEGEND_ITEMS.map((chip) => {
              const isSelected = selectedLegendId === chip.id
              return (
                <button
                  key={chip.id}
                  type="button"
                  onClick={() => setSelectedLegendId((prev) => (prev === chip.id ? null : chip.id))}
                  aria-pressed={isSelected}
                  className={`${chip.style} border flex gap-[8px] items-center min-h-[38px] pl-[13px] pr-[15px] rounded-[999px] shadow-[0px_4px_14px_rgba(26,28,20,0.08)] shrink-0 transition ${
                    isSelected ? 'ring-2 ring-[#191b14]' : 'hover:brightness-95'
                  }`}
                >
                  <Image src={chip.icon} alt="" width={10} height={10} className="shrink-0" />
                  <span className="font-['Plus_Jakarta_Sans:SemiBold'] font-semibold leading-[19px] text-[13px] whitespace-nowrap">
                    {lang === 'vi' ? chip.labelVi : chip.labelEn}
                  </span>
                </button>
              )
            })}
          </div>
        </div>

        {selectedLegend ? (
          <div className="pointer-events-auto mx-[16px] mt-[6px] max-w-[360px] rounded-[16px] bg-white/96 px-[14px] py-[10px] shadow-[0px_8px_20px_rgba(26,28,20,0.14)]">
            <p className="font-['Plus_Jakarta_Sans:Regular'] text-[13px] leading-[19px] text-[#191b14]">
              {lang === 'vi' ? selectedLegend.descVi : selectedLegend.descEn}
            </p>
          </div>
        ) : null}

        {/* Live Telemetry & Corridor Jump Pills */}
        <div className="pointer-events-auto mt-[8px] px-[16px] flex flex-wrap gap-[6px]">
          <button
            type="button"
            onClick={() => setLayersOpen(true)}
            className="bg-[#191b14] flex items-center gap-[7px] px-[12px] py-[6px] rounded-[999px] shadow-sm"
          >
            <span ref={liveDotRef} className="size-[8px] rounded-full bg-[#22c55e] shrink-0" />
            <span className="font-['Plus_Jakarta_Sans:SemiBold'] font-semibold text-[12px] leading-[18px] text-white whitespace-nowrap">
              {hazardsLoading
                ? lang === 'vi'
                  ? 'Đang đồng bộ API...'
                  : 'Syncing live APIs...'
                : hazards
                  ? lang === 'vi'
                    ? `${activeSourceCount} API · Mưa 24h: ${hazards.weather.hourlySlice.length ? hazards.weather.totalNext24hMm + ' mm' : '—'} · ${segments.length} đoạn đường theo dõi`
                    : `${activeSourceCount} APIs · 24h: ${hazards.weather.hourlySlice.length ? hazards.weather.totalNext24hMm + ' mm' : '—'} · ${segments.length} corridors`
                  : lang === 'vi'
                    ? 'Đang tải dữ liệu...'
                    : 'Loading...'}
            </span>
          </button>
        </div>
      </div>

      {/* Right Floating Map Controls */}
      <div className="absolute right-[16px] md:right-[24px] bottom-[268px] md:bottom-auto md:top-[24px] z-10 flex flex-col gap-[10px] items-end">
        <div className="bg-white drop-shadow-[0px_8px_12px_rgba(26,28,20,0.14)] flex flex-col rounded-[16px] overflow-hidden">
          <button
            type="button"
            onClick={() => mapRef.current?.zoomIn()}
            aria-label={lang === 'vi' ? 'Phóng to' : 'Zoom in'}
            className="flex items-center justify-center size-[46px] hover:bg-[#f5f6f1]"
          >
            <Image src={ASSETS.iconPlus} alt="" width={15} height={15} />
          </button>
          <button
            type="button"
            onClick={() => mapRef.current?.zoomOut()}
            aria-label={lang === 'vi' ? 'Thu nhỏ' : 'Zoom out'}
            className="flex items-center justify-center size-[46px] hover:bg-[#f5f6f1]"
          >
            <Image src={ASSETS.iconMinus} alt="" width={15} height={2} />
          </button>
        </div>

        <button
          type="button"
          onClick={() => setLayersOpen(true)}
          aria-label={
            lang === 'vi' ? 'Lớp bản đồ và cảnh báo thiên tai' : 'Map layers and disaster feeds'
          }
          className="bg-white drop-shadow-[0px_8px_12px_rgba(26,28,20,0.14)] flex items-center justify-center rounded-[16px] size-[46px] hover:bg-[#f5f6f1]"
        >
          <Image src={ASSETS.iconLayers} alt="" width={20} height={20} />
        </button>

        <button
          type="button"
          onClick={() => {
            setActivePreset('pilot')
            mapRef.current?.locateUser()
          }}
          aria-label={lang === 'vi' ? 'Đưa bản đồ về vị trí xuất phát' : 'Center on origin'}
          className="bg-white drop-shadow-[0px_8px_12px_rgba(26,28,20,0.14)] flex items-center justify-center rounded-[16px] size-[46px] hover:bg-[#f5f6f1]"
        >
          <Image src={ASSETS.iconLocate} alt="" width={19} height={19} />
        </button>
      </div>

      <div className="min-h-[110px] flex-1 pointer-events-none" />

      {/* Search / Route Prompt Card (sits cleanly above Persistent White Footer) */}
      <div
        ref={bottomSheetRef}
        className="relative z-20 bg-white drop-shadow-[0px_-6px_16px_rgba(26,28,20,0.1)] flex flex-col gap-[10px] items-center pb-[14px] pt-[10px] px-[16px] mx-0 md:mx-[16px] md:mb-[8px] rounded-tl-[26px] rounded-tr-[26px] md:rounded-[26px] w-full md:max-w-[448px]"
      >
        <div className="bg-[#dfe1d8] h-[5px] rounded-[3px] w-[40px]" />
        <div className="flex flex-col gap-[2px] items-start w-full">
          <h2 className="font-['Plus_Jakarta_Sans:Bold'] font-bold leading-[26px] text-[#191b14] text-[19px] tracking-[-0.2px]">
            {lang === 'vi' ? 'Đi đường này?' : 'Compute safest route?'}
          </h2>
          <p className="font-['Plus_Jakarta_Sans:Regular'] leading-[19px] text-[#5d6157] text-[13px]">
            {lang === 'vi'
                ? `Từ ${originPlace.label.split('·')[0].trim()} · Tránh tự động các đoạn ngập, lũ quét & sạt lở.`
                : `From ${originPlace.label.split('·')[0].trim()} · Automatically routes around flood & landslide corridors.`}
          </p>
        </div>

        <div className="bg-[#eceee6] flex gap-[12px] h-[56px] items-center pl-[16px] pr-[5px] py-[4px] rounded-[999px] w-full">
          <button
            type="button"
            onClick={() => onNavigate('ask')}
            className="flex flex-1 gap-[10px] items-center min-w-0 h-full text-left"
          >
            <Image src={ASSETS.iconSearch} alt="" width={19} height={19} className="shrink-0" />
            <span className="flex-1 font-['Plus_Jakarta_Sans:Regular'] text-[#5d6157] text-[15px] truncate">
              {lang === 'vi'
                ? 'Nhập điểm đi & điểm đến thực tế...'
                : 'Enter starting point & destination...'}
            </span>
          </button>
          <MicButton size={48} lang={lang} onClick={() => onNavigate('ask')} />
        </div>
      </div>

      {/* Map Layers, Corridors & Live Disaster APIs Sheet */}
      {layersOpen ? (
        <div
          onClick={() => setLayersOpen(false)}
          className="fixed inset-0 z-50 bg-black/45 flex items-end md:items-center justify-center p-0 md:p-6"
          style={{ paddingTop: topInset }}
        >
          <div
            ref={modalRef}
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-tl-[28px] rounded-tr-[28px] md:rounded-[28px] w-full max-w-[500px] p-[20px] pb-[96px] md:pb-[20px] flex flex-col gap-[14px] max-h-[88dvh] overflow-y-auto"
          >
            <div className="flex items-center justify-between gap-[12px]">
              <h3 className="font-['Plus_Jakarta_Sans:Bold'] font-bold text-[19px] leading-[26px] text-[#191b14]">
                {lang === 'vi'
                  ? 'Vùng thiên tai thực tế & Lớp bản đồ'
                  : 'Real Hazard Corridors & Live APIs'}
              </h3>
              <button
                type="button"
                onClick={() => setLayersOpen(false)}
                className="bg-[#eceee6] px-[14px] py-[6px] rounded-[999px] font-['Plus_Jakarta_Sans:SemiBold'] text-[14px] text-[#191b14]"
              >
                {lang === 'vi' ? 'Đóng' : 'Close'}
              </button>
            </div>

            {/* Camera Fly-To Presets including Urban Flood, Flash Flood & Landslide */}
            <div className="flex flex-col gap-[6px]">
              <p className="font-['Plus_Jakarta_Sans:SemiBold'] text-[12px] tracking-[0.7px] uppercase text-[#5d6157]">
                {lang === 'vi'
                  ? 'DI CHUYỂN TỚI VÙNG CẢNH BÁO THỰC TẾ'
                  : 'JUMP TO ACTIVE HAZARD CORRIDOR'}
              </p>
              <div className="flex flex-wrap gap-[8px]">
                {(
                  [
                    { id: 'pilot', vi: 'Ngập đô thị · Thanh Xuân', en: 'Urban Flood · Thanh Xuân' },
                    { id: 'soc-son', vi: 'Lũ quét · Sóc Sơn', en: 'Flash Flood · Sóc Sơn' },
                    { id: 'hoa-binh', vi: 'Sạt lở · QL6 Hòa Bình', en: 'Landslide · QL6 Hòa Bình' },
                    { id: 'red-river', vi: 'Mực nước · Sông Hồng', en: 'Discharge · Red River' },
                    {
                      id: 'vietnam',
                      vi: 'Toàn miền · Radar & GDACS',
                      en: 'Vietnam · Radar & GDACS',
                    },
                  ] as const
                ).map((p) => {
                  const active = activePreset === p.id
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => {
                        handlePreset(p.id)
                        setLayersOpen(false)
                      }}
                      className={`px-[12px] py-[8px] rounded-[999px] font-['Plus_Jakarta_Sans:SemiBold'] text-[13px] transition ${
                        active
                          ? 'bg-[#191b14] text-white'
                          : 'bg-[#f3f4ef] text-[#191b14] hover:bg-[#eceee6]'
                      }`}
                    >
                      {lang === 'vi' ? p.vi : p.en}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* RainViewer Scrubber */}
            {enabledSources.rainViewer && radarFrames.length > 0 ? (
              <div className="rounded-[16px] bg-[#f3f4ef] p-[12px] flex flex-col gap-[8px]">
                <div className="flex items-center justify-between">
                  <span className="font-['Plus_Jakarta_Sans:SemiBold'] text-[14px] text-[#191b14]">
                    {lang === 'vi'
                      ? 'Radar mưa RainViewer (tối đa zoom 7)'
                      : 'RainViewer Historical Radar (max zoom 7)'}
                  </span>
                  <span className="font-['Plus_Jakarta_Sans:Regular'] text-[12px] text-[#5d6157]">
                    {new Date(
                      (radarFrames[effectiveRadarIdx]?.time ?? 0) * 1000,
                    ).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <div className="flex flex-wrap gap-[6px]">
                  {radarFrames.map((fr, idx) => (
                    <button
                      key={fr.time}
                      type="button"
                      onClick={() => setRadarFrameIdx(idx)}
                      className={`px-[10px] py-[5px] rounded-[999px] font-['Plus_Jakarta_Sans:SemiBold'] text-[12px] ${
                        idx === effectiveRadarIdx
                          ? 'bg-[#2563eb] text-white'
                          : 'bg-white text-[#191b14]'
                      }`}
                    >
                      {new Date(fr.time * 1000).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </button>
                  ))}
                </div>
              </div>
            ) : null}

            {/* 6 Live Disaster APIs */}
            <div className="flex flex-col gap-[8px]">
              <div className="flex items-center justify-between">
                <span className="font-['Plus_Jakarta_Sans:SemiBold'] text-[12px] tracking-[0.7px] uppercase text-[#5d6157]">
                  {lang === 'vi'
                    ? `NGUỒN API THIÊN TAI (${activeSourceCount}/6)`
                    : `LIVE DISASTER APIS (${activeSourceCount}/6)`}
                </span>
                <button
                  type="button"
                  onClick={onRefreshHazards}
                  className="font-['Plus_Jakarta_Sans:SemiBold'] text-[13px] text-[#2563eb]"
                >
                  {lang === 'vi' ? 'Làm mới ngay' : 'Refresh now'}
                </button>
              </div>

              {[
                {
                  key: 'openMeteoWeather' as const,
                  title: 'Open-Meteo Weather',
                  desc:
                    lang === 'vi'
                      ? 'Lượng mưa Hà Nội, Sóc Sơn (lũ quét) & Hòa Bình (sạt lở)'
                      : 'Multi-point Hanoi, Sóc Sơn & Hòa Bình precipitation',
                },
                {
                  key: 'openMeteoFlood' as const,
                  title: 'Open-Meteo Flood',
                  desc:
                    lang === 'vi'
                      ? `Lưu lượng Sông Hồng: ${hazards?.flood.daily.length ? hazards.flood.latestM3s : '--'} m³/s`
                      : `Red River discharge: ${hazards?.flood.daily.length ? hazards.flood.latestM3s : '--'} m³/s`,
                },
                {
                  key: 'gdacs' as const,
                  title: 'GDACS Alerts',
                  desc:
                    lang === 'vi'
                      ? `Bão & lũ khu vực (${hazards?.gdacsAlerts.length ?? 0} sự kiện)`
                      : `Regional floods & cyclones (${hazards?.gdacsAlerts.length ?? 0})`,
                },
                {
                  key: 'rainViewer' as const,
                  title: 'RainViewer Radar',
                  desc:
                    lang === 'vi'
                      ? 'Lớp phủ mây mưa radar trên MapLibre'
                      : 'Weather radar raster overlay on MapLibre',
                },
                {
                  key: 'nasaEonet' as const,
                  title: 'NASA EONET',
                  desc:
                    lang === 'vi'
                      ? 'Sự kiện sạt lở, bão & lũ tự nhiên đang mở'
                      : 'Open landslides, storms & floods',
                },
                {
                  key: 'usgsQuakes' as const,
                  title: 'USGS Earthquakes',
                  desc:
                    lang === 'vi'
                      ? 'Động đất 24h ảnh hưởng địa chất sườn dốc'
                      : '24h seismic events',
                },
              ].map((row) => (
                <div
                  key={row.key}
                  className="rounded-[16px] bg-[#f3f4ef] px-[14px] py-[8px] flex items-center justify-between gap-[12px]"
                >
                  <div className="flex flex-col">
                    <span className="font-['Plus_Jakarta_Sans:SemiBold'] text-[15px] text-[#191b14]">
                      {row.title}
                    </span>
                    <span className="font-['Plus_Jakarta_Sans:Regular'] text-[13px] text-[#5d6157]">
                      {row.desc}
                    </span>
                  </div>
                  <ToggleSwitch
                    checked={enabledSources[row.key]}
                    onChange={(val) =>
                      onChangeEnabledSources({ ...enabledSources, [row.key]: val })
                    }
                    label={row.title}
                    lang={lang}
                  />
                </div>
              ))}

              <div className="rounded-[16px] bg-[#f3f4ef] px-[14px] py-[8px] flex items-center justify-between gap-[12px]">
                <div className="flex flex-col">
                  <span className="font-['Plus_Jakarta_Sans:SemiBold'] text-[15px] text-[#191b14]">
                    {lang === 'vi' ? 'Vệt xanh báo cáo đường ngập' : 'Blue street flood lines'}
                  </span>
                  <span className="font-['Plus_Jakarta_Sans:Regular'] text-[13px] text-[#5d6157]">
                    {lang === 'vi'
                      ? 'Bám sát tim đường OpenStreetMap thực tế'
                      : 'Snapped directly onto real OpenStreetMap roads'}
                  </span>
                </div>
                <ToggleSwitch
                  checked={showCrowdLayer}
                  onChange={onChangeShowCrowdLayer}
                  label="Crowd flood lines"
                  lang={lang}
                />
              </div>

              <div className="grid grid-cols-2 gap-[8px] pt-[4px]">
                <button
                  type="button"
                  onClick={() => {
                    setLayersOpen(false)
                    onNavigate('speed-gate')
                  }}
                  className="rounded-[14px] bg-[#191b14] px-[14px] py-[11px] text-left font-['Plus_Jakarta_Sans:SemiBold'] text-[13px] text-white"
                >
                  {lang === 'vi' ? 'Kiểm tra khóa >15 km/h' : 'Test >15 km/h Speed Gate'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onChangeOfficialFeedDegraded(!officialFeedDegraded)
                    setLayersOpen(false)
                  }}
                  className="rounded-[14px] border border-[#dfe1d8] bg-[#f3f4ef] px-[14px] py-[11px] text-left font-['Plus_Jakarta_Sans:SemiBold'] text-[13px] text-[#191b14]"
                >
                  {lang === 'vi' ? 'Đổi trạng thái mất tin' : 'Toggle feed outage'}
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}
