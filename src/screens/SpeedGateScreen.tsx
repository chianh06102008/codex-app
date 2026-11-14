import React, { useEffect } from "react";
import { ASSETS } from "../assets";
import { StatusBandCompact } from "../components/SharedPrimitives";
import type { Language } from "../types";

interface SpeedGateScreenProps {
  lang: Language;
  onStopped: () => void;
  onOpenBulletin: () => void;
}

export function SpeedGateScreen({ lang, onStopped, onOpenBulletin }: SpeedGateScreenProps) {
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onStopped();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onStopped]);

  return (
    <div
      className="bg-[#191b14] flex flex-col items-center justify-between pb-[32px] pt-[16px] px-[16px] md:px-6 relative min-h-dvh w-full"
      data-name="Speed gate — Dừng xe (P7)"
    >
      <div className="w-full max-w-md">
        <StatusBandCompact lang={lang} onOpenBulletin={onOpenBulletin} />
      </div>

      <button
        type="button"
        onClick={onStopped}
        aria-label={
          lang === "vi"
            ? "Dừng xe trước khi xem tiếp. Nhấn khi đã dừng xe để quay lại."
            : "Pull over before continuing. Tap once stopped to return."
        }
        className="flex flex-1 flex-col gap-[20px] items-center justify-center min-h-0 px-[8px] relative w-full max-w-md focus:outline-none"
        data-name="Gate"
      >
        <span
          className="flex items-center justify-center relative shrink-0 size-[96px] transition-transform hover:scale-105 active:scale-95"
          data-name="icon/pause-octagon"
        >
          <img alt="" className="block max-w-none shrink-0" src={ASSETS.iconPauseOctagon} />
        </span>

        <span className="[word-break:break-word] font-['Plus_Jakarta_Sans:Bold'] font-bold leading-[38px] relative shrink-0 text-[30px] text-center text-white w-full">
          {lang === "vi" ? "Dừng xe trước khi xem tiếp." : "Pull over and stop before continuing."}
        </span>

        <span className="[word-break:break-word] font-['Plus_Jakarta_Sans:Regular'] font-normal leading-[26px] opacity-85 relative shrink-0 text-[18px] text-center text-white w-full">
          {lang === "vi"
            ? "Bạn đang di chuyển trên 15 km/h. Gợi ý đường và máy ảnh tạm ẩn cho đến khi bạn dừng."
            : "You are moving above 15 km/h. Route guidance and camera are hidden until you come to a stop."}
        </span>
      </button>

      <p className="[word-break:break-word] font-['Plus_Jakarta_Sans:Regular'] font-normal leading-[24px] opacity-75 relative shrink-0 text-[16px] text-center text-white w-full max-w-md">
        {lang === "vi"
          ? "113 · 114 · 115. FloodScout không phải đơn vị cứu hộ."
          : "113 · 114 · 115. FloodScout is not a rescue service."}
      </p>
    </div>
  );
}
