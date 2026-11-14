import React from "react";
import { ASSETS } from "../assets";
import type { Language, ScreenId } from "../types";

export function IconButtonBack({
  onClick,
  lang = "vi",
  className,
}: {
  onClick: () => void;
  lang?: Language;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={lang === "vi" ? "Quay lại" : "Back"}
      className={
        className ||
        "bg-white drop-shadow-[0px_8px_12px_rgba(26,28,20,0.14)] flex items-center justify-center relative rounded-[16px] shrink-0 size-[48px] transition-transform active:scale-95"
      }
      data-name="Icon button/Back"
    >
      <span
        className="flex items-center justify-center shrink-0 size-[24px]"
        data-name="icon/chevron-left"
      >
        <img alt="" className="block max-w-none shrink-0" src={ASSETS.iconChevronLeft} />
      </span>
    </button>
  );
}

export function HeaderBack({
  title,
  subtitle,
  showSubtitle = true,
  onBack,
  lang = "vi",
  className,
}: {
  title: string;
  subtitle?: string;
  showSubtitle?: boolean;
  onBack: () => void;
  lang?: Language;
  className?: string;
}) {
  return (
    <div
      className={className || "flex gap-[14px] items-center relative w-full"}
      data-name="Header/Back"
    >
      <IconButtonBack onClick={onBack} lang={lang} />
      <div
        className="[word-break:break-word] flex flex-1 flex-col items-start min-w-0 relative"
        data-name="Titles"
      >
        <h1 className="font-['Plus_Jakarta_Sans:Bold'] font-bold leading-[28px] relative shrink-0 text-[#191b14] text-[20px] tracking-[-0.2px] w-full">
          {title}
        </h1>
        {showSubtitle && subtitle && (
          <p className="font-['Plus_Jakarta_Sans:Regular'] font-normal leading-[24px] relative shrink-0 text-[#5d6157] text-[16px] w-full">
            {subtitle}
          </p>
        )}
      </div>
    </div>
  );
}

export function ButtonPrimary({
  label,
  onClick,
  disabled = false,
  className,
}: {
  label: string;
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={
        className ||
        `bg-[#191b14] flex items-center justify-center min-h-[56px] px-[24px] py-[18px] relative rounded-[999px] w-full transition-opacity ${
          disabled ? "opacity-40" : "hover:opacity-95 active:scale-[0.99]"
        }`
      }
      data-name="Button/Primary"
    >
      <span className="[word-break:break-word] font-['Plus_Jakarta_Sans:Bold'] font-bold leading-[24px] relative shrink-0 text-[17px] text-white whitespace-nowrap">
        {label}
      </span>
    </button>
  );
}

export function ButtonSecondary({
  label,
  onClick,
  danger = false,
  className,
}: {
  label: string;
  onClick?: () => void;
  danger?: boolean;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        className ||
        "bg-white border-[#dfe1d8] border-[1.5px] border-solid flex items-center justify-center min-h-[48px] px-[18px] py-[12px] relative rounded-[999px] shrink-0 transition-colors hover:bg-[#f8f9f5] active:scale-[0.99]"
      }
      data-name="Button/Secondary"
    >
      <span
        className={`[word-break:break-word] font-['Plus_Jakarta_Sans:SemiBold'] font-semibold leading-[24px] relative shrink-0 text-[16px] whitespace-nowrap ${
          danger ? "text-[#b91c1c]" : "text-[#191b14]"
        }`}
      >
        {label}
      </span>
    </button>
  );
}

