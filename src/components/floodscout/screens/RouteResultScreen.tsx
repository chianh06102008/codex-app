'use client'

import Image from 'next/image'
import React from 'react'
import { FloodVectorMap } from '@/components/floodscout/FloodVectorMap'
import {
  ButtonPrimary,
  StatusBandCompact,
  getTravelModeLabel,
} from '@/components/floodscout/SharedPrimitives'
import { useCameraSafeTopInset, useGsapScreenEntrance, useGsapSheetEntrance } from '@/hooks/useGsap'
import { ASSETS } from '@/lib/assets'
import type {
  EnabledDisasterSources,
  FloodReportDTO,
  HazardSegmentDTO,
  Language,
  LiveHazardSnapshot,
  SafeRouteResponse,
  ScreenId,
} from '@/types/floodscout'

interface RouteResultScreenProps {
  lang: Language
  dataSaver: boolean
  routeResult: SafeRouteResponse | null
  segments: HazardSegmentDTO[]
  reports: FloodReportDTO[]
  hazards: LiveHazardSnapshot | null
  enabledSources: EnabledDisasterSources
  onSelectSegment: (seg: HazardSegmentDTO) => void
  onBack: () => void
  onNavigate: (screen: ScreenId) => void
}

export function RouteResultScreen({
  lang,
  dataSaver,
  routeResult,
  segments,
  reports,
  hazards,
  enabledSources,
  onSelectSegment,
  onBack,
  onNavigate,
}: RouteResultScreenProps) {
  const topInset = useCameraSafeTopInset()
  const rootRef = useGsapScreenEntrance([routeResult?.status, lang])
  const sheetRef = useGsapSheetEntrance(true)

  const isFound = routeResult ? routeResult.status === 'route-found' : true
  const destLabel = routeResult?.destination.label || 'Biblio · 79 Phố Ngụy Như Kon Tum'
  const originLabel = routeResult?.origin.label || 'Royal City · 72A Đường Nguyễn Trãi'
  const modeLabel = getTravelModeLabel(routeResult?.mode || 'motorbike', lang)

  return (
    <div
      ref={rootRef}
      className="bg-[#ecede6] relative w-full min-h-dvh overflow-hidden flex flex-col justify-between pb-[84px]"
    >
      <FloodVectorMap
        variant={isFound ? 'route-found' : 'route-blocked'}
        lang={lang}
        dataSaver={dataSaver}
        originPlace={routeResult?.origin}
        destinationPlace={routeResult?.destination}
        safeRouteCoords={routeResult?.safeRoute?.coordinates}
        avoidedDirectCoords={routeResult?.avoidedDirectRoute?.coordinates}
        segments={segments}
        reports={reports}
        hazards={hazards}
        enabledSources={enabledSources}
        onSelectSegment={onSelectSegment}
      />

      {/* Camera-Safe Top Header */}
      <div
        className="relative z-10 pointer-events-none flex flex-col gap-[8px] items-start px-[16px] w-full md:max-w-[460px]"
        style={{ paddingTop: topInset }}
      >
        <div className="pointer-events-auto bg-white rounded-[24px] p-[6px] pr-[16px] shadow-[0px_8px_24px_rgba(26,28,20,0.14)] flex items-center gap-[12px] w-full">
          <button
            type="button"
            onClick={onBack}
            aria-label={lang === 'vi' ? 'Quay lại' : 'Back'}
            className="bg-white shadow-[0px_4px_12px_rgba(26,28,20,0.12)] flex items-center justify-center rounded-[18px] shrink-0 size-[44px]"
          >
            <Image src={ASSETS.iconChevronLeft} alt="" width={24} height={24} />
          </button>
          <div className="flex flex-1 flex-col min-w-0">
            <h1 className="font-['Plus_Jakarta_Sans:Bold'] font-bold text-[18px] leading-[24px] text-[#191b14] truncate">
              {lang === 'vi'
                ? `Đến ${destLabel.split('·')[0].trim()}`
                : `To ${destLabel.split('·')[0].trim()}`}
            </h1>
            <p className="font-['Plus_Jakarta_Sans:Regular'] text-[13px] leading-[19px] text-[#5d6157] truncate">
              {lang === 'vi'
                ? `Từ ${originLabel.split('·')[0].trim()} · ${modeLabel}${
                    routeResult?.safeRoute
                      ? ` · ${routeResult.safeRoute.distanceKm} km (~${routeResult.safeRoute.durationMin} phút)`
                      : ''
                  }`
                : `From ${originLabel.split('·')[0].trim()} · ${modeLabel}${
                    routeResult?.safeRoute
                      ? ` · ${routeResult.safeRoute.distanceKm} km (~${routeResult.safeRoute.durationMin} min)`
                      : ''
                  }`}
            </p>
          </div>
        </div>

        <div className="pointer-events-auto w-full">
          <StatusBandCompact
            lang={lang}
            bulletin={hazards?.bulletin}
            onOpenBulletin={() => onNavigate('warning')}
          />
        </div>
      </div>

      <div className="min-h-[90px] flex-1 pointer-events-none" />

      {/* Bottom Result Sheet (above Persistent White Footer) */}
      <div
        ref={sheetRef}
        className="relative z-20 bg-white drop-shadow-[0px_-6px_16px_rgba(26,28,20,0.12)] flex flex-col gap-[10px] items-start pb-[14px] pt-[10px] px-[16px] mx-0 md:mx-[16px] md:mb-[8px] rounded-tl-[28px] rounded-tr-[28px] md:rounded-[28px] w-full md:max-w-[460px]"
      >
        <div className="self-center bg-[#dfe1d8] h-[5px] rounded-[3px] w-[40px]" />

        <div className="w-full max-h-[275px] md:max-h-[420px] overflow-y-auto flex flex-col gap-[10px] pr-[2px]">
          {isFound && routeResult?.safeRoute ? (
            <>
              <div className="flex flex-col gap-[2px]">
                <h2 className="font-['Plus_Jakarta_Sans:ExtraBold'] font-extrabold text-[21px] leading-[27px] tracking-[-0.3px] text-[#191b14]">
                  {lang === 'vi'
                    ? 'Đã tính tuyến an toàn nhất tránh vùng ngập'
                    : 'Safest detour computed around active hazards'}
                </h2>
                <p className="font-['Plus_Jakarta_Sans:SemiBold'] text-[13px] leading-[19px] text-[#2563eb]">
                  {routeResult.safeRoute.streetSummary}
                </p>
              </div>

              <div className="grid grid-cols-3 gap-[8px] w-full">
                <div className="bg-[#eceee6] rounded-[15px] px-[10px] py-[9px] flex flex-col justify-between">
                  <span className="font-['Plus_Jakarta_Sans:Regular'] text-[12px] text-[#5d6157]">
                    {lang === 'vi' ? 'Đoạn đã tránh' : 'Avoided'}
                  </span>
                  <span className="font-['Plus_Jakarta_Sans:Bold'] font-bold text-[19px] text-[#191b14]">
                    {Math.max(1, routeResult.avoidedHazards.length)}
                  </span>
                </div>
                <div className="bg-[#eceee6] rounded-[15px] px-[10px] py-[9px] flex flex-col justify-between">
                  <span className="font-['Plus_Jakarta_Sans:Regular'] text-[12px] text-[#5d6157]">
                    {lang === 'vi' ? 'Điểm an toàn' : 'Safety score'}
                  </span>
                  <span className="font-['Plus_Jakarta_Sans:Bold'] font-bold text-[19px] text-[#191b14]">
                    {routeResult.safeRoute.safetyScore}/100
                  </span>
                </div>
                <div className="bg-[#eceee6] rounded-[15px] px-[10px] py-[9px] flex flex-col justify-between">
                  <span className="font-['Plus_Jakarta_Sans:Regular'] text-[12px] text-[#5d6157]">
                    {lang === 'vi' ? 'Quãng đường' : 'Distance'}
                  </span>
                  <span className="font-['Plus_Jakarta_Sans:Bold'] font-bold text-[17px] text-[#191b14]">
                    {routeResult.safeRoute.distanceKm} km
                  </span>
                </div>
              </div>

              <div className="bg-[#fff3e6] rounded-[16px] px-[14px] py-[10px] flex flex-col gap-[2px] w-full">
                <p className="font-['Plus_Jakarta_Sans:Bold'] font-bold text-[14px] text-[#191b14]">
                  {lang === 'vi'
                    ? 'Đây không phải xác nhận an toàn tuyệt đối.'
                    : 'This is not an absolute safety guarantee.'}
                </p>
                <p className="font-['Plus_Jakarta_Sans:Regular'] text-[13px] leading-[19px] text-[#5d6157]">
                  {lang === 'vi'
                    ? 'Ngõ nhỏ có thể chưa có báo cáo. Gặp nước chảy xiết hoặc ngập sâu thì dừng lại ngay.'
                    : 'Narrow alleys may lack reports. Stop immediately if you see rising or moving water.'}
                </p>
              </div>

              <div className="flex flex-col gap-[7px] w-full">
                <h3 className="font-['Plus_Jakarta_Sans:Bold'] font-bold text-[16px] text-[#191b14]">
                  {lang === 'vi' ? 'Vì sao chọn lộ trình này?' : 'Why this route?'}
                </h3>
                {routeResult.avoidedHazards.map((hz) => (
                  <button
                    key={hz.id}
                    type="button"
                    onClick={() => {
                      const seg = segments.find((s) => s.id === hz.id || s.name === hz.name)
                      if (seg) onSelectSegment(seg)
                    }}
                    className="flex gap-[9px] items-start text-left w-full hover:opacity-80"
                  >
                    <span className="mt-[5px] shrink-0">
                      <Image src={ASSETS.dotAvoid} alt="" width={10} height={10} />
                    </span>
                    <span className="font-['Plus_Jakarta_Sans:Regular'] text-[14px] leading-[20px] text-[#191b14]">
                      {lang === 'vi' ? hz.reasonVi : hz.reasonEn}
                    </span>
                  </button>
                ))}
              </div>
            </>
          ) : (
            <>
              <div className="flex flex-col gap-[3px]">
                <h2 className="font-['Plus_Jakarta_Sans:ExtraBold'] font-extrabold text-[21px] leading-[27px] text-[#191b14]">
                  {lang === 'vi'
                    ? 'FloodScout không gợi ý đường nào.'
                    : 'FloodScout suggests no safe route.'}
                </h2>
                <p className="font-['Plus_Jakarta_Sans:Regular'] text-[14px] text-[#5d6157]">
                  {lang === 'vi'
                    ? 'Điểm đến hoặc mọi tuyến tiếp cận đều cắt qua vùng ngập sâu / hầm chui / sạt lở.'
                    : 'Destination or all access roads cross deep flood, underpass, or landslide zones.'}
                </p>
              </div>

              <div className="flex flex-col gap-[7px] w-full">
                {(routeResult?.blockingHazards ?? []).map((hz) => (
                  <button
                    key={hz.id}
                    type="button"
                    onClick={() => {
                      const seg = segments.find((s) => s.id === hz.id || s.name === hz.name)
                      if (seg) onSelectSegment(seg)
                    }}
                    className="flex gap-[9px] items-start text-left w-full hover:opacity-80"
                  >
                    <span className="mt-[5px] shrink-0">
                      <Image src={ASSETS.dotAvoid} alt="" width={10} height={10} />
                    </span>
                    <span className="font-['Plus_Jakarta_Sans:Regular'] text-[14px] leading-[20px] text-[#191b14]">
                      {lang === 'vi' ? hz.reasonVi : hz.reasonEn}
                    </span>
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        <div className="w-full pt-[2px]">
          <ButtonPrimary
            label={
              isFound
                ? lang === 'vi'
                  ? 'Đổi điểm đi / điểm đến khác'
                  : 'Change origin or destination'
                : lang === 'vi'
                  ? 'Xem hướng dẫn & cảnh báo chính thức'
                  : 'View official guidance & alerts'
            }
            onClick={() => onNavigate(isFound ? 'ask' : 'warning')}
          />
        </div>
      </div>
    </div>
  )
}
