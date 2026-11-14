'use client'

import { VoiceDestination } from '@/components/floodscout/VoiceDestination'
import React, { useEffect, useState } from 'react'
import {
  ButtonPrimary,
  HeaderBack,
  StatusBandCompact,
} from '@/components/floodscout/SharedPrimitives'
import { useCameraSafeTopInset, useGsapScreenEntrance } from '@/hooks/useGsap'
import type { CompiledAreaBulletin, GeocodePlace, Language, TravelMode } from '@/types/floodscout'

interface AskScreenProps {
  lang: Language
  bulletin?: CompiledAreaBulletin | null
  originPlace: GeocodePlace
  onChangeOriginPlace: (place: GeocodePlace) => void
  destinationPlace: GeocodePlace
  onChangeDestinationPlace: (place: GeocodePlace) => void
  travelMode: TravelMode
  onChangeTravelMode: (mode: TravelMode) => void
  computingRoute: boolean
  onBack: () => void
  onOpenBulletin: () => void
  onComputeSafeRoute: (overrideOrigin?: GeocodePlace, overrideDest?: GeocodePlace) => void
}

const ROUTE_PRESETS: Array<{
  id: string
  labelVi: string
  labelEn: string
  origin: GeocodePlace
  dest: GeocodePlace
}> = [
  {
    id: 'royal-to-biblio',
    labelVi: 'Royal City → Biblio (Tránh ngập Nguyễn Trãi)',
    labelEn: 'Royal City → Biblio (Avoids Nguyễn Trãi flood)',
    origin: {
      id: 'p-royal',
      label: 'Royal City · 72A Đường Nguyễn Trãi',
      address: '72A Đường Nguyễn Trãi, Thượng Đình, Thanh Xuân, Hà Nội',
      district: 'Quận Thanh Xuân, Hà Nội',
      lon: 105.8148,
      lat: 21.0025,
    },
    dest: {
      id: 'p-biblio',
      label: 'Biblio · 79 Phố Ngụy Như Kon Tum',
      address: '79 Phố Ngụy Như Kon Tum, Nhân Chính, Thanh Xuân, Hà Nội',
      district: 'Quận Thanh Xuân, Hà Nội',
      lon: 105.8042,
      lat: 21.0016,
    },
  },
  {
    id: 'hapulico-to-hanu',
    labelVi: 'Hapulico → ĐH Hà Nội (Tránh 275 Nguyễn Trãi)',
    labelEn: 'Hapulico → Hanoi Univ (Detours around 275 Nguyễn Trãi)',
    origin: {
      id: 'p-hapu',
      label: 'Hapulico · 1 Nguyễn Huy Tưởng',
      address: '1 Đường Nguyễn Huy Tưởng, Thanh Xuân, Hà Nội',
      district: 'Quận Thanh Xuân, Hà Nội',
      lon: 105.8065,
      lat: 20.9994,
    },
    dest: {
      id: 'p-hanu',
      label: 'Trường Đại học Hà Nội · Km9 Nguyễn Trãi',
      address: 'Km9 Đường Nguyễn Trãi, Nam Từ Liêm, Hà Nội',
      district: 'Quận Nam Từ Liêm, Hà Nội',
      lon: 105.7953,
      lat: 20.9893,
    },
  },
  {
    id: 'direct-into-underpass',
    labelVi: 'Đi vào Hầm chui Lê Văn Lương (Từ chối gợi ý)',
    labelEn: 'Into Lê Văn Lương Underpass (Blocked safety refusal)',
    origin: {
      id: 'p-royal-2',
      label: 'Royal City · 72A Đường Nguyễn Trãi',
      address: '72A Đường Nguyễn Trãi, Thanh Xuân, Hà Nội',
      district: 'Quận Thanh Xuân, Hà Nội',
      lon: 105.8148,
      lat: 21.0025,
    },
    dest: {
      id: 'p-underpass',
      label: 'Hầm chui Lê Văn Lương – Khuất Duy Tiến',
      address: 'Hầm chui Lê Văn Lương, Thanh Xuân, Hà Nội',
      district: 'Quận Thanh Xuân, Hà Nội',
      lon: 105.799181,
      lat: 21.001421,
    },
  },
]

