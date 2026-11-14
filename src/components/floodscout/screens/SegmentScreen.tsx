'use client'

import Image from 'next/image'
import React, { useState } from 'react'
import { HeaderBack } from '@/components/floodscout/SharedPrimitives'
import { useCameraSafeTopInset, useGsapScreenEntrance, useGsapSheetEntrance } from '@/hooks/useGsap'
import type {
  CompiledAreaBulletin,
  FloodReportDTO,
  HazardSegmentDTO,
  Language,
} from '@/types/floodscout'

interface SegmentScreenProps {
  lang: Language
  selectedSegment: HazardSegmentDTO | null
  segments: HazardSegmentDTO[]
  onSelectSegment: (seg: HazardSegmentDTO) => void
  reports: FloodReportDTO[]
  bulletin?: CompiledAreaBulletin | null
  dataSaver: boolean
  onBack: () => void
  onOpenBulletin: () => void
}

export function SegmentScreen({
  lang,
  selectedSegment,
  segments,
  onSelectSegment,
  reports,
  bulletin,
  dataSaver,
  onBack,
  onOpenBulletin,
}: SegmentScreenProps) {
  const topInset = useCameraSafeTopInset()
  const current = selectedSegment || segments[0] || null
  const rootRef = useGsapScreenEntrance([lang, current?.id, reports.length])

  const [activePhotoReport, setActivePhotoReport] = useState<FloodReportDTO | null>(null)
  const modalRef = useGsapSheetEntrance(Boolean(activePhotoReport))

  const matchingReports = current
    ? reports.filter(
        (r) =>
          r.segmentId === current.id ||
          r.segmentName.toLowerCase().includes(current.name.split('(')[0].trim().toLowerCase()),
      )
    : reports
  const displayedReports = matchingReports.length > 0 ? matchingReports : reports

  const effectiveStatus = current?.effectiveRiskStatus || current?.riskStatus || 'avoid'
  const isAvoid = effectiveStatus === 'avoid'

  const depthTitle = (cat: string) => {
    if (cat === 'wheel') return lang === 'vi' ? 'Ngang bánh xe' : 'Wheel-hub deep'
    if (cat === 'ankle') return lang === 'vi' ? 'Ngang mắt cá' : 'Ankle deep'
    return lang === 'vi' ? 'Chưa rõ, có thấy nước' : 'Unclear depth, water visible'
  }

  return (
    <div ref={rootRef} className="bg-[#f3f4ef] flex flex-col min-h-dvh w-full pb-[92px]">
      <div className="w-full max-w-5xl mx-auto flex flex-col">
        <div
          className="flex flex-col gap-[10px] items-start pb-[4px] px-[16px] md:px-6 w-full"
          style={{ paddingTop: topInset }}
        >
          <HeaderBack
            title={current?.name || 'Đường Nguyễn Trãi'}
            subtitle={current?.address || 'Quận Thanh Xuân, Hà Nội'}
            onBack={onBack}
            lang={lang}
          />

          {/* Corridor Switcher Pills */}
          <div className="w-full overflow-x-auto no-scrollbar py-[2px]">
            <div className="flex gap-[8px] w-max">
              {segments.map((seg) => {
                const active = seg.id === current?.id
                return (
                  <button
                    key={seg.id}
                    type="button"
                    onClick={() => onSelectSegment(seg)}
                    className={`px-[13px] py-[7px] rounded-[999px] font-['Plus_Jakarta_Sans:SemiBold'] text-[13px] transition ${
                      active
                        ? 'bg-[#191b14] text-white'
                        : 'bg-white text-[#191b14] border border-[#dfe1d8]'
                    }`}
                  >
                    {seg.name.split('(')[0].trim()}
                  </button>
                )
              })}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-[16px] items-start pb-[24px] pt-[12px] px-[16px] md:px-6 w-full">
          <div className="flex flex-col gap-[16px] w-full">
            {/* Segment State */}
            <div
              data-gsap="stagger"
              className="bg-white flex gap-[14px] items-start p-[16px] rounded-[20px] shadow-[0px_4px_16px_rgba(26,28,20,0.06)] w-full"
            >
              <div
                className={`rounded-[4px] self-stretch shrink-0 w-[8px] ${
                  isAvoid ? 'bg-[#b91c1c]' : 'bg-[#d97706]'
                }`}
              />
              <div className="flex flex-1 flex-col gap-[3px] min-w-0">
                <p className="font-['Plus_Jakarta_Sans:SemiBold'] font-semibold text-[#5d6157] text-[12px] tracking-[0.78px] uppercase">
                  {current?.hazardType === 'landslide'
                    ? lang === 'vi'
                      ? 'CẢNH BÁO SẠT LỞ ĐẤT'
                      : 'LANDSLIDE CORRIDOR'
                    : current?.hazardType === 'flash-flood'
                      ? lang === 'vi'
                        ? 'CẢNH BÁO LŨ QUÉT / NGẬP NHANH'
                        : 'FLASH-FLOOD CORRIDOR'
                      : lang === 'vi'
                        ? 'TRẠNG THÁI ĐOẠN ĐƯỜNG'
                        : 'SEGMENT STATUS'}
                </p>
                <p className="font-['Plus_Jakarta_Sans:ExtraBold'] font-extrabold leading-[32px] text-[#191b14] text-[25px] tracking-[-0.35px]">
                  {isAvoid
                    ? lang === 'vi'
                      ? 'Tránh'
                      : 'Avoid'
                    : lang === 'vi'
                      ? 'Không nên đi'
                      : 'Caution'}
                </p>
                <p className="font-['Plus_Jakarta_Sans:Regular'] leading-[22px] text-[#5d6157] text-[15px]">
                  {current?.officialSourceNote ||
                    (lang === 'vi'
                      ? 'Không gợi ý đường đi qua đoạn này cho xe máy và đi bộ.'
                      : 'Excluded from motorbike and walking route suggestions.')}
                </p>
                {typeof current?.liveRainMm === 'number' ? (
                  <p className="font-['Plus_Jakarta_Sans:SemiBold'] text-[13px] text-[#2563eb] pt-[2px]">
                    {lang === 'vi'
                      ? `Mưa dự báo khu vực (${current.district}): ${current.liveRainMm} mm/h`
                      : `Local forecast rain (${current.district}): ${current.liveRainMm} mm/h`}
                  </p>
                ) : null}
              </div>
            </div>

            {/* Official Floor */}
            <div
              data-gsap="stagger"
              className="bg-[#fff3e6] border-2 border-[#c2410c] flex flex-col gap-[6px] px-[16px] py-[14px] rounded-[20px] w-full"
            >
              <p className="font-['Plus_Jakarta_Sans:SemiBold'] font-semibold text-[#9a3412] text-[12px] tracking-[0.78px] uppercase">
                {lang === 'vi' ? 'MỨC SÀN CHÍNH THỨC' : 'OFFICIAL FLOOR'}
              </p>
              <p className="font-['Plus_Jakarta_Sans:SemiBold'] font-semibold leading-[23px] text-[#191b14] text-[15px]">
                {bulletin
                  ? `${lang === 'vi' ? bulletin.headlineVi : bulletin.headlineEn} · ${
                      bulletin.fetchedAtFormatted
                    }`
                  : 'Trung tâm Dự báo KTTV Quốc gia'}
              </p>
              <p className="font-['Plus_Jakarta_Sans:Regular'] leading-[22px] text-[#191b14] text-[15px]">
                {lang === 'vi'
                  ? 'Ảnh báo cáo người dân chỉ có thể nâng mức cảnh báo, không thể hạ mức sàn chính thức.'
                  : 'Crowd photos can elevate risk but never lower an active official warning floor.'}
              </p>
              <button
                type="button"
                onClick={onOpenBulletin}
                className="font-['Plus_Jakarta_Sans:SemiBold'] font-semibold text-[#191b14] text-[15px] text-left underline"
              >
                {lang === 'vi' ? 'Xem bản tin khu vực' : 'View regional bulletin'}
              </button>
            </div>

            <div
              data-gsap="stagger"
              className="bg-[#eceee6] flex flex-col gap-[6px] px-[16px] py-[14px] rounded-[20px] w-full"
            >
              <p className="font-['Plus_Jakarta_Sans:SemiBold'] font-semibold text-[#5d6157] text-[12px] tracking-[0.78px] uppercase">
                {lang === 'vi' ? 'QUY TẮC ĐỘ MỚI (12 GIỜ)' : 'FRESHNESS DECAY RULE (12H)'}
              </p>
              <p className="font-['Plus_Jakarta_Sans:Regular'] leading-[23px] text-[#191b14] text-[15px]">
                {lang === 'vi'
                  ? 'Báo cáo hết tác dụng sau 12 giờ. Khi đang mưa lớn, trọng số giảm một nửa sau khoảng 45 phút.'
                  : 'Reports expire after 12 hours. During heavy rain, weight halves every ~45 minutes.'}
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-[14px] w-full">
            <h2 className="font-['Plus_Jakarta_Sans:Bold'] font-bold text-[#191b14] text-[18px]">
              {lang === 'vi'
                ? `Báo cáo hiện trường (${displayedReports.length})`
                : `Field crowd reports (${displayedReports.length})`}
            </h2>

            {displayedReports.map((rep) => {
              const isExpired = rep.moderationStatus === 'expired'
              const swatchHex = rep.depthCategory === 'wheel' ? '#b91c1c' : '#d97706'
              return (
                <div
                  key={rep.id}
                  data-gsap="stagger"
                  className={`bg-white flex gap-[14px] items-start px-[16px] py-[14px] rounded-[20px] shadow-[0px_4px_16px_rgba(26,28,20,0.06)] w-full ${
                    isExpired ? 'opacity-60' : ''
                  }`}
                >
                  <div className="pt-[5px] shrink-0">
                    <div
                      className="rounded-[3px] size-[16px]"
                      style={{ backgroundColor: swatchHex }}
                    />
                  </div>
                  <div className="flex flex-1 flex-col gap-[3px] min-w-0">
                    <p className="font-['Plus_Jakarta_Sans:SemiBold'] font-semibold text-[#191b14] text-[16px]">
                      {depthTitle(rep.depthCategory)} · {rep.segmentName.split('(')[0].trim()}
                    </p>
                    <p className="font-['Plus_Jakarta_Sans:Regular'] text-[#5d6157] text-[14px]">
                      {rep.address}
                    </p>
                    <p className="font-['Plus_Jakarta_Sans:Regular'] text-[#5d6157] text-[14px]">
                      {lang === 'vi'
                        ? `Người báo chọn: ${depthTitle(rep.depthCategory)}${
                            rep.aiProposedCategory
                              ? ` · AI đề xuất: ${depthTitle(rep.aiProposedCategory)}`
                              : ''
                          }`
                        : `Selected: ${depthTitle(rep.depthCategory)}${
                            rep.aiProposedCategory
                              ? ` · AI proposed: ${depthTitle(rep.aiProposedCategory)}`
                              : ''
                          }`}
                    </p>
                    {rep.aiSummary ? (
                      <p className="font-['Plus_Jakarta_Sans:Regular'] text-[#191b14] text-[14px] leading-[20px]">
                        {rep.aiSummary}
                      </p>
                    ) : null}
                    <p className="font-['Plus_Jakarta_Sans:Regular'] text-[#5d6157] text-[13px]">
                      {lang === 'vi'
                        ? `${rep.ageMinutes} phút trước · trọng số ${Math.round(
                            rep.weightFactor * 100,
                          )}%`
                        : `${rep.ageMinutes} min ago · weight ${Math.round(
                            rep.weightFactor * 100,
                          )}%`}
                    </p>
                    {rep.photoUrl && !isExpired ? (
                      <button
                        type="button"
                        onClick={() => setActivePhotoReport(rep)}
                        className="font-['Plus_Jakarta_Sans:SemiBold'] font-semibold text-[#2563eb] text-[14px] text-left underline pt-[2px]"
                      >
                        {lang === 'vi' ? 'Xem ảnh hiện trường đã làm mờ' : 'View redacted photo'}
                      </button>
                    ) : null}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {activePhotoReport && activePhotoReport.photoUrl ? (
        <div
          onClick={() => setActivePhotoReport(null)}
          className="fixed inset-0 z-50 bg-black/55 flex items-end md:items-center justify-center p-0 md:p-6"
          style={{ paddingTop: topInset }}
        >
          <div
            ref={modalRef}
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-tl-[28px] rounded-tr-[28px] md:rounded-[28px] w-full max-w-[430px] p-[20px] pb-[96px] md:pb-[20px] flex flex-col gap-[12px]"
          >
            <div className="flex items-center justify-between">
              <span className="bg-[#191b14] text-white font-['Plus_Jakarta_Sans:SemiBold'] text-[12px] px-[10px] py-[4px] rounded-full">
                {lang === 'vi' ? 'Đã làm mờ mặt & biển số' : 'Privacy redacted'}
              </span>
              <button
                type="button"
                onClick={() => setActivePhotoReport(null)}
                className="bg-[#eceee6] px-[12px] py-[6px] rounded-full font-['Plus_Jakarta_Sans:SemiBold'] text-[14px] text-[#191b14]"
              >
                {lang === 'vi' ? 'Đóng' : 'Close'}
              </button>
            </div>
            <div className="relative w-full h-[230px] rounded-[20px] overflow-hidden bg-[#d9dcd2]">
              <Image
                src={activePhotoReport.photoUrl}
                alt={activePhotoReport.photoAlt || activePhotoReport.title}
                fill
                sizes="(max-width: 768px) 100vw, 420px"
                className="object-cover"
              />
            </div>
            {dataSaver ? (
              <p className="font-['Plus_Jakarta_Sans:Regular'] text-[12px] text-[#5d6157]">
                {lang === 'vi' ? 'Chế độ tiết kiệm dữ liệu đang bật.' : 'Data saver mode active.'}
              </p>
            ) : null}
            <p className="font-['Plus_Jakarta_Sans:Bold'] font-bold text-[16px] text-[#191b14]">
              {activePhotoReport.title}
            </p>
            <p className="font-['Plus_Jakarta_Sans:Regular'] text-[14px] text-[#5d6157]">
              {activePhotoReport.address}
            </p>
          </div>
        </div>
      ) : null}
    </div>
  )
}
