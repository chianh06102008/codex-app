'use client'

import React, { useState } from 'react'
import { ButtonPrimary, HeaderBack, StatusBandFull } from '@/components/floodscout/SharedPrimitives'
import { useCameraSafeTopInset, useGsapScreenEntrance, useGsapSheetEntrance } from '@/hooks/useGsap'
import type { HazardSegmentDTO, Language, LiveHazardSnapshot } from '@/types/floodscout'

interface WarningScreenProps {
  lang: Language
  hazards: LiveHazardSnapshot | null
  segments: HazardSegmentDTO[]
  onSelectSegment: (seg: HazardSegmentDTO) => void
  onBack: () => void
}

export function WarningScreen({
  lang,
  hazards,
  segments,
  onSelectSegment,
  onBack,
}: WarningScreenProps) {
  const topInset = useCameraSafeTopInset()
  const rootRef = useGsapScreenEntrance([lang])
  const [sourceModalOpen, setSourceModalOpen] = useState(false)
  const modalRef = useGsapSheetEntrance(sourceModalOpen)

  const b = hazards?.bulletin

  const rows =
    lang === 'vi'
      ? [
          {
            label: 'Đơn vị & nguồn',
            value: b?.issuerVi || 'Trung tâm Dự báo KTTV Quốc gia · Open-Meteo & GDACS',
          },
          { label: 'Phát hành', value: b?.issuedAtFormatted || 'Đang đồng bộ' },
          { label: 'Hiệu lực đến', value: b?.validUntilFormatted || 'Đang đồng bộ' },
          {
            label: 'Địa danh áp dụng',
            value:
              b?.affectedAreasVi || 'Quận Thanh Xuân, Huyện Sóc Sơn (Hà Nội), Quốc lộ 6 – Hòa Bình',
          },
          { label: 'Cập nhật API lúc', value: b?.fetchedAtFormatted || 'Vừa xong' },
        ]
      : [
          { label: 'Source', value: b?.issuerEn || 'NCHMF · Open-Meteo & GDACS' },
          { label: 'Issued', value: b?.issuedAtFormatted || 'Syncing' },
          { label: 'Valid until', value: b?.validUntilFormatted || 'Syncing' },
          {
            label: 'Affected areas',
            value: b?.affectedAreasEn || 'Thanh Xuân, Sóc Sơn (Hanoi), QL6 Hòa Bình',
          },
          { label: 'API synced at', value: b?.fetchedAtFormatted || 'Just now' },
        ]

  return (
    <div
      ref={rootRef}
      className="bg-[#f3f4ef] flex flex-col min-h-dvh w-full justify-between pb-[88px]"
    >
      <div className="w-full max-w-5xl mx-auto flex-1 flex flex-col">
        <div
          className="flex flex-col items-start pb-[4px] px-[16px] md:px-6 w-full"
          style={{ paddingTop: topInset }}
        >
          <HeaderBack
            title={lang === 'vi' ? 'Cảnh báo chính thức & khu vực' : 'Official & regional warnings'}
            subtitle={
              lang === 'vi'
                ? 'Tổng hợp ngập đô thị, lũ quét sườn dốc & sạt lở đất'
                : 'Compiled urban flood, hillside flash-flood & landslide alerts'
            }
            onBack={onBack}
            lang={lang}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-[16px] items-start pb-[20px] pt-[12px] px-[16px] md:px-6 w-full">
          <div className="flex flex-col gap-[16px] w-full">
            <div data-gsap="stagger">
              <StatusBandFull
                lang={lang}
                bulletin={b}
                onOpenBulletin={() => setSourceModalOpen(true)}
              />
            </div>

            <div
              data-gsap="stagger"
              className="bg-white flex flex-col gap-[10px] pb-[16px] pt-[14px] px-[16px] rounded-[20px] shadow-[0px_4px_16px_rgba(26,28,20,0.06)] w-full"
            >
              {rows.map((row) => (
                <div key={row.label} className="flex gap-[12px] items-start w-full">
                  <span className="font-['Plus_Jakarta_Sans:Regular'] text-[#5d6157] text-[15px] w-[126px] shrink-0">
                    {row.label}
                  </span>
                  <span className="flex-1 font-['Plus_Jakarta_Sans:SemiBold'] font-semibold text-[#191b14] text-[15px] leading-[22px]">
                    {row.value}
                  </span>
                </div>
              ))}
              <button
                type="button"
                onClick={() => setSourceModalOpen(true)}
                className="font-['Plus_Jakarta_Sans:SemiBold'] font-semibold text-[#191b14] text-[15px] text-left underline"
              >
                {lang === 'vi'
                  ? 'Mở cổng cảnh báo gốc · nchmf.gov.vn'
                  : 'Open official portal · nchmf.gov.vn'}
              </button>
            </div>

            <div
              data-gsap="stagger"
              className="bg-[#fff3e6] border-2 border-[#c2410c] flex flex-col gap-[6px] px-[16px] py-[14px] rounded-[20px] w-full"
            >
              <p className="font-['Plus_Jakarta_Sans:SemiBold'] font-semibold text-[#9a3412] text-[12px] tracking-[0.78px] uppercase">
                {lang === 'vi'
                  ? 'HƯỚNG DẪN SƠ TÁN & PHÒNG TRÁNH LŨ QUÉT / SẠT LỞ'
                  : 'EVACUATION, FLASH-FLOOD & LANDSLIDE SAFETY'}
              </p>
              <p className="font-['Plus_Jakarta_Sans:Bold'] font-bold leading-[25px] text-[#191b14] text-[17px]">
                {b
                  ? lang === 'vi'
                    ? b.evacuationVi
                    : b.evacuationEn
                  : lang === 'vi'
                    ? 'Không đi qua hầm chui ngập nước hoặc sườn dốc có nguy cơ sạt lở khi mưa lớn.'
                    : 'Avoid flooded underpasses and steep landslide-prone passes during heavy rain.'}
              </p>
            </div>

            {/* Active Real Corridors List */}
            <div
              data-gsap="stagger"
              className="bg-white flex flex-col gap-[10px] p-[16px] rounded-[20px] shadow-[0px_4px_16px_rgba(26,28,20,0.06)] w-full"
            >
              <p className="font-['Plus_Jakarta_Sans:SemiBold'] font-semibold text-[#5d6157] text-[12px] tracking-[0.78px] uppercase">
                {lang === 'vi'
                  ? 'CÁC ĐOẠN ĐƯỜNG & ĐÈO DỐC ĐANG CẢNH BÁO'
                  : 'ACTIVE MONITORED ROAD & PASS CORRIDORS'}
              </p>
              {segments.map((seg) => (
                <button
                  key={seg.id}
                  type="button"
                  onClick={() => onSelectSegment(seg)}
                  className="rounded-[14px] bg-[#f3f4ef] hover:bg-[#eceee6] p-[12px] flex items-start justify-between gap-[10px] text-left transition"
                >
                  <div className="flex flex-col gap-[2px]">
                    <span className="font-['Plus_Jakarta_Sans:SemiBold'] font-semibold text-[15px] text-[#191b14]">
                      {seg.name}
                    </span>
                    <span className="font-['Plus_Jakarta_Sans:Regular'] text-[13px] text-[#5d6157]">
                      {seg.address}
                    </span>
                  </div>
                  <span
                    className={`shrink-0 rounded-full px-[10px] py-[3px] font-['Plus_Jakarta_Sans:SemiBold'] text-[12px] text-white ${
                      seg.hazardType === 'landslide'
                        ? 'bg-[#991b1b]'
                        : seg.hazardType === 'flash-flood'
                          ? 'bg-[#c2410c]'
                          : seg.riskStatus === 'avoid'
                            ? 'bg-[#b91c1c]'
                            : 'bg-[#d97706]'
                    }`}
                  >
                    {seg.hazardType === 'landslide'
                      ? lang === 'vi'
                        ? 'Sạt lở'
                        : 'Landslide'
                      : seg.hazardType === 'flash-flood'
                        ? lang === 'vi'
                          ? 'Lũ quét'
                          : 'Flash flood'
                        : seg.riskStatus === 'avoid'
                          ? lang === 'vi'
                            ? 'Tránh'
                            : 'Avoid'
                          : lang === 'vi'
                            ? 'Cẩn trọng'
                            : 'Caution'}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-[16px] w-full">
            <div
              data-gsap="stagger"
              className="bg-[#fff3e6] border-[#f5c38a] border-[1.5px] flex flex-col gap-[6px] px-[16px] py-[14px] rounded-[20px] w-full"
            >
              <p className="font-['Plus_Jakarta_Sans:SemiBold'] font-semibold text-[#9a3412] text-[12px] tracking-[0.78px] uppercase">
                {lang === 'vi' ? ' SỐ LIỆU ĐO ĐẠC & DỰ BÁO TRỰC TIẾP' : 'LIVE TELEMETRY BULLETIN'}
              </p>
              <p className="font-['Plus_Jakarta_Sans:Regular'] leading-[24px] text-[#191b14] text-[15px]">
                {b ? (lang === 'vi' ? b.verbatimVi : b.verbatimEn) : '...'}
              </p>
            </div>

            {hazards ? (
              <div
                data-gsap="stagger"
                className="bg-white flex flex-col gap-[10px] p-[16px] rounded-[20px] shadow-[0px_4px_16px_rgba(26,28,20,0.06)] w-full"
              >
                <p className="font-['Plus_Jakarta_Sans:SemiBold'] font-semibold text-[#5d6157] text-[12px] tracking-[0.78px] uppercase">
                  {lang === 'vi'
                    ? 'BIỂU ĐỒ LƯỢNG MƯA DỰ BÁO 12 GIỜ TỚI (HÀ NỘI)'
                    : 'NEXT 12H PRECIPITATION FORECAST (HANOI)'}
                </p>
                <div className="flex items-end gap-[8px] h-[64px] pt-[6px]">
                  {hazards.weather.hourlySlice.slice(0, 8).map((slot, i) => {
                    const barH = Math.max(6, Math.min(48, Math.round(slot.precipMm * 4 + 6)))
                    return (
                      <div
                        key={`${slot.time}-${i}`}
                        className="flex-1 flex flex-col items-center justify-end gap-[4px]"
                      >
                        <div
                          className="w-full max-w-[24px] rounded-[6px] bg-[#2563eb]"
                          style={{ height: barH }}
                        />
                        <span className="font-['Plus_Jakarta_Sans:Regular'] text-[11px] text-[#5d6157]">
                          {slot.time.slice(0, 2)}h
                        </span>
                      </div>
                    )
                  })}
                </div>
              </div>
            ) : null}

            <div
              data-gsap="stagger"
              className="bg-[#eceee6] flex flex-col gap-[6px] px-[16px] py-[14px] rounded-[20px] w-full"
            >
              <p className="font-['Plus_Jakarta_Sans:SemiBold'] font-semibold text-[#5d6157] text-[12px] tracking-[0.78px] uppercase">
                {lang === 'vi' ? 'TÓM TẮT TÁC ĐỘNG GIAO THÔNG' : 'ROUTING IMPACT SUMMARY'}
              </p>
              <p className="font-['Plus_Jakarta_Sans:Regular'] leading-[23px] text-[#191b14] text-[15px]">
                {b ? (lang === 'vi' ? b.summaryVi : b.summaryEn) : ''}
              </p>
            </div>

            <div
              data-gsap="stagger"
              className="bg-white flex flex-col gap-[6px] px-[16px] py-[14px] rounded-[20px] shadow-[0px_4px_16px_rgba(26,28,20,0.06)] w-full"
            >
              <p className="font-['Plus_Jakarta_Sans:SemiBold'] font-semibold text-[#5d6157] text-[12px] tracking-[0.78px] uppercase">
                {lang === 'vi' ? 'KHẨN CẤP' : 'EMERGENCY'}
              </p>
              <p className="font-['Plus_Jakarta_Sans:Bold'] font-bold leading-[25px] text-[#191b14] text-[17px]">
                {lang === 'vi'
                  ? '113 · 114 · 115. FloodScout không phải đơn vị cứu hộ.'
                  : '113 · 114 · 115. FloodScout is not a rescue service.'}
              </p>
              <p className="font-['Plus_Jakarta_Sans:Regular'] text-[#5d6157] text-[14px]">
                {lang === 'vi'
                  ? 'Đường dây nóng Phòng chống thiên tai Hà Nội: 024.3354.5190'
                  : 'Hanoi Disaster Management Hotline: 024.3354.5190'}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white border-t border-[#dfe1d8] flex flex-col items-center py-[14px] px-[16px] w-full">
        <div className="w-full max-w-md">
          <ButtonPrimary
            label={lang === 'vi' ? 'Mở cổng bản tin KTTV Quốc gia' : 'Open NCHMF bulletin portal'}
            onClick={() => setSourceModalOpen(true)}
          />
        </div>
      </div>

      {sourceModalOpen ? (
        <div
          onClick={() => setSourceModalOpen(false)}
          className="fixed inset-0 z-50 bg-black/45 flex items-end md:items-center justify-center p-0 md:p-6"
          style={{ paddingTop: topInset }}
        >
          <div
            ref={modalRef}
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-tl-[28px] rounded-tr-[28px] md:rounded-[28px] w-full max-w-[440px] p-[20px] pb-[96px] md:pb-[20px] flex flex-col gap-[12px]"
          >
            <p className="font-['Plus_Jakarta_Sans:SemiBold'] text-[12px] tracking-[0.78px] uppercase text-[#9a3412]">
              nchmf.gov.vn
            </p>
            <h3 className="font-['Plus_Jakarta_Sans:Bold'] font-bold text-[19px] text-[#191b14]">
              {lang === 'vi'
                ? 'Trung tâm Dự báo Khí tượng Thủy văn Quốc gia'
                : 'National Center for Hydro-Meteorological Forecasting'}
            </h3>
            <p className="font-['Plus_Jakarta_Sans:Regular'] text-[15px] leading-[22px] text-[#5d6157]">
              {lang === 'vi'
                ? 'Mở cổng thông tin chính thức nchmf.gov.vn để xem bản tin mưa lớn, lũ quét và sạt lở đất mới nhất.'
                : 'Opens the official nchmf.gov.vn portal for authoritative flood, flash-flood, and landslide bulletins.'}
            </p>
            <div className="flex gap-[10px] pt-[4px]">
              <button
                type="button"
                onClick={() => setSourceModalOpen(false)}
                className="flex-1 min-h-[46px] rounded-[999px] border-[1.5px] border-[#dfe1d8] font-['Plus_Jakarta_Sans:SemiBold'] text-[15px] text-[#191b14]"
              >
                {lang === 'vi' ? 'Đóng' : 'Close'}
              </button>
              <a
                href="https://nchmf.gov.vn"
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setSourceModalOpen(false)}
                className="flex-1 min-h-[46px] rounded-[999px] bg-[#191b14] flex items-center justify-center font-['Plus_Jakarta_Sans:Bold'] text-[15px] text-white"
              >
                nchmf.gov.vn
              </a>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}
