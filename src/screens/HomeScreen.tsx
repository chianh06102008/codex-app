import React, { useState } from "react";
import { ASSETS } from "../assets";
import { FloodMapCanvas } from "../components/FloodMapCanvas";
import {
  MicButton,
  NavBottomBar,
  StatusBandDegraded,
  StatusBandFull,
  ToggleSwitch,
} from "../components/SharedPrimitives";
import type { Language, ScreenId } from "../types";

interface HomeScreenProps {
  lang: Language;
  onToggleLanguage: () => void;
  officialFeedDegraded: boolean;
  onChangeOfficialFeedDegraded: (next: boolean) => void;
  showCrowdLayer: boolean;
  onChangeShowCrowdLayer: (next: boolean) => void;
  latestReportTag: string;
  onNavigate: (screen: ScreenId) => void;
  onQuickAskDestination: (dest: string) => void;
}

const LEGEND_ITEMS = [
  {
    id: "avoid",
    icon: ASSETS.dotAvoid,
    labelVi: "Tránh",
    labelEn: "Avoid",
    descVi:
      "Có cảnh báo ngập sâu hoặc báo cáo ngang bánh xe trở lên. Không gợi ý cho xe máy và đi bộ.",
    descEn:
      "Severe flood warning or wheel-deep crowd reports. Excluded from motorbike and walking suggestions.",
  },
  {
    id: "caution",
    icon: ASSETS.dotCaution,
    labelVi: "Không nên đi",
    labelEn: "Do not enter if avoidable",
    descVi: "Có nước trên mặt đường hoặc cảnh báo khu vực đang hiệu lực.",
    descEn: "Standing water reported or area-wide official warning in force.",
  },
  {
    id: "unknown",
    icon: ASSETS.dotUnknown,
    labelVi: "Chưa rõ",
    labelEn: "Unclear",
    descVi: "Chưa đủ căn cứ hoặc mất kết nối bản tin chính thức. Không coi là an toàn.",
    descEn: "Insufficient evidence or official feed unavailable. Never treated as safe.",
  },
  {
    id: "none",
    icon: ASSETS.dotNoAdverse,
    labelVi: "Chưa thấy dấu hiệu bất lợi",
    labelEn: "No adverse signs seen",
    descVi: "Chưa có báo cáo ngập gần đây. Đây không phải xác nhận an toàn.",
    descEn: "No recent flood reports nearby. This is not a safety guarantee.",
  },
] as const;

