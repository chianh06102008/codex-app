'use client'

import gsap from 'gsap'
import Image from 'next/image'
import React, { useRef } from 'react'
import { ASSETS } from '@/lib/assets'
import type { CompiledAreaBulletin, Language, ScreenId, TravelMode } from '@/types/floodscout'

export function getTravelModeLabel(mode: TravelMode, lang: Language): string {
  if (mode === 'bicycle') return lang === 'vi' ? 'Xe đạp' : 'Bicycle'
  if (lang === 'en') {
    if (mode === 'motorbike') return 'Motorbike'
    if (mode === 'walk') return 'Walk'
    return 'Car'
  }
  if (mode === 'motorbike') return 'Xe máy'
  if (mode === 'walk') return 'Đi bộ'
  return 'Ô tô'
}

export function pressDown(el: HTMLElement | null) {
  if (el) gsap.to(el, { scale: 0.96, duration: 0.1, ease: 'power2.out' })
}

export function pressUp(el: HTMLElement | null) {
  if (el) gsap.to(el, { scale: 1, duration: 0.18, ease: 'back.out(2)' })
}

export function IconButtonBack({
  onClick,
  lang = 'vi',
  className,
}: {
  onClick: () => void
  lang?: Language
  className?: string
}) {
  const ref = useRef<HTMLButtonElement | null>(null)
  return (
    <button
      ref={ref}
      type="button"
      onClick={onClick}
      onPointerDown={() => pressDown(ref.current)}
      onPointerUp={() => pressUp(ref.current)}
      onPointerLeave={() => pressUp(ref.current)}
      aria-label={lang === 'vi' ? 'Quay lại' : 'Back'}
      className={
        className ||
        'bg-white drop-shadow-[0px_8px_12px_rgba(26,28,20,0.14)] flex items-center justify-center relative rounded-[16px] shrink-0 size-[48px]'
      }
    >
      <Image src={ASSETS.iconChevronLeft} alt="" width={24} height={24} className="shrink-0" />
    </button>
  )
}

export function HeaderBack({
  title,
  subtitle,
  showSubtitle = true,
  onBack,
  lang = 'vi',
}: {
  title: string
  subtitle?: string
  showSubtitle?: boolean
  onBack: () => void
  lang?: Language
}) {
  return (
    <div className="flex gap-[14px] items-center relative w-full">
      <IconButtonBack onClick={onBack} lang={lang} />
      <div className="[word-break:break-word] flex flex-1 flex-col items-start min-w-0 relative">
        <h1 className="font-['Plus_Jakarta_Sans:Bold'] font-bold leading-[28px] text-[#191b14] text-[20px] tracking-[-0.2px] w-full">
          {title}
        </h1>
        {showSubtitle && subtitle ? (
          <p className="font-['Plus_Jakarta_Sans:Regular'] font-normal leading-[23px] text-[#5d6157] text-[15px] w-full">
            {subtitle}
          </p>
        ) : null}
      </div>
    </div>
  )
}

export function ButtonPrimary({
  label,
  onClick,
  disabled = false,
  type = 'button',
}: {
  label: string
  onClick?: () => void
  disabled?: boolean
  type?: 'button' | 'submit'
}) {
  const ref = useRef<HTMLButtonElement | null>(null)
  return (
    <button
      ref={ref}
      type={type}
      onClick={onClick}
      disabled={disabled}
      onPointerDown={() => !disabled && pressDown(ref.current)}
      onPointerUp={() => !disabled && pressUp(ref.current)}
      onPointerLeave={() => !disabled && pressUp(ref.current)}
      className={`bg-[#191b14] flex items-center justify-center min-h-[56px] px-[24px] py-[16px] relative rounded-[999px] w-full transition-opacity ${
        disabled ? 'opacity-40' : 'hover:opacity-95'
      }`}
    >
      <span className="font-['Plus_Jakarta_Sans:Bold'] font-bold leading-[24px] text-[17px] text-white whitespace-nowrap">
        {label}
      </span>
    </button>
  )
}

