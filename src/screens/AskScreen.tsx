import React from "react";
import { ButtonPrimary, HeaderBack, StatusBandCompact } from "../components/SharedPrimitives";
import type { Language, ScreenId, TravelMode } from "../types";

interface AskScreenProps {
  lang: Language;
  origin: string;
  onChangeOrigin: (val: string) => void;
  destination: string;
  onChangeDestination: (val: string) => void;
  travelMode: TravelMode;
  onChangeTravelMode: (mode: TravelMode) => void;
  onBack: () => void;
  onOpenBulletin: () => void;
  onSubmitRoute: (targetScreen: ScreenId) => void;
}

export function AskScreen({
  lang,
  origin,
  onChangeOrigin,
  destination,
  onChangeDestination,
  travelMode,
  onChangeTravelMode,
  onBack,
  onOpenBulletin,
  onSubmitRoute,
}: AskScreenProps) {
  const modes: Array<{ id: TravelMode; labelVi: string; labelEn: string }> = [
    { id: "motorbike", labelVi: "Xe máy", labelEn: "Motorbike" },
    { id: "walk", labelVi: "Đi bộ", labelEn: "Walk" },
    { id: "car", labelVi: "Ô tô", labelEn: "Car" },
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const normalized = destination.trim().toLowerCase();
    // Destinations where all mapped paths cross flooded segments open the No-Route screen
    if (
      normalized.includes("nguyễn trãi") ||
      normalized.includes("nguyen trai") ||
      normalized.includes("kon tum")
    ) {
      onSubmitRoute("route-blocked");
    } else {
      onSubmitRoute("route-found");
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-[#f3f4ef] flex flex-col min-h-dvh w-full justify-between"
      data-name="S3 Ask — Đi đường này?"
    >
      <div className="w-full max-w-3xl mx-auto flex-1 flex flex-col">
        {/* Top */}
        <div
          className="flex flex-col gap-[14px] items-start pb-[4px] pt-[16px] px-[16px] md:px-6 w-full"
          data-name="Top"
        >
          <HeaderBack
            title={lang === "vi" ? "Hỏi về một nơi đến" : "Ask about a destination"}
            showSubtitle={false}
            onBack={onBack}
            lang={lang}
          />
          <StatusBandCompact lang={lang} onOpenBulletin={onOpenBulletin} />
        </div>

        {/* Form Fields */}
        <div
          className="flex flex-1 flex-col gap-[18px] items-start p-[16px] md:px-6 w-full"
          data-name="Form"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-[18px] w-full">
            {/* Field/Từ */}
            <label
              className="flex flex-col gap-[8px] items-start relative shrink-0 w-full"
              data-name="Field/Từ"
            >
              <span className="[word-break:break-word] font-['Plus_Jakarta_Sans:SemiBold'] font-semibold leading-[24px] relative shrink-0 text-[#191b14] text-[16px] whitespace-nowrap">
                {lang === "vi" ? "Từ" : "From"}
              </span>
              <input
                type="text"
                value={origin}
                onChange={(e) => onChangeOrigin(e.target.value)}
                className="bg-white border-[#dfe1d8] border-[1.5px] border-solid flex items-center min-h-[56px] px-[16px] relative rounded-[999px] shrink-0 w-full font-['Plus_Jakarta_Sans:Regular'] font-normal leading-[24px] text-[#191b14] text-[16px] outline-none focus:border-[#191b14]"
              />
            </label>

            {/* Field/Đến */}
            <label
              className="flex flex-col gap-[8px] items-start relative shrink-0 w-full"
              data-name="Field/Đến"
            >
              <span className="[word-break:break-word] font-['Plus_Jakarta_Sans:SemiBold'] font-semibold leading-[24px] relative shrink-0 text-[#191b14] text-[16px] whitespace-nowrap">
                {lang === "vi" ? "Đến" : "To"}
              </span>
              <input
                type="text"
                value={destination}
                onChange={(e) => onChangeDestination(e.target.value)}
                placeholder="Biblio"
                className="bg-white border-[#dfe1d8] border-[1.5px] border-solid flex items-center min-h-[56px] px-[16px] relative rounded-[999px] shrink-0 w-full font-['Plus_Jakarta_Sans:Regular'] font-normal leading-[24px] text-[#191b14] text-[16px] outline-none focus:border-[#191b14]"
              />
            </label>
          </div>

          {/* Mode selector */}
          <div
            className="flex flex-col gap-[8px] items-start relative shrink-0 w-full"
            data-name="Mode"
          >
            <p className="[word-break:break-word] font-['Plus_Jakarta_Sans:SemiBold'] font-semibold leading-[24px] relative shrink-0 text-[#191b14] text-[16px] whitespace-nowrap">
              {lang === "vi" ? "Phương tiện" : "Mode"}
            </p>
            <div
              role="radiogroup"
              aria-label={lang === "vi" ? "Phương tiện" : "Travel mode"}
              className="bg-[#eceee6] flex gap-[6px] items-start p-[6px] relative rounded-[20px] shrink-0 w-full"
              data-name="Mode selector"
            >
              {modes.map((m) => {
                const selected = travelMode === m.id;
                return (
                  <button
                    key={m.id}
                    type="button"
                    role="radio"
                    aria-checked={selected}
                    onClick={() => onChangeTravelMode(m.id)}
                    className={`flex flex-1 items-center justify-center min-h-[48px] min-w-0 py-[12px] relative rounded-[12px] transition ${
                      selected
                        ? "bg-white shadow-[0px_2px_8px_0px_rgba(18,23,38,0.1)]"
                        : "hover:bg-white/40"
                    }`}
                  >
                    <span
                      className={`[word-break:break-word] font-['Plus_Jakarta_Sans:SemiBold'] font-semibold leading-[24px] relative shrink-0 text-[16px] whitespace-nowrap ${
                        selected ? "text-[#191b14]" : "text-[#5d6157]"
                      }`}
                    >
                      {lang === "vi" ? m.labelVi : m.labelEn}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Unmapped caveat (F45) */}
          <div
            className="[word-break:break-word] bg-[#eceee6] flex flex-col gap-[4px] items-start leading-[24px] px-[16px] py-[14px] relative rounded-[20px] shrink-0 text-[16px] w-full"
            data-name="Unmapped caveat (F45)"
          >
            <p className="font-['Plus_Jakarta_Sans:SemiBold'] font-semibold relative shrink-0 text-[#191b14] w-full">
              {lang === "vi"
                ? "Chỉ dùng đường có trên bản đồ. Hẻm có thể không có trong gợi ý."
                : "Only mapped streets are used. Narrow alleys may not appear in suggestions."}
            </p>
            <p className="font-['Plus_Jakarta_Sans:Regular'] font-normal relative shrink-0 text-[#5d6157] w-full">
              {lang === "vi"
                ? "Nếu mọi đường đều qua đoạn cần tránh, FloodScout sẽ không gợi ý đường nào."
                : "If every path crosses a segment to avoid, FloodScout suggests no route."}
            </p>
          </div>
        </div>
      </div>

      {/* Action Bar */}
      <div
        className="bg-white border-[#dfe1d8] border-solid border-t flex flex-col items-center pb-[20px] pt-[16px] px-[16px] md:px-6 w-full"
        data-name="Action bar"
      >
        <div className="w-full max-w-md">
          <ButtonPrimary
            label={lang === "vi" ? "Đi đường này?" : "Take this route?"}
            disabled={!destination.trim()}
            onClick={() => {
              const normalized = destination.trim().toLowerCase();
              if (
                normalized.includes("nguyễn trãi") ||
                normalized.includes("nguyen trai") ||
                normalized.includes("kon tum")
              ) {
                onSubmitRoute("route-blocked");
              } else {
                onSubmitRoute("route-found");
              }
            }}
          />
        </div>
      </div>
    </form>
  );
}