export function StatusBandFull({
  lang = "vi",
  onOpenBulletin,
  className,
}: {
  lang?: Language;
  onOpenBulletin?: () => void;
  className?: string;
}) {
  const overline = lang === "vi" ? "Cảnh báo chính thức" : "Official warning";
  const title =
    lang === "vi" ? "Cảnh báo mưa lớn khu vực Hà Nội" : "Heavy rain warning — Hanoi area";
  const sourceAndTime =
    lang === "vi"
      ? "Trung tâm Dự báo KTTV Quốc gia · [GIỜ PHÁT HÀNH] · hiệu lực đến [GIỜ]"
      : "National Center for Hydro-Meteorological Forecasting · [ISSUED TIME] · valid until [TIME]";
  const linkLabel = lang === "vi" ? "Xem bản tin gốc" : "View original bulletin";

  return (
    <div
      role="alert"
      className={
        className ||
        "[word-break:break-word] bg-[#fff3e6] border-[#c2410c] border-[1.5px] border-solid drop-shadow-[0px_4px_8px_rgba(26,28,20,0.06)] flex flex-col gap-[6px] items-start px-[18px] py-[16px] relative rounded-[20px] w-full"
      }
      data-name="Status band/Full"
    >
      <p className="font-['Plus_Jakarta_Sans:SemiBold'] font-semibold leading-[18px] relative shrink-0 text-[#9a3412] text-[13px] tracking-[0.78px] uppercase w-full">
        {overline}
      </p>
      <p className="font-['Plus_Jakarta_Sans:Bold'] font-bold leading-[26px] relative shrink-0 text-[#191b14] text-[18px] tracking-[-0.09px] w-full">
        {title}
      </p>
      <p className="font-['Plus_Jakarta_Sans:Regular'] font-normal leading-[24px] relative shrink-0 text-[#5d6157] text-[16px] w-full">
        {sourceAndTime}
      </p>
      {onOpenBulletin ? (
        <button
          type="button"
          onClick={onOpenBulletin}
          className="[text-underline-position:from-font] decoration-from-font decoration-solid font-['Plus_Jakarta_Sans:SemiBold'] font-semibold leading-[24px] relative shrink-0 text-[#191b14] text-[16px] text-left underline whitespace-nowrap hover:opacity-80"
        >
          {linkLabel}
        </button>
      ) : (
        <p className="[text-underline-position:from-font] decoration-from-font decoration-solid font-['Plus_Jakarta_Sans:SemiBold'] font-semibold leading-[24px] relative shrink-0 text-[#191b14] text-[16px] underline whitespace-nowrap">
          {linkLabel}
        </p>
      )}
    </div>
  );
}

export function StatusBandCompact({
  lang = "vi",
  onOpenBulletin,
  className,
}: {
  lang?: Language;
  onOpenBulletin?: () => void;
  className?: string;
}) {
  const title = lang === "vi" ? "Cảnh báo mưa lớn đang có hiệu lực" : "Heavy rain warning in force";
  const sourceAndTime =
    lang === "vi"
      ? "Trung tâm Dự báo KTTV Quốc gia · [GIỜ] · Xem bản tin gốc"
      : "NCHMF · [TIME] · View original bulletin";

  const Wrapper = onOpenBulletin ? "button" : "div";

  return (
    <Wrapper
      {...(onOpenBulletin ? { type: "button" as const, onClick: onOpenBulletin } : {})}
      role="alert"
      className={
        className ||
        `[word-break:break-word] bg-[#fff3e6] border-[#c2410c] border-[1.5px] border-solid drop-shadow-[0px_4px_8px_rgba(26,28,20,0.06)] flex flex-col gap-[2px] items-start px-[18px] py-[14px] relative rounded-[20px] text-left w-full ${
          onOpenBulletin ? "hover:bg-[#ffedd8] transition-colors" : ""
        }`
      }
      data-name="Status band/Compact"
    >
      <p className="font-['Plus_Jakarta_Sans:Bold'] font-bold leading-[26px] relative shrink-0 text-[#191b14] text-[18px] tracking-[-0.09px] w-full">
        {title}
      </p>
      <p className="font-['Plus_Jakarta_Sans:Regular'] font-normal leading-[24px] relative shrink-0 text-[#5d6157] text-[16px] w-full">
        {sourceAndTime}
      </p>
    </Wrapper>
  );
}

export function StatusBandDegraded({
  lang = "vi",
  onOpenBulletin,
  className,
}: {
  lang?: Language;
  onOpenBulletin?: () => void;
  className?: string;
}) {
  return (
    <div
      role="alert"
      onClick={onOpenBulletin}
      className={
        className ||
        "[word-break:break-word] bg-[#eceee6] border-[#5d6157] border-[1.5px] border-solid drop-shadow-[0px_4px_8px_rgba(26,28,20,0.06)] flex flex-col gap-[6px] items-start px-[18px] py-[16px] relative rounded-[20px] w-full cursor-pointer"
      }
      data-name="Status band/Degraded"
    >
      <p className="font-['Plus_Jakarta_Sans:SemiBold'] font-semibold leading-[18px] relative shrink-0 text-[#5d6157] text-[13px] tracking-[0.78px] uppercase w-full">
        {lang === "vi" ? "Tình trạng chính thức" : "Official status"}
      </p>
      <p className="font-['Plus_Jakarta_Sans:Bold'] font-bold leading-[26px] relative shrink-0 text-[#191b14] text-[18px] tracking-[-0.09px] w-full">
        {lang === "vi"
          ? "Không lấy được tình trạng chính thức."
          : "Could not retrieve official status."}
      </p>
      <p className="font-['Plus_Jakarta_Sans:SemiBold'] font-semibold leading-[24px] relative shrink-0 text-[#191b14] text-[16px] w-full">
        {lang === "vi"
          ? "Đừng coi map trống là hết cảnh báo."
          : "Do not treat an empty map as all-clear."}
      </p>
      <p className="font-['Plus_Jakarta_Sans:Regular'] font-normal leading-[24px] relative shrink-0 text-[#5d6157] text-[16px] w-full">
        {lang === "vi"
          ? "Cảnh báo cuối cùng lấy được: mưa lớn · [GIỜ] · chưa cập nhật"
          : "Last fetched warning: heavy rain · [TIME] · not updated"}
      </p>
    </div>
  );
}