export function ButtonSecondary({
  label,
  onClick,
  danger = false,
  fullWidth = false,
}: {
  label: string
  onClick?: () => void
  danger?: boolean
  fullWidth?: boolean
}) {
  const ref = useRef<HTMLButtonElement | null>(null)
  return (
    <button
      ref={ref}
      type="button"
      onClick={onClick}
      onPointerDown={() => pressDown(ref.current)}
      onPointerUp={() => pressUp(ref.current)}
      onPointerLeave={() => pressUp(ref.current)}
      className={`bg-white border-[#dfe1d8] border-[1.5px] border-solid flex items-center justify-center min-h-[46px] px-[18px] py-[11px] relative rounded-[999px] shrink-0 hover:bg-[#f8f9f5] transition-colors ${
        fullWidth ? 'w-full' : ''
      }`}
    >
      <span
        className={`font-['Plus_Jakarta_Sans:SemiBold'] font-semibold leading-[22px] text-[15px] whitespace-nowrap ${
          danger ? 'text-[#b91c1c]' : 'text-[#191b14]'
        }`}
      >
        {label}
      </span>
    </button>
  )
}

export function StatusBandFull({
  lang = 'vi',
  bulletin,
  onOpenBulletin,
}: {
  lang?: Language
  bulletin?: CompiledAreaBulletin | null
  onOpenBulletin?: () => void
}) {
  if (!bulletin) return null
  const overline = lang === 'vi' ? 'CẢNH BÁO CHÍNH THỨC & KHU VỰC' : 'OFFICIAL & REGIONAL WARNING'
  const title = lang === 'vi' ? bulletin.headlineVi : bulletin.headlineEn
  const sourceAndTime = lang === 'vi'
    ? `${bulletin.issuerVi} · ${bulletin.issuedAtFormatted}`
    : `${bulletin.issuerEn} · ${bulletin.issuedAtFormatted}`

  return (
    <div
      role="alert"
      className="[word-break:break-word] bg-[#fff3e6] border-[#c2410c] border-[1.5px] border-solid drop-shadow-[0px_4px_8px_rgba(26,28,20,0.06)] flex flex-col gap-[4px] items-start px-[16px] py-[12px] relative rounded-[20px] w-full"
    >
      <p className="font-['Plus_Jakarta_Sans:SemiBold'] font-semibold leading-[17px] text-[#9a3412] text-[12px] tracking-[0.78px] uppercase w-full">
        {overline}
      </p>
      <p className="font-['Plus_Jakarta_Sans:Bold'] font-bold leading-[23px] text-[#191b14] text-[17px] tracking-[-0.09px] w-full">
        {title}
      </p>
      <p className="font-['Plus_Jakarta_Sans:Regular'] font-normal leading-[20px] text-[#5d6157] text-[14px] w-full">
        {sourceAndTime}
      </p>
      {onOpenBulletin ? (
        <button
          type="button"
          onClick={onOpenBulletin}
          className="font-['Plus_Jakarta_Sans:SemiBold'] font-semibold leading-[22px] text-[#191b14] text-[15px] text-left underline hover:opacity-80"
        >
          {lang === 'vi' ? 'Xem bản tin & cảnh báo khu vực' : 'View compiled area bulletin'}
        </button>
      ) : null}
    </div>
  )
}

export function StatusBandCompact({
  lang = 'vi',
  bulletin,
  onOpenBulletin,
}: {
  lang?: Language
  bulletin?: CompiledAreaBulletin | null
  onOpenBulletin?: () => void
}) {
  if (!bulletin) return null
  const title = lang === 'vi' ? bulletin.headlineVi : bulletin.headlineEn
  const meta = lang === 'vi' ? bulletin.issuerVi : bulletin.issuerEn

  const content = (
    <>
      <p className="font-['Plus_Jakarta_Sans:Bold'] font-bold leading-[23px] text-[#191b14] text-[16px] tracking-[-0.09px] w-full">
        {title}
      </p>
      <p className="font-['Plus_Jakarta_Sans:Regular'] font-normal leading-[20px] text-[#5d6157] text-[14px] w-full">
        {meta}
      </p>
    </>
  )

  if (onOpenBulletin) {
    return (
      <button
        type="button"
        onClick={onOpenBulletin}
        role="alert"
        className="[word-break:break-word] bg-[#fff3e6] border-[#c2410c] border-[1.5px] border-solid drop-shadow-[0px_4px_8px_rgba(26,28,20,0.06)] flex flex-col gap-[2px] items-start px-[16px] py-[11px] relative rounded-[20px] text-left w-full hover:bg-[#ffedd8] transition-colors"
      >
        {content}
      </button>
    )
  }

  return (
    <div
      role="alert"
      className="[word-break:break-word] bg-[#fff3e6] border-[#c2410c] border-[1.5px] border-solid drop-shadow-[0px_4px_8px_rgba(26,28,20,0.06)] flex flex-col gap-[2px] items-start px-[16px] py-[11px] relative rounded-[20px] w-full"
    >
      {content}
    </div>
  )
}

