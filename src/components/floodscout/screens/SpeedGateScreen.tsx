'use client'

import Image from 'next/image'
import React, { useEffect } from 'react'
import { StatusBandCompact } from '@/components/floodscout/SharedPrimitives'
import { useCameraSafeTopInset, useGsapScreenEntrance } from '@/hooks/useGsap'
import { ASSETS } from '@/lib/assets'
import type { CompiledAreaBulletin, Language } from '@/types/floodscout'

interface SpeedGateScreenProps {
  lang: Language
  bulletin?: CompiledAreaBulletin | null
  onStopped: () => void
  onOpenBulletin: () => void
}

export function SpeedGateScreen({
  lang,
  bulletin,
  onStopped,
  onOpenBulletin,
}: SpeedGateScreenProps) {
  const topInset = useCameraSafeTopInset()
  const rootRef = useGsapScreenEntrance([lang])

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onStopped()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [onStopped])

  return (
    <div
      ref={rootRef}
      className="bg-[#191b14] flex flex-col items-center justify-between pb-[96px] px-[16px] md:px-6 relative min-h-dvh w-full"
      style={{ paddingTop: topInset }}
    >
      <div className="w-full max-w-md">
        <StatusBandCompact lang={lang} bulletin={bulletin} onOpenBulletin={onOpenBulletin} />
      </div>

      <button
        type="button"
        onClick={onStopped}
        aria-label={
          lang === 'vi'
            ? 'Dừng xe trước khi xem tiếp. Nhấn khi đã dừng xe để quay lại.'
            : 'Pull over before continuing. Tap once stopped to return.'
        }
        className="flex flex-1 flex-col gap-[20px] items-center justify-center px-[8px] w-full max-w-md focus:outline-none"
      >
        <Image src={ASSETS.iconPauseOctagon} alt="" width={96} height={96} />
        <span className="font-['Plus_Jakarta_Sans:Bold'] font-bold leading-[38px] text-[28px] text-center text-white w-full">
          {lang === 'vi' ? 'Dừng xe trước khi xem tiếp.' : 'Pull over and stop before continuing.'}
        </span>
        <span className="font-['Plus_Jakarta_Sans:Regular'] leading-[26px] opacity-85 text-[17px] text-center text-white w-full">
          {lang === 'vi'
            ? 'Bạn đang di chuyển trên 15 km/h. Gợi ý đường và máy ảnh tạm ẩn cho đến khi bạn dừng.'
            : 'You are moving above 15 km/h. Route guidance and camera are hidden until you stop.'}
        </span>
      </button>

      <p className="font-['Plus_Jakarta_Sans:Regular'] leading-[24px] opacity-75 text-[15px] text-center text-white w-full max-w-md">
        {lang === 'vi'
          ? '113 · 114 · 115. FloodScout không phải đơn vị cứu hộ.'
          : '113 · 114 · 115. FloodScout is not a rescue service.'}
      </p>
    </div>
  )
}