export function HomeScreen({
  lang,
  onToggleLanguage,
  officialFeedDegraded,
  onChangeOfficialFeedDegraded,
  showCrowdLayer,
  onChangeShowCrowdLayer,
  latestReportTag,
  onNavigate,
  onQuickAskDestination,
}: HomeScreenProps) {
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [layersOpen, setLayersOpen] = useState(false);
  const [selectedLegendId, setSelectedLegendId] = useState<string | null>(null);
  const [voiceListening, setVoiceListening] = useState(false);

  const selectedLegend = LEGEND_ITEMS.find((item) => item.id === selectedLegendId);

  const handleZoomIn = () => setZoom((z) => Math.min(1.6, Number((z + 0.2).toFixed(2))));
  const handleZoomOut = () => setZoom((z) => Math.max(0.8, Number((z - 0.2).toFixed(2))));
  const handleLocate = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  const handleMicTap = () => {
    setVoiceListening(true);
    window.setTimeout(() => {
      setVoiceListening(false);
      onQuickAskDestination("Biblio");
    }, 650);
  };

  return (
    <div
      className="bg-[#ecede6] relative w-full min-h-dvh overflow-hidden flex flex-col justify-between"
      data-name="S1 Home — Bản đồ"
    >
      {/* Interactive Map Base & Street Overlays */}
      <FloodMapCanvas
        variant={officialFeedDegraded ? "home-degraded" : "home"}
        zoom={zoom}
        pan={pan}
        onPanChange={setPan}
        showCrowdLayer={showCrowdLayer}
        lang={lang}
        latestReportTag={latestReportTag}
        onOpenSegment={() => onNavigate("segment")}
        onTapDestination={() => onQuickAskDestination("Biblio")}
      />

      {/* Top Overlay: App Bar + Official Status First + Legend Chips + Demo Badge */}
      <div className="relative z-10 pointer-events-none flex flex-col items-start pt-[16px] w-full">
        <div
          className="pointer-events-auto flex flex-col gap-[10px] items-start px-[16px] w-full md:max-w-[430px]"
          data-name="Top overlay (official status first)"
        >
          <div
            className="flex items-center justify-between relative shrink-0 w-full"
            data-name="App bar"
          >
            <div
              className="bg-white flex items-center min-h-[48px] px-[18px] relative rounded-[999px] shadow-[0px_8px_24px_0px_rgba(26,28,20,0.14)] shrink-0"
              data-name="Wordmark"
            >
              <span className="[word-break:break-word] font-['Plus_Jakarta_Sans:ExtraBold'] font-extrabold leading-[28px] relative shrink-0 text-[#191b14] text-[22px] tracking-[-0.44px] whitespace-nowrap">
                FloodScout
              </span>
            </div>

            <button
              type="button"
              onClick={onToggleLanguage}
              aria-label={
                lang === "vi" ? "Đổi ngôn ngữ sang tiếng Anh" : "Switch language to Vietnamese"
              }
              className="bg-white flex items-center justify-center min-h-[48px] px-[18px] relative rounded-[999px] shadow-[0px_8px_24px_0px_rgba(26,28,20,0.14)] shrink-0 transition-transform active:scale-95"
              data-name="Language switch"
            >
              <span className="[word-break:break-word] font-['Plus_Jakarta_Sans:SemiBold'] font-semibold leading-[24px] relative shrink-0 text-[#191b14] text-[16px] whitespace-nowrap">
                VI · EN
              </span>
            </button>
          </div>

          {officialFeedDegraded ? (
            <StatusBandDegraded lang={lang} onOpenBulletin={() => onNavigate("warning")} />
          ) : (
            <StatusBandFull lang={lang} onOpenBulletin={() => onNavigate("warning")} />
          )}
        </div>

        {/* Legend Chips (Horizontal Scroll) */}
        <div
          className="pointer-events-auto mt-[10px] w-full overflow-x-auto no-scrollbar px-[16px] py-[2px]"
          data-name="Legend chips (scroll)"
        >
          <div className="flex gap-[8px] items-start w-max" data-name="Chips">
            {LEGEND_ITEMS.map((chip) => {
              const isSelected = selectedLegendId === chip.id;
              return (
                <button
                  key={chip.id}
                  type="button"
                  onClick={() => setSelectedLegendId((prev) => (prev === chip.id ? null : chip.id))}
                  className={`bg-white flex gap-[8px] items-center min-h-[40px] pl-[14px] pr-[16px] relative rounded-[999px] shadow-[0px_4px_16px_0px_rgba(26,28,20,0.06)] shrink-0 transition ${
                    isSelected ? "ring-2 ring-[#191b14]" : "hover:bg-[#fafaf7]"
                  }`}
                >
                  <span className="flex items-center justify-center relative shrink-0 size-[10px]">
                    <img alt="" className="block max-w-none shrink-0" src={chip.icon} />
                  </span>
                  <span className="[word-break:break-word] font-['Plus_Jakarta_Sans:SemiBold'] font-semibold leading-[20px] relative shrink-0 text-[#191b14] text-[14px] whitespace-nowrap">
                    {lang === "vi" ? chip.labelVi : chip.labelEn}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {selectedLegend && (
          <div className="pointer-events-auto mx-[16px] mt-[8px] max-w-[358px] rounded-[16px] bg-white/95 px-[14px] py-[10px] shadow-[0px_8px_24px_rgba(26,28,20,0.14)]">
            <p className="font-['Plus_Jakarta_Sans:Regular'] text-[14px] leading-[20px] text-[#191b14]">
              {lang === "vi" ? selectedLegend.descVi : selectedLegend.descEn}
            </p>
          </div>
        )}

        {/* Demo Data Pill (Left) */}
        <div className="pointer-events-auto mt-[10px] pl-[12px]">
          <button
            type="button"
            onClick={() => setLayersOpen(true)}
            className="bg-[#191b14] flex items-start px-[12px] py-[6px] relative rounded-[999px] transition-transform active:scale-95"
            data-name="Badge/Demo data"
          >
            <span className="[word-break:break-word] font-['Plus_Jakarta_Sans:SemiBold'] font-semibold leading-[20px] relative shrink-0 text-[14px] text-white whitespace-nowrap">
              {lang === "vi" ? "Dữ liệu demo" : "Demo data"}
            </span>
          </button>
        </div>
      </div>

      {/* Floating Map Controls (Zoom + Layers + Locate) */}
      <div
        className="absolute right-[16px] md:right-[24px] top-[316px] md:top-[24px] z-10 flex flex-col gap-[12px] items-end"
        data-name="Map controls"
      >
        <div
          className="bg-white drop-shadow-[0px_8px_12px_rgba(26,28,20,0.14)] flex flex-col items-start relative rounded-[16px] overflow-hidden"
          data-name="Map/Zoom"
        >
          <button
            type="button"
            onClick={handleZoomIn}
            aria-label={lang === "vi" ? "Phóng to" : "Zoom in"}
            className="flex items-center justify-center relative shrink-0 size-[48px] hover:bg-[#f5f6f1] active:bg-[#eceee6]"
            data-name="Button/plus"
          >
            <span className="flex items-center justify-center relative shrink-0 size-[22px]">
              <img alt="" className="block max-w-none shrink-0" src={ASSETS.iconPlus} />
            </span>
          </button>
          <button
            type="button"
            onClick={handleZoomOut}
            aria-label={lang === "vi" ? "Thu nhỏ" : "Zoom out"}
            className="flex items-center justify-center relative shrink-0 size-[48px] hover:bg-[#f5f6f1] active:bg-[#eceee6]"
            data-name="Button/minus"
          >
            <span className="flex items-center justify-center relative shrink-0 size-[22px]">
              <img alt="" className="block max-w-none shrink-0" src={ASSETS.iconMinus} />
            </span>
          </button>
        </div>

        <button
          type="button"
          onClick={() => setLayersOpen(true)}
          aria-label={lang === "vi" ? "Lớp bản đồ và kịch bản demo" : "Map layers and demo states"}
          className="bg-white drop-shadow-[0px_8px_12px_rgba(26,28,20,0.14)] flex items-center justify-center relative rounded-[16px] size-[48px] hover:bg-[#f5f6f1] active:scale-95 transition-transform"
          data-name="Map/Layers button"
        >
          <span className="flex items-center justify-center relative shrink-0 size-[22px]">
            <img alt="" className="block max-w-none shrink-0" src={ASSETS.iconLayers} />
          </span>
        </button>

        <button
          type="button"
          onClick={handleLocate}
          aria-label={
            lang === "vi" ? "Đưa bản đồ về vị trí của bạn" : "Center map on your location"
          }
          className="bg-white drop-shadow-[0px_8px_12px_rgba(26,28,20,0.14)] flex items-center justify-center relative rounded-[16px] size-[48px] hover:bg-[#f5f6f1] active:scale-95 transition-transform"
          data-name="Map/Locate button"
        >
          <span className="flex items-center justify-center relative shrink-0 size-[22px]">
            <img alt="" className="block max-w-none shrink-0" src={ASSETS.iconLocate} />
          </span>
        </button>
      </div>

      {/* Spacer so map stays tall on short viewports */}
      <div className="min-h-[210px] flex-1 pointer-events-none" />

      {/* Bottom Sheet */}
      <div
        className="relative z-20 bg-white drop-shadow-[0px_-6px_12px_rgba(26,28,20,0.1)] flex flex-col gap-[14px] items-center pb-[16px] pt-[10px] px-[16px] rounded-tl-[28px] rounded-tr-[28px] md:rounded-[28px] md:m-[16px] w-full md:max-w-[430px]"
        data-name="Bottom sheet"
      >
        <div
          className="bg-[#dfe1d8] h-[5px] relative rounded-[3px] shrink-0 w-[40px]"
          data-name="Grabber"
        />

        <div
          className="[word-break:break-word] flex flex-col gap-[2px] items-start relative shrink-0 w-full"
          data-name="Heading"
        >
          <h2 className="font-['Plus_Jakarta_Sans:Bold'] font-bold leading-[28px] relative shrink-0 text-[#191b14] text-[20px] tracking-[-0.2px] w-full">
            {lang === "vi" ? "Đi đường này?" : "Take this route?"}
          </h2>
          <p className="font-['Plus_Jakarta_Sans:Regular'] font-normal leading-[20px] relative shrink-0 text-[#5d6157] text-[14px] w-full">
            {voiceListening
              ? lang === "vi"
                ? "Đang nghe điểm đến của bạn..."
                : "Listening for your destination..."
              : lang === "vi"
                ? "Chưa thấy dấu hiệu bất lợi gần đây. Đây không phải xác nhận an toàn."
                : "No recent adverse signs nearby. This is not a safety confirmation."}
          </p>
        </div>

        {/* Search / Destination Pill */}
        <div
          className="bg-[#eceee6] flex gap-[12px] h-[60px] items-center pl-[18px] pr-[6px] py-[6px] relative rounded-[999px] shrink-0 w-full"
          data-name="Search/Destination"
        >
          <button
            type="button"
            onClick={() => onNavigate("ask")}
            className="flex flex-1 gap-[12px] items-center min-w-0 h-full text-left"
          >
            <span
              className="flex items-center justify-center relative shrink-0 size-[22px]"
              data-name="icon/search"
            >
              <img alt="" className="block max-w-none shrink-0" src={ASSETS.iconSearch} />
            </span>
            <span className="[word-break:break-word] flex-1 font-['Plus_Jakarta_Sans:Regular'] font-normal leading-[24px] min-w-0 relative text-[#5d6157] text-[16px] truncate">
              {lang === "vi" ? "Nhập hoặc nói điểm đến" : "Enter or speak destination"}
            </span>
          </button>
          <MicButton size={48} lang={lang} isRecording={voiceListening} onClick={handleMicTap} />
        </div>

        <NavBottomBar activeTab="home" onNavigate={onNavigate} lang={lang} />
      </div>

      {/* Map Layers & Demo Scenarios Sheet (F14) */}
      {layersOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/40 flex items-end md:items-center justify-center p-0 md:p-6"
          onClick={() => setLayersOpen(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-tl-[28px] rounded-tr-[28px] md:rounded-[28px] w-full max-w-[460px] p-[20px] flex flex-col gap-[16px] shadow-[0px_8px_24px_rgba(26,28,20,0.2)] max-h-[88dvh] overflow-y-auto"
          >
            <div className="flex items-center justify-between">
              <h3 className="font-['Plus_Jakarta_Sans:Bold'] font-bold text-[20px] leading-[28px] text-[#191b14]">
                {lang === "vi" ? "Lớp bản đồ & Dữ liệu demo" : "Map layers & Demo states"}
              </h3>
              <button
                type="button"
                onClick={() => setLayersOpen(false)}
                className="font-['Plus_Jakarta_Sans:SemiBold'] text-[15px] text-[#5d6157] px-[12px] py-[6px] rounded-[999px] bg-[#eceee6]"
              >
                {lang === "vi" ? "Đóng" : "Close"}
              </button>
            </div>

            {/* Official Warning Layer (Locked ON per F14) */}
            <div className="rounded-[20px] bg-[#fff3e6] border border-[#c2410c] px-[16px] py-[12px] flex flex-col gap-[4px]">
              <div className="flex items-center justify-between gap-[12px]">
                <p className="font-['Plus_Jakarta_Sans:SemiBold'] font-semibold text-[16px] leading-[24px] text-[#191b14]">
                  {lang === "vi" ? "Cảnh báo chính thức" : "Official warning layer"}
                </p>
                <span className="rounded-[999px] bg-[#9a3412] px-[10px] py-[2px] font-['Plus_Jakarta_Sans:SemiBold'] text-[12px] text-white">
                  {lang === "vi" ? "Luôn bật" : "Locked on"}
                </span>
              </div>
              <p className="font-['Plus_Jakarta_Sans:Regular'] text-[14px] leading-[20px] text-[#5d6157]">
                {lang === "vi"
                  ? "Không có nút tắt khi cảnh báo đang có hiệu lực."
                  : "Cannot be turned off while an official warning is in force."}
              </p>
            </div>

            {/* Crowd Reports Layer Toggle */}
            <div className="rounded-[20px] bg-[#f3f4ef] px-[16px] py-[10px] flex items-center justify-between gap-[12px]">
              <div className="flex flex-col">
                <p className="font-['Plus_Jakarta_Sans:SemiBold'] font-semibold text-[16px] leading-[24px] text-[#191b14]">
                  {lang === "vi" ? "Báo cáo của người dân" : "Crowd flood reports"}
                </p>
                <p className="font-['Plus_Jakarta_Sans:Regular'] text-[14px] leading-[20px] text-[#5d6157]">
                  {lang === "vi"
                    ? "Vệt xanh dương trên đường ngập đã báo"
                    : "Blue street bands for recent crowd reports"}
                </p>
              </div>
              <ToggleSwitch
                checked={showCrowdLayer}
                onChange={onChangeShowCrowdLayer}
                label={lang === "vi" ? "Báo cáo của người dân" : "Crowd reports"}
                lang={lang}
              />
            </div>

            {/* Degraded Feed Simulation */}
            <div className="rounded-[20px] bg-[#f3f4ef] px-[16px] py-[10px] flex items-center justify-between gap-[12px]">
              <div className="flex flex-col">
                <p className="font-['Plus_Jakarta_Sans:SemiBold'] font-semibold text-[16px] leading-[24px] text-[#191b14]">
                  {lang === "vi"
                    ? "Mất kết nối bản tin chính thức"
                    : "Simulate official feed outage"}
                </p>
                <p className="font-['Plus_Jakarta_Sans:Regular'] text-[14px] leading-[20px] text-[#5d6157]">
                  {lang === "vi"
                    ? "Hiển thị trạng thái không lấy được bản tin"
                    : "Show degraded official status banner & map"}
                </p>
              </div>
              <ToggleSwitch
                checked={officialFeedDegraded}
                onChange={onChangeOfficialFeedDegraded}
                label={lang === "vi" ? "Mất kết nối bản tin chính thức" : "Official feed outage"}
                lang={lang}
              />
            </div>

            {/* Quick Jump to All Demo Screens */}
            <div className="flex flex-col gap-[8px]">
              <p className="font-['Plus_Jakarta_Sans:SemiBold'] text-[13px] leading-[18px] tracking-[0.78px] uppercase text-[#5d6157]">
                {lang === "vi" ? "Xem nhanh các màn hình" : "Quick screen scenarios"}
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-[8px]">
                <button
                  type="button"
                  onClick={() => {
                    setLayersOpen(false);
                    onNavigate("route-found");
                  }}
                  className="rounded-[14px] border border-[#dfe1d8] bg-white px-[14px] py-[10px] text-left font-['Plus_Jakarta_Sans:SemiBold'] text-[14px] text-[#191b14] hover:bg-[#f3f4ef]"
                >
                  {lang === "vi" ? "Kết quả: Tuyến tránh ngập" : "Result: Detour route"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setLayersOpen(false);
                    onNavigate("route-blocked");
                  }}
                  className="rounded-[14px] border border-[#dfe1d8] bg-white px-[14px] py-[10px] text-left font-['Plus_Jakarta_Sans:SemiBold'] text-[14px] text-[#191b14] hover:bg-[#f3f4ef]"
                >
                  {lang === "vi" ? "Kết quả: Không gợi ý đường" : "Result: No route"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setLayersOpen(false);
                    onNavigate("segment");
                  }}
                  className="rounded-[14px] border border-[#dfe1d8] bg-white px-[14px] py-[10px] text-left font-['Plus_Jakarta_Sans:SemiBold'] text-[14px] text-[#191b14] hover:bg-[#f3f4ef]"
                >
                  {lang === "vi" ? "Đoạn đường: Nguyễn Trãi" : "Segment: Nguyễn Trãi"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setLayersOpen(false);
                    onNavigate("speed-gate");
                  }}
                  className="rounded-[14px] border border-[#dfe1d8] bg-[#191b14] px-[14px] py-[10px] text-left font-['Plus_Jakarta_Sans:SemiBold'] text-[14px] text-white hover:opacity-90"
                >
                  {lang === "vi" ? "Đang chạy >15 km/h (Dừng xe)" : "Moving >15 km/h gate"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
