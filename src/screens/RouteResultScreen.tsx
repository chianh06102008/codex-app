import React, { useState } from "react";
import { ASSETS } from "../assets";
import { FloodMapCanvas } from "../components/FloodMapCanvas";
import { ButtonPrimary, StatusBandCompact } from "../components/SharedPrimitives";
import { getTravelModeLabel } from "../i18n";
import type { Language, ScreenId, TravelMode } from "../types";

interface RouteResultScreenProps {
  mode: "route-found" | "route-blocked";
  lang: Language;
  destination: string;
  travelMode: TravelMode;
  onBack: () => void;
  onNavigate: (screen: ScreenId) => void;
}

export function RouteResultScreen({
  mode,
  lang,
  destination,
  travelMode,
  onBack,
  onNavigate,
}: RouteResultScreenProps) {
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const isFound = mode === "route-found";
  const destDisplay = destination.trim() || "Biblio";
  const modeLabel = getTravelModeLabel(travelMode, lang);

  return (
    <div
      className="bg-[#ecede6] relative w-full min-h-dvh overflow-hidden flex flex-col justify-between"
      data-name={isFound ? "S4a Result — Tuyến tránh" : "S4b Result — Không gợi ý đường"}
    >
      {/* Map Background */}
      <FloodMapCanvas
        variant={isFound ? "route-found" : "route-blocked"}
        pan={pan}
        onPanChange={setPan}
        lang={lang}
        destinationLabel={destDisplay}
        onOpenSegment={() => onNavigate("segment")}
      />

      {/* Top Floating Header Card + Compact Official Band + Demo Pill */}
      <div className="relative z-10 pointer-events-none flex flex-col gap-[10px] items-start pt-[16px] px-[16px] w-full md:max-w-[440px]">
        {/* Floating White Pill Back Header */}
        <div className="pointer-events-auto bg-white rounded-[24px] p-[6px] pr-[18px] shadow-[0px_8px_24px_rgba(26,28,20,0.14)] flex items-center gap-[12px] w-full">
          <button
            type="button"
            onClick={onBack}
            aria-label={lang === "vi" ? "Quay lại" : "Back"}
            className="bg-white shadow-[0px_4px_12px_rgba(26,28,20,0.12)] hover:bg-[#f8f9f5] flex items-center justify-center rounded-[18px] shrink-0 size-[48px] transition-transform active:scale-95"
          >
            <span className="flex items-center justify-center size-[24px]">
              <img alt="" className="block max-w-none shrink-0" src={ASSETS.iconChevronLeft} />
            </span>
          </button>
          <div className="flex flex-1 flex-col min-w-0">
            <h1 className="font-['Plus_Jakarta_Sans:Bold'] font-bold text-[20px] leading-[26px] tracking-[-0.2px] text-[#191b14] truncate">
              {lang === "vi" ? `Đến ${destDisplay}` : `To ${destDisplay}`}
            </h1>
            <p className="font-['Plus_Jakarta_Sans:Regular'] font-normal text-[15px] leading-[22px] text-[#5d6157] truncate">
              {lang === "vi"
                ? `Từ vị trí của bạn · ${modeLabel}`
                : `From your location · ${modeLabel}`}
            </p>
          </div>
        </div>

        <div className="pointer-events-auto w-full">
          <StatusBandCompact lang={lang} onOpenBulletin={() => onNavigate("warning")} />
        </div>

        <div
          className={`pointer-events-auto w-full flex ${isFound ? "justify-start" : "justify-end"}`}
        >
          <button
            type="button"
            onClick={() => onNavigate(isFound ? "route-blocked" : "route-found")}
            title={
              lang === "vi"
                ? "Nhấn để chuyển đổi kịch bản kết quả demo"
                : "Tap to toggle demo route outcome"
            }
            className="bg-[#191b14] flex items-start px-[12px] py-[6px] rounded-[999px] transition-transform active:scale-95"
          >
            <span className="font-['Plus_Jakarta_Sans:SemiBold'] font-semibold leading-[20px] text-[14px] text-white whitespace-nowrap">
              {lang === "vi" ? "Dữ liệu demo" : "Demo data"}
            </span>
          </button>
        </div>
      </div>

      {/* Map visible gap */}
      <div className="min-h-[155px] flex-1 pointer-events-none" />

      {/* Result Bottom Sheet */}
      <div className="relative z-20 bg-white drop-shadow-[0px_-6px_16px_rgba(26,28,20,0.12)] flex flex-col gap-[14px] items-start pb-[20px] pt-[10px] px-[16px] rounded-tl-[28px] rounded-tr-[28px] md:rounded-[28px] md:m-[16px] w-full md:max-w-[440px]">
        <div className="self-center bg-[#dfe1d8] h-[5px] rounded-[3px] shrink-0 w-[40px]" />

        {isFound ? (
          <>
            <h2 className="font-['Plus_Jakarta_Sans:ExtraBold'] font-extrabold text-[24px] leading-[30px] tracking-[-0.35px] text-[#191b14] w-full">
              {lang === "vi"
                ? "Có một tuyến tránh đoạn ngập đã biết"
                : "One detour avoids known flooded segments"}
            </h2>

            {/* 3 Stat Pills */}
            <div className="grid grid-cols-3 gap-[8px] w-full">
              <div className="bg-[#eceee6] rounded-[16px] px-[12px] py-[10px] flex flex-col justify-between gap-[4px]">
                <span className="font-['Plus_Jakarta_Sans:Regular'] text-[14px] leading-[18px] text-[#5d6157]">
                  {lang === "vi" ? "Đoạn đã tránh" : "Avoided"}
                </span>
                <span className="font-['Plus_Jakarta_Sans:Bold'] font-bold text-[20px] leading-[26px] text-[#191b14]">
                  1
                </span>
              </div>
              <div className="bg-[#eceee6] rounded-[16px] px-[12px] py-[10px] flex flex-col justify-between gap-[4px]">
                <span className="font-['Plus_Jakarta_Sans:Regular'] text-[14px] leading-[18px] text-[#5d6157]">
                  {lang === "vi" ? "Báo cáo mới nhất" : "Newest report"}
                </span>
                <span className="font-['Plus_Jakarta_Sans:Bold'] font-bold text-[20px] leading-[26px] text-[#191b14]">
                  {lang === "vi" ? "20 phút" : "20 min"}
                </span>
              </div>
              <div className="bg-[#eceee6] rounded-[16px] px-[12px] py-[10px] flex flex-col justify-between gap-[4px]">
                <span className="font-['Plus_Jakarta_Sans:Regular'] text-[14px] leading-[18px] text-[#5d6157]">
                  {lang === "vi" ? "Mức sàn" : "Official floor"}
                </span>
                <span className="font-['Plus_Jakarta_Sans:Bold'] font-bold text-[18px] leading-[24px] text-[#191b14]">
                  {lang === "vi" ? "Cảnh báo" : "Warning"}
                </span>
              </div>
            </div>

            {/* Safety Caveat */}
            <div className="bg-[#fff3e6] rounded-[18px] px-[16px] py-[14px] flex flex-col gap-[4px] w-full">
              <p className="font-['Plus_Jakarta_Sans:Bold'] font-bold text-[15px] leading-[22px] text-[#191b14]">
                {lang === "vi"
                  ? "Đây không phải xác nhận an toàn."
                  : "This is not a safety confirmation."}
              </p>
              <p className="font-['Plus_Jakarta_Sans:Regular'] text-[15px] leading-[22px] text-[#5d6157]">
                {lang === "vi"
                  ? "Hẻm nhỏ có thể không có trên bản đồ. Gặp nước thì dừng lại, không cố đi qua."
                  : "Small alleys may be unmapped. If you encounter water, stop and do not push through."}
              </p>
            </div>

            {/* Reasons */}
            <div className="flex flex-col gap-[10px] w-full">
              <h3 className="font-['Plus_Jakarta_Sans:Bold'] font-bold text-[18px] leading-[24px] text-[#191b14]">
                {lang === "vi" ? "Vì sao?" : "Why?"}
              </h3>
              <button
                type="button"
                onClick={() => onNavigate("segment")}
                className="flex gap-[10px] items-start text-left w-full hover:opacity-80"
              >
                <span className="mt-[6px] shrink-0 size-[10px]">
                  <img alt="" className="block max-w-none" src={ASSETS.dotAvoid} />
                </span>
                <span className="font-['Plus_Jakarta_Sans:Regular'] text-[15px] leading-[22px] text-[#191b14]">
                  {lang === "vi"
                    ? "Tránh đoạn đầu Nguyễn Trãi: báo cáo ngập ngang bánh xe, 20 phút trước."
                    : "Avoided Nguyễn Trãi entrance: wheel-deep flood report, 20 min ago."}
                </span>
              </button>
              <button
                type="button"
                onClick={() => onNavigate("warning")}
                className="flex gap-[10px] items-start text-left w-full hover:opacity-80"
              >
                <span className="mt-[6px] shrink-0 size-[10px]">
                  <img alt="" className="block max-w-none" src={ASSETS.dotCaution} />
                </span>
                <span className="font-['Plus_Jakarta_Sans:Regular'] text-[15px] leading-[22px] text-[#191b14]">
                  {lang === "vi"
                    ? "Cảnh báo mưa lớn chính thức đang áp dụng cho cả khu vực."
                    : "Official heavy-rain warning applies across the entire area."}
                </span>
              </button>
            </div>

            <ButtonPrimary
              label={lang === "vi" ? "Hỏi lại bằng giọng nói" : "Ask again by voice"}
              onClick={() => onNavigate("ask")}
            />
          </>
        ) : (
          <>
            <div className="flex flex-col gap-[4px] w-full">
              <h2 className="font-['Plus_Jakarta_Sans:ExtraBold'] font-extrabold text-[24px] leading-[30px] tracking-[-0.35px] text-[#191b14] w-full">
                {lang === "vi"
                  ? "FloodScout không gợi ý đường nào."
                  : "FloodScout suggests no route."}
              </h2>
              <p className="font-['Plus_Jakarta_Sans:Regular'] text-[16px] leading-[24px] text-[#5d6157]">
                {lang === "vi"
                  ? "Hãy ở lại và làm theo hướng dẫn chính thức."
                  : "Stay put and follow official guidance."}
              </p>
            </div>

            {/* 3 Stat Pills */}
            <div className="grid grid-cols-3 gap-[8px] w-full">
              <div className="bg-[#eceee6] rounded-[16px] px-[12px] py-[10px] flex flex-col justify-between gap-[4px]">
                <span className="font-['Plus_Jakarta_Sans:Regular'] text-[14px] leading-[18px] text-[#5d6157]">
                  {lang === "vi" ? "Đoạn cần tránh" : "Segments to avoid"}
                </span>
                <span className="font-['Plus_Jakarta_Sans:Bold'] font-bold text-[20px] leading-[26px] text-[#191b14]">
                  2
                </span>
              </div>
              <div className="bg-[#eceee6] rounded-[16px] px-[12px] py-[10px] flex flex-col justify-between gap-[4px]">
                <span className="font-['Plus_Jakarta_Sans:Regular'] text-[14px] leading-[18px] text-[#5d6157]">
                  {lang === "vi" ? "Báo cáo mới nhất" : "Newest report"}
                </span>
                <span className="font-['Plus_Jakarta_Sans:Bold'] font-bold text-[20px] leading-[26px] text-[#191b14]">
                  {lang === "vi" ? "20 phút" : "20 min"}
                </span>
              </div>
              <div className="bg-[#eceee6] rounded-[16px] px-[12px] py-[10px] flex flex-col justify-between gap-[4px]">
                <span className="font-['Plus_Jakarta_Sans:Regular'] text-[14px] leading-[18px] text-[#5d6157]">
                  {lang === "vi" ? "Mức sàn" : "Official floor"}
                </span>
                <span className="font-['Plus_Jakarta_Sans:Bold'] font-bold text-[18px] leading-[24px] text-[#191b14]">
                  {lang === "vi" ? "Cảnh báo" : "Warning"}
                </span>
              </div>
            </div>

            {/* Bulletin Guidance */}
            <div className="bg-[#fff3e6] border-[#f5c38a] border-[1.5px] rounded-[20px] px-[16px] py-[14px] flex flex-col gap-[4px] w-full">
              <p className="font-['Plus_Jakarta_Sans:SemiBold'] font-semibold text-[13px] leading-[18px] tracking-[0.78px] uppercase text-[#9a3412]">
                {lang === "vi" ? "Hướng dẫn trong bản tin" : "Guidance in bulletin"}
              </p>
              <p className="font-['Plus_Jakarta_Sans:Regular'] text-[16px] leading-[24px] text-[#191b14]">
                {lang === "vi"
                  ? "[Trích nguyên văn hướng dẫn từ bản tin chính thức]"
                  : "[Verbatim guidance excerpt from official bulletin]"}
              </p>
            </div>

            {/* Reasons */}
            <div className="flex flex-col gap-[10px] w-full">
              <h3 className="font-['Plus_Jakarta_Sans:Bold'] font-bold text-[18px] leading-[24px] text-[#191b14]">
                {lang === "vi" ? "Vì sao?" : "Why?"}
              </h3>
              <button
                type="button"
                onClick={() => onNavigate("segment")}
                className="flex gap-[10px] items-start text-left w-full hover:opacity-80"
              >
                <span className="mt-[6px] shrink-0 size-[10px]">
                  <img alt="" className="block max-w-none" src={ASSETS.dotAvoid} />
                </span>
                <span className="font-['Plus_Jakarta_Sans:Regular'] text-[15px] leading-[22px] text-[#191b14]">
                  {lang === "vi"
                    ? "Nguyễn Trãi: báo cáo ngập ngang bánh xe, 20 phút trước."
                    : "Nguyễn Trãi: wheel-deep flood report, 20 min ago."}
                </span>
              </button>
              <button
                type="button"
                onClick={() => onNavigate("segment")}
                className="flex gap-[10px] items-start text-left w-full hover:opacity-80"
              >
                <span className="mt-[6px] shrink-0 size-[10px]">
                  <img alt="" className="block max-w-none" src={ASSETS.dotAvoid} />
                </span>
                <span className="font-['Plus_Jakarta_Sans:Regular'] text-[15px] leading-[22px] text-[#191b14]">
                  {lang === "vi"
                    ? "Nguyễn Như Kon Tum: báo cáo ngập ngang bánh xe, 35 phút trước."
                    : "Nguyễn Như Kon Tum: wheel-deep flood report, 35 min ago."}
                </span>
              </button>
            </div>

            <ButtonPrimary
              label={lang === "vi" ? "Xem hướng dẫn chính thức" : "View official guidance"}
              onClick={() => onNavigate("warning")}
            />

            <p className="font-['Plus_Jakarta_Sans:Regular'] text-[13px] leading-[18px] text-[#5d6157] text-center w-full">
              {lang === "vi"
                ? "Khẩn cấp: 113 · 114 · 115. FloodScout không phải đơn vị cứu hộ."
                : "Emergency: 113 · 114 · 115. FloodScout is not a rescue service."}
            </p>
          </>
        )}
      </div>
    </div>
  );
}