export function AskScreen({
  lang,
  bulletin,
  originPlace,
  onChangeOriginPlace,
  destinationPlace,
  onChangeDestinationPlace,
  travelMode,
  onChangeTravelMode,
  computingRoute,
  onBack,
  onOpenBulletin,
  onComputeSafeRoute,
}: AskScreenProps) {
  const topInset = useCameraSafeTopInset()
  const rootRef = useGsapScreenEntrance([lang])

  const [originQuery, setOriginQuery] = useState(originPlace.address || originPlace.label)
  const [destQuery, setDestQuery] = useState(destinationPlace.address || destinationPlace.label)
  const [originSuggestions, setOriginSuggestions] = useState<GeocodePlace[]>([])
  const [destSuggestions, setDestSuggestions] = useState<GeocodePlace[]>([])
  const [focusedField, setFocusedField] = useState<'origin' | 'dest' | null>(null)
  const [suggestionStatus, setSuggestionStatus] = useState<'loading' | 'none' | 'unavailable' | null>(null)
  const [gpsError, setGpsError] = useState(false)
  const [locatingGps, setLocatingGps] = useState(false)

  useEffect(() => {
    setOriginQuery(originPlace.label)
  }, [originPlace])

  useEffect(() => {
    setDestQuery(destinationPlace.label)
  }, [destinationPlace])

  const focusedQuery = focusedField === 'origin' ? originQuery : destQuery
  useEffect(() => {
    if (!focusedField) return
    const setSuggestions = focusedField === 'origin' ? setOriginSuggestions : setDestSuggestions
    const controller = new AbortController()
    setSuggestions([])
    setSuggestionStatus('loading')
    const timer = window.setTimeout(async () => {
      try {
        const query = new URLSearchParams({ q: focusedQuery.trim() })
        const response = await fetch(`/runtime/geocode?${query}`, { signal: controller.signal })
        if (!response.ok) throw new Error('Geocoding unavailable')
        const { results, unavailable } = await response.json()
        if (controller.signal.aborted) return
        setSuggestions(results ?? [])
        setSuggestionStatus(unavailable ? 'unavailable' : results?.length ? null : 'none')
      } catch {
        if (!controller.signal.aborted) setSuggestionStatus('unavailable')
      }
    }, 220)
    return () => {
      window.clearTimeout(timer)
      controller.abort()
    }
  }, [focusedField, focusedQuery])

  const suggestionMessage = suggestionStatus === 'loading'
    ? lang === 'vi' ? 'Đang tìm địa điểm…' : 'Searching for places…'
    : suggestionStatus === 'unavailable'
      ? lang === 'vi' ? 'Tạm thời không tải được gợi ý.' : 'Place suggestions are temporarily unavailable.'
      : lang === 'vi' ? 'Không tìm thấy địa điểm.' : 'No matching places.'

  const handleUseGps = () => {
    setGpsError(false)
    if (!window.isSecureContext || !navigator.geolocation) {
      setGpsError(true)
      return
    }
    setLocatingGps(true)
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const r = await fetch(
            `/runtime/geocode?lat=${pos.coords.latitude}&lon=${pos.coords.longitude}`,
          )
          if (r.ok) {
            const data = await r.json()
            if (data.place) {
              onChangeOriginPlace(data.place)
              setOriginQuery(data.place.label)
            }
          }
        } catch {
          setGpsError(true)
        } finally {
          setLocatingGps(false)
        }
      },
      () => {
        setGpsError(true)
        setLocatingGps(false)
      },
      { timeout: 5000 },
    )
  }

  const modes: Array<{ id: TravelMode; labelVi: string; labelEn: string }> = [
    { id: 'motorbike', labelVi: 'Xe máy', labelEn: 'Motorbike' },
    { id: 'bicycle', labelVi: 'Xe đạp', labelEn: 'Bicycle' },
    { id: 'walk', labelVi: 'Đi bộ', labelEn: 'Walk' },
    { id: 'car', labelVi: 'Ô tô', labelEn: 'Car' },
  ]

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const finalOrigin =
      originQuery.trim() !== originPlace.label
        ? {
            ...originPlace,
            label: originQuery.trim(),
            address: originQuery.trim(),
            lon: NaN as any,
          }
        : originPlace
    const finalDest =
      destQuery.trim() !== destinationPlace.label
        ? {
            ...destinationPlace,
            label: destQuery.trim(),
            address: destQuery.trim(),
            lon: NaN as any,
          }
        : destinationPlace
    onComputeSafeRoute(finalOrigin, finalDest)
  }

  return (
    <form
      ref={rootRef as any}
      onSubmit={handleSubmit}
      className="bg-[#f3f4ef] flex flex-col min-h-dvh w-full justify-between pb-[84px]"
    >
      <div className="w-full max-w-3xl mx-auto flex-1 flex flex-col">
        <div
          className="flex flex-col gap-[12px] items-start pb-[4px] px-[16px] md:px-6 w-full"
          style={{ paddingTop: topInset }}
        >
          <HeaderBack
            title={lang === 'vi' ? 'Hỏi về một nơi đến' : 'Safest route planner'}
            subtitle={
              lang === 'vi'
                ? 'Tìm địa chỉ thực tế & tính đường tránh ngập, lũ quét, sạt lở'
                : 'Search real addresses & compute flood/landslide-safe routes'
            }
            onBack={onBack}
            lang={lang}
          />
          <StatusBandCompact lang={lang} bulletin={bulletin} onOpenBulletin={onOpenBulletin} />
        </div>

        <div className="flex flex-1 flex-col gap-[16px] items-start p-[16px] md:px-6 w-full">
          {/* Starting Point (Từ) */}
          <div data-gsap="stagger" className="flex flex-col gap-[6px] relative w-full z-30">
            <div className="flex items-center justify-between">
              <label className="font-['Plus_Jakarta_Sans:SemiBold'] font-semibold text-[#191b14] text-[16px]">
                {lang === 'vi' ? 'Từ (Điểm xuất phát)' : 'From (Starting point)'}
              </label>
              <button
                type="button"
                onClick={handleUseGps}
                className="font-['Plus_Jakarta_Sans:SemiBold'] text-[13px] text-[#2563eb] hover:underline"
              >
                {locatingGps
                  ? lang === 'vi'
                    ? 'Đang lấy GPS...'
                    : 'Locating GPS...'
                  : lang === 'vi'
                    ? 'Dùng GPS hiện tại'
                    : 'Use live GPS'}
              </button>
            </div>
            {gpsError && <p role="status" className="px-2 text-sm text-stone-700">{lang === 'vi' ? 'Vị trí cần kết nối HTTPS và quyền truy cập. Bạn có thể nhập điểm đi.' : 'Location requires HTTPS and permission. You can enter your origin.'}</p>}
            <input
              type="text"
              value={originQuery}
              onFocus={() => setFocusedField('origin')}
              onBlur={(event) => {
                if (!event.currentTarget.parentElement?.contains(event.relatedTarget)) setFocusedField(null)
              }}
              onChange={(e) => setOriginQuery(e.target.value)}
              placeholder={
                lang === 'vi'
                  ? 'Nhập số nhà, tên đường xuất phát...'
                  : 'Enter origin street or place...'
              }
              className="bg-white border-[#dfe1d8] border-[1.5px] min-h-[54px] px-[16px] rounded-[999px] w-full font-['Plus_Jakarta_Sans:Regular'] text-[#191b14] text-base outline-none focus:border-[#191b14]"
            />
            <p className="font-['Plus_Jakarta_Sans:Regular'] text-[12px] text-[#5d6157] px-[8px] truncate">
              {originPlace.address}
            </p>

            {focusedField === 'origin' && suggestionStatus && <p role="status" className="px-2 text-sm text-stone-600">{suggestionMessage}</p>}
            {focusedField === 'origin' && originSuggestions.length > 0 ? (
              <div className="relative bg-white rounded-[20px] shadow-[0_12px_28px_rgba(26,28,20,0.16)] border border-[#dfe1d8] overflow-hidden z-40">
                {originSuggestions.map((sug) => (
                  <button
                    key={sug.id}
                    type="button"
                    onPointerDown={(event) => event.preventDefault()}
                    onClick={() => {
                      onChangeOriginPlace(sug)
                      setOriginQuery(sug.label)
                      setFocusedField(null)
                    }}
                    className="w-full px-[16px] py-[11px] text-left hover:bg-[#f3f4ef] border-b border-[#eceee6] last:border-b-0 flex flex-col"
                  >
                    <span className="font-['Plus_Jakarta_Sans:SemiBold'] text-[14px] text-[#191b14]">
                      {sug.label}
                    </span>
                    <span className="font-['Plus_Jakarta_Sans:Regular'] text-[12px] text-[#5d6157] truncate">
                      {sug.address}
                    </span>
                  </button>
                ))}
              </div>
            ) : null}
          </div>

          {/* Destination (Đến) */}
          <div data-gsap="stagger" className="flex flex-col gap-[6px] relative w-full z-20">
            <label className="font-['Plus_Jakarta_Sans:SemiBold'] font-semibold text-[#191b14] text-[16px]">
              {lang === 'vi' ? 'Đến (Điểm đến)' : 'To (Destination)'}
            </label>
            <input
              type="text"
              value={destQuery}
              onFocus={() => setFocusedField('dest')}
              onBlur={(event) => {
                if (!event.currentTarget.parentElement?.contains(event.relatedTarget)) setFocusedField(null)
              }}
              onChange={(e) => setDestQuery(e.target.value)}
              placeholder={
                lang === 'vi' ? 'Nhập địa chỉ hoặc địa điểm đến...' : 'Enter destination address...'
              }
              className="bg-white border-[#dfe1d8] border-[1.5px] min-h-[54px] px-[16px] rounded-[999px] w-full font-['Plus_Jakarta_Sans:Regular'] text-[#191b14] text-base outline-none focus:border-[#191b14]"
            />
            <p className="font-['Plus_Jakarta_Sans:Regular'] text-[12px] text-[#5d6157] px-[8px] truncate">
              {destinationPlace.address}
            </p>

            {focusedField === 'dest' && suggestionStatus && <p role="status" className="px-2 text-sm text-stone-600">{suggestionMessage}</p>}
            {focusedField === 'dest' && destSuggestions.length > 0 ? (
              <div className="relative bg-white rounded-[20px] shadow-[0_12px_28px_rgba(26,28,20,0.16)] border border-[#dfe1d8] overflow-hidden z-40">
                {destSuggestions.map((sug) => (
                  <button
                    key={sug.id}
                    type="button"
                    onPointerDown={(event) => event.preventDefault()}
                    onClick={() => {
                      onChangeDestinationPlace(sug)
                      setDestQuery(sug.label)
                      setFocusedField(null)
                    }}
                    className="w-full px-[16px] py-[11px] text-left hover:bg-[#f3f4ef] border-b border-[#eceee6] last:border-b-0 flex flex-col"
                  >
                    <span className="font-['Plus_Jakarta_Sans:SemiBold'] text-[14px] text-[#191b14]">
                      {sug.label}
                    </span>
                    <span className="font-['Plus_Jakarta_Sans:Regular'] text-[12px] text-[#5d6157] truncate">
                      {sug.address}
                    </span>
                  </button>
                ))}
              </div>
            ) : null}
          </div>

          <VoiceDestination key={lang} lang={lang} onDestination={(destination) => {
            setDestQuery(destination)
            setFocusedField('dest')
          }} />

          {/* One-Tap Real Hanoi Test Corridors */}
          <div data-gsap="stagger" className="flex flex-col gap-[6px] w-full">
            <span className="font-['Plus_Jakarta_Sans:SemiBold'] text-[12px] tracking-[0.7px] uppercase text-[#5d6157]">
              {lang === 'vi' ? 'THỬ NHANH CÁC LỘ TRÌNH THỰC TẾ' : 'REAL HANOI ROUTE PRESETS'}
            </span>
            <div className="flex flex-wrap gap-[8px]">
              {ROUTE_PRESETS.map((pr) => (
                <button
                  key={pr.id}
                  type="button"
                  onClick={() => {
                    onChangeOriginPlace(pr.origin)
                    onChangeDestinationPlace(pr.dest)
                    onComputeSafeRoute(pr.origin, pr.dest)
                  }}
                  className="rounded-[999px] bg-[#eceee6] hover:bg-[#dfe1d8] px-[13px] py-[7px] font-['Plus_Jakarta_Sans:SemiBold'] text-[13px] text-[#191b14] text-left transition"
                >
                  {lang === 'vi' ? pr.labelVi : pr.labelEn}
                </button>
              ))}
            </div>
          </div>

          {/* Mode Selector */}
          <div data-gsap="stagger" className="flex flex-col gap-[8px] w-full">
            <span className="font-['Plus_Jakarta_Sans:SemiBold'] font-semibold text-[#191b14] text-[16px]">
              {lang === 'vi' ? 'Phương tiện' : 'Travel mode'}
            </span>
            <div
              role="radiogroup"
              aria-label={lang === 'vi' ? 'Phương tiện' : 'Travel mode'}
              className="bg-[#eceee6] flex gap-[6px] p-[6px] rounded-[20px] w-full"
            >
              {modes.map((m) => {
                const selected = travelMode === m.id
                return (
                  <button
                    key={m.id}
                    type="button"
                    role="radio"
                    aria-checked={selected}
                    onClick={() => onChangeTravelMode(m.id)}
                    className={`flex flex-1 items-center justify-center min-h-[46px] py-[10px] rounded-[12px] transition ${
                      selected
                        ? 'bg-white shadow-[0px_2px_8px_rgba(18,23,38,0.1)]'
                        : 'hover:bg-white/40'
                    }`}
                  >
                    <span
                      className={`font-['Plus_Jakarta_Sans:SemiBold'] font-semibold text-[15px] ${
                        selected ? 'text-[#191b14]' : 'text-[#5d6157]'
                      }`}
                    >
                      {lang === 'vi' ? m.labelVi : m.labelEn}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Unmapped Caveat */}
          <div
            data-gsap="stagger"
            className="bg-[#eceee6] flex flex-col gap-[4px] px-[16px] py-[13px] rounded-[20px] w-full"
          >
            <p className="font-['Plus_Jakarta_Sans:SemiBold'] font-semibold text-[#191b14] text-[15px] leading-[22px]">
              {lang === 'vi'
                ? 'Tính toán đa lộ trình OpenStreetMap kết hợp API mưa, ngập & sạt lở.'
                : 'Evaluates multiple OpenStreetMap routes against live rainfall, flood & landslide polylines.'}
            </p>
            <p className="font-['Plus_Jakarta_Sans:Regular'] text-[#5d6157] text-[14px] leading-[20px]">
              {lang === 'vi'
                ? 'Nếu mọi đường đều cắt qua đoạn cần tránh (ngập sâu / hầm chui / sạt lở), FloodScout sẽ từ chối gợi ý đường.'
                : 'If every candidate crosses an Avoid corridor, FloodScout refuses to suggest an unsafe route.'}
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white border-t border-[#dfe1d8] flex flex-col items-center py-[14px] px-[16px] w-full">
        <div className="w-full max-w-md">
          <ButtonPrimary
            type="submit"
            disabled={!destQuery.trim() || computingRoute}
            label={
              computingRoute
                ? lang === 'vi'
                  ? 'Đang tính đường an toàn nhất...'
                  : 'Computing safest road...'
                : lang === 'vi'
                  ? 'Tính đường tránh ngập an toàn nhất'
                  : 'Compute safest route'
            }
          />
        </div>
      </div>
    </form>
  )
}