export function StatusBandDegraded({
  lang = 'vi',
  lastFetchedTime,
  onRetry,
}: {
  lang?: Language
  lastFetchedTime?: string
  onRetry?: () => void
}) {
  return (
    <div
      role="alert"
      className="[word-break:break-word] bg-[#eceee6] border-[#5d6157] border-[1.5px] border-solid drop-shadow-[0px_4px_8px_rgba(26,28,20,0.06)] flex flex-col gap-[4px] items-start px-[16px] py-[12px] relative rounded-[20px] w-full"
    >
      <p className="font-['Plus_Jakarta_Sans:SemiBold'] font-semibold leading-[17px] text-[#5d6157] text-[12px] tracking-[0.78px] uppercase w-full">
        {lang === 'vi' ? 'TÌNH TRẠNG CHÍNH THỨC' : 'OFFICIAL STATUS'}
      </p>
      <p className="font-['Plus_Jakarta_Sans:Bold'] font-bold leading-[24px] text-[#191b14] text-[17px] w-full">
        {lang === 'vi'
          ? 'Không lấy được tình trạng chính thức.'
          : 'Could not retrieve official status.'}
      </p>
      <p className="font-['Plus_Jakarta_Sans:SemiBold'] font-semibold leading-[21px] text-[#191b14] text-[15px] w-full">
        {lang === 'vi'
          ? 'Đừng coi map trống là hết cảnh báo.'
          : 'Do not treat an empty map as all-clear.'}
      </p>
      <div className="flex flex-wrap items-center justify-between gap-[8px] w-full">
        <span className="font-['Plus_Jakarta_Sans:Regular'] text-[#5d6157] text-[13px]">
          {lang === 'vi'
            ? `Bản tin gần nhất: ${lastFetchedTime || 'chưa cập nhật'}`
            : `Last bulletin: ${lastFetchedTime || 'not updated'}`}
        </span>
        {onRetry ? (
          <button
            type="button"
            onClick={onRetry}
            className="font-['Plus_Jakarta_Sans:SemiBold'] text-[13px] text-[#191b14] underline"
          >
            {lang === 'vi' ? 'Kết nối lại' : 'Reconnect'}
          </button>
        ) : null}
      </div>
    </div>
  )
}

export function MicButton({
  onClick,
  isRecording = false,
  size = 64,
  lang = 'vi',
}: {
  onClick?: () => void
  isRecording?: boolean
  size?: 48 | 64
  lang?: Language
}) {
  const ref = useRef<HTMLButtonElement | null>(null)
  return (
    <button
      ref={ref}
      type="button"
      onClick={onClick}
      onPointerDown={() => pressDown(ref.current)}
      onPointerUp={() => pressUp(ref.current)}
      onPointerLeave={() => pressUp(ref.current)}
      aria-label={lang === 'vi' ? 'Giữ để nói' : 'Hold to speak'}
      aria-pressed={isRecording}
      className={`flex items-center justify-center relative rounded-[999px] shrink-0 transition-colors ${
        size === 48 ? 'size-[48px]' : 'size-[64px]'
      } ${isRecording ? 'bg-[#b91c1c] ring-4 ring-[#b91c1c]/25' : 'bg-[#191b14]'}`}
    >
      <Image src={ASSETS.iconMic} alt="" width={28} height={28} className="shrink-0" />
    </button>
  )
}