export function MicButton({
  onClick,
  isRecording = false,
  size = 64,
  lang = "vi",
  className,
}: {
  onClick?: () => void;
  isRecording?: boolean;
  size?: 48 | 64;
  lang?: Language;
  className?: string;
}) {
  const sizeClass = size === 48 ? "size-[48px]" : "size-[64px]";
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={lang === "vi" ? "Giữ để nói" : "Hold to speak"}
      aria-pressed={isRecording}
      className={
        className ||
        `${
          isRecording ? "bg-[#b91c1c] ring-4 ring-[#b91c1c]/25" : "bg-[#191b14]"
        } flex items-center justify-center relative rounded-[999px] shrink-0 ${sizeClass} transition-all active:scale-95`
      }
      data-name="Mic button"
    >
      <span className="flex items-center justify-center shrink-0 size-[28px]" data-name="icon/mic">
        <img alt="" className="block max-w-none shrink-0" src={ASSETS.iconMic} />
      </span>
    </button>
  );
}

export function ToggleSwitch({
  checked,
  onChange,
  label,
  lang = "vi",
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  label: string;
  lang?: Language;
}) {
  const stateLabel =
    lang === "vi"
      ? `${label}: ${checked ? "Đang bật" : "Đang tắt"}`
      : `${label}: ${checked ? "On" : "Off"}`;

  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={stateLabel}
      onClick={() => onChange(!checked)}
      className="flex items-center justify-center min-h-[48px] min-w-[52px] relative shrink-0"
      data-name="Toggle"
    >
      <span className="flex items-center justify-center h-[32px] w-[52px] shrink-0">
        <img
          alt=""
          className="block max-w-none shrink-0"
          src={checked ? ASSETS.toggleOn : ASSETS.toggleOff}
        />
      </span>
    </button>
  );
}

export function NavBottomBar({
  activeTab = "home",
  onNavigate,
  lang = "vi",
  className,
}: {
  activeTab?: "home" | "warning" | "report" | "settings";
  onNavigate: (screen: ScreenId) => void;
  lang?: Language;
  className?: string;
}) {
  const items: Array<{
    id: "home" | "warning" | "report" | "settings";
    labelVi: string;
    labelEn: string;
    icon: string;
  }> = [
    { id: "home", labelVi: "Bản đồ", labelEn: "Map", icon: ASSETS.navMap },
    { id: "warning", labelVi: "Cảnh báo", labelEn: "Warnings", icon: ASSETS.navAlert },
    { id: "report", labelVi: "Báo cáo", labelEn: "Report", icon: ASSETS.navCamera },
    { id: "settings", labelVi: "Cài đặt", labelEn: "Settings", icon: ASSETS.navSettings },
  ];

  return (
    <nav
      aria-label={lang === "vi" ? "Điều hướng chính" : "Primary navigation"}
      className={
        className ||
        "bg-[#191b14] drop-shadow-[0px_8px_12px_rgba(26,28,20,0.14)] flex gap-[4px] h-[72px] items-stretch p-[8px] relative rounded-[28px] w-full"
      }
      data-name="Nav/Bottom bar"
    >
      {items.map((item) => {
        const isActive = activeTab === item.id;
        return (
          <button
            key={item.id}
            type="button"
            aria-current={isActive ? "page" : undefined}
            onClick={() => onNavigate(item.id)}
            className={`flex flex-1 flex-col gap-[4px] items-center justify-center min-w-0 overflow-clip py-[10px] relative rounded-[20px] transition-colors ${
              isActive ? "bg-[rgba(255,255,255,0.12)]" : "hover:bg-[rgba(255,255,255,0.06)]"
            }`}
          >
            <span className="flex items-center justify-center relative shrink-0 size-[22px]">
              <img
                alt=""
                className={`block max-w-none shrink-0 ${
                  isActive && item.id !== "home" ? "brightness-150" : ""
                }`}
                src={item.icon}
              />
            </span>
            <span
              className={`[word-break:break-word] font-['Plus_Jakarta_Sans:SemiBold'] font-semibold leading-[20px] relative shrink-0 text-[14px] whitespace-nowrap ${
                isActive ? "text-white" : "text-[#a9ad9f]"
              }`}
            >
              {lang === "vi" ? item.labelVi : item.labelEn}
            </span>
          </button>
        );
      })}
    </nav>
  );
}