export function ToggleSwitch({
  checked,
  onChange,
  label,
  lang = 'vi',
}: {
  checked: boolean
  onChange: (next: boolean) => void
  label: string
  lang?: Language
}) {
  const ref = useRef<HTMLButtonElement | null>(null)
  const stateLabel =
    lang === 'vi'
      ? `${label}: ${checked ? 'Đang bật' : 'Đang tắt'}`
      : `${label}: ${checked ? 'On' : 'Off'}`

  return (
    <button
      ref={ref}
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={stateLabel}
      onClick={() => onChange(!checked)}
      onPointerDown={() => pressDown(ref.current)}
      onPointerUp={() => pressUp(ref.current)}
      onPointerLeave={() => pressUp(ref.current)}
      className="flex items-center justify-center min-h-[48px] min-w-[52px] relative shrink-0"
    >
      <Image
        src={checked ? ASSETS.toggleOn : ASSETS.toggleOff}
        alt=""
        width={52}
        height={32}
        className="shrink-0"
      />
    </button>
  )
}

/**
 * Persistent White Footer Bar (pinned across all primary & workflow screens)
 */
export function PersistentWhiteFooter({
  currentScreen,
  onNavigate,
  lang = 'vi',
}: {
  currentScreen: ScreenId
  onNavigate: (screen: ScreenId) => void
  lang?: Language
}) {
  const activeTab: 'home' | 'warning' | 'report' | 'settings' =
    currentScreen === 'warning'
      ? 'warning'
      : currentScreen === 'report'
        ? 'report'
        : currentScreen === 'settings'
          ? 'settings'
          : 'home'

  const items: Array<{
    id: 'home' | 'warning' | 'report' | 'settings'
    labelVi: string
    labelEn: string
    icon: string
    w: number
    h: number
  }> = [
    { id: 'home', labelVi: 'Bản đồ', labelEn: 'Map', icon: ASSETS.navMap, w: 19, h: 18 },
    {
      id: 'warning',
      labelVi: 'Cảnh báo',
      labelEn: 'Warnings',
      icon: ASSETS.navAlert,
      w: 20,
      h: 19,
    },
    {
      id: 'report',
      labelVi: 'Báo cáo',
      labelEn: 'Report',
      icon: ASSETS.navCamera,
      w: 20,
      h: 17,
    },
    {
      id: 'settings',
      labelVi: 'Cài đặt',
      labelEn: 'Settings',
      icon: ASSETS.navSettings,
      w: 19,
      h: 20,
    },
  ]

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 bg-white/98 backdrop-blur-md border-t border-[#dfe1d8] shadow-[0px_-6px_24px_rgba(26,28,20,0.09)] px-[12px] py-[8px]">
      <nav
        aria-label={lang === 'vi' ? 'Điều hướng chính' : 'Primary navigation'}
        className="mx-auto max-w-xl flex gap-[6px] h-[64px] items-stretch"
      >
        {items.map((item) => {
          const isActive = activeTab === item.id
          return (
            <button
              key={item.id}
              type="button"
              aria-current={isActive ? 'page' : undefined}
              onClick={() => onNavigate(item.id)}
              className={`flex flex-1 flex-col gap-[3px] items-center justify-center min-w-0 py-[8px] relative rounded-[20px] transition-colors ${
                isActive ? 'bg-[#eceee6]' : 'hover:bg-[#f6f7f3]'
              }`}
            >
              <span className="flex items-center justify-center size-[22px] shrink-0">
                <Image
                  src={item.icon}
                  alt=""
                  width={item.w}
                  height={item.h}
                  className={isActive ? 'brightness-0' : 'brightness-0 opacity-55'}
                />
              </span>
              <span
                className={`font-['Plus_Jakarta_Sans:SemiBold'] font-semibold leading-[18px] text-[13px] whitespace-nowrap ${
                  isActive ? 'text-[#191b14]' : 'text-[#5d6157]'
                }`}
              >
                {lang === 'vi' ? item.labelVi : item.labelEn}
              </span>
            </button>
          )
        })}
      </nav>
    </div>
  )
}
