'use client'

import React, { useState } from 'react'
import { ButtonSecondary, HeaderBack, ToggleSwitch } from '@/components/floodscout/SharedPrimitives'
import { useCameraSafeTopInset, useGsapScreenEntrance } from '@/hooks/useGsap'
import type { Language, TextSize } from '@/types/floodscout'

interface SettingsScreenProps {
  lang: Language
  onChangeLang: (lang: Language) => void
  textSize: TextSize
  onChangeTextSize: (size: TextSize) => void
  dataSaver: boolean
  onChangeDataSaver: (val: boolean) => void
  preciseLocationConsent: boolean
  onChangePreciseLocationConsent: (val: boolean) => void
  photoConsent: boolean
  onChangePhotoConsent: (val: boolean) => void
  ownReportCount: number
  onDeleteOwnReports: () => Promise<void>
  onBack: () => void
}

export function SettingsScreen({
  lang,
  onChangeLang,
  textSize,
  onChangeTextSize,
  dataSaver,
  onChangeDataSaver,
  preciseLocationConsent,
  onChangePreciseLocationConsent,
  photoConsent,
  onChangePhotoConsent,
  ownReportCount,
  onDeleteOwnReports,
  onBack,
}: SettingsScreenProps) {
  const topInset = useCameraSafeTopInset()
  const rootRef = useGsapScreenEntrance([lang])
  const [deletedNotice, setDeletedNotice] = useState(false)

  const textSizeOptions: Array<{ id: TextSize; labelVi: string; labelEn: string }> = [
    { id: 'default', labelVi: 'Mặc định', labelEn: 'Default' },
    { id: 'large', labelVi: 'Lớn', labelEn: 'Large' },
    { id: 'xlarge', labelVi: 'Rất lớn', labelEn: 'Extra large' },
  ]

  const handleDelete = async () => {
    await onDeleteOwnReports()
    setDeletedNotice(true)
    window.setTimeout(() => setDeletedNotice(false), 3000)
  }

  return (
    <div ref={rootRef} className="bg-[#f3f4ef] flex flex-col min-h-dvh w-full pb-[96px]">
      <div className="w-full max-w-5xl mx-auto flex flex-col">
        <div
          className="flex flex-col items-start pb-[4px] px-[16px] md:px-6 w-full"
          style={{ paddingTop: topInset }}
        >
          <HeaderBack
            title={lang === 'vi' ? 'Cài đặt' : 'Settings'}
            showSubtitle={false}
            onBack={onBack}
            lang={lang}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-[22px] items-start pb-[28px] pt-[12px] px-[16px] md:px-6 w-full">
          <div className="flex flex-col gap-[22px] w-full">
            {/* Ngôn ngữ */}
            <div data-gsap="stagger" className="flex flex-col gap-[8px] w-full">
              <p className="font-['Plus_Jakarta_Sans:SemiBold'] font-semibold text-[#5d6157] text-[13px] tracking-[0.78px] uppercase">
                {lang === 'vi' ? 'NGÔN NGỮ' : 'LANGUAGE'}
              </p>
              <div className="bg-[#eceee6] flex gap-[6px] p-[6px] rounded-[20px] w-full">
                <button
                  type="button"
                  onClick={() => onChangeLang('vi')}
                  className={`flex flex-1 items-center justify-center min-h-[48px] py-[12px] rounded-[12px] transition ${
                    lang === 'vi'
                      ? 'bg-white shadow-[0px_2px_8px_rgba(18,23,38,0.1)] text-[#191b14]'
                      : 'text-[#5d6157]'
                  }`}
                >
                  <span className="font-['Plus_Jakarta_Sans:SemiBold'] font-semibold text-[16px]">
                    Tiếng Việt
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => onChangeLang('en')}
                  className={`flex flex-1 items-center justify-center min-h-[48px] py-[12px] rounded-[12px] transition ${
                    lang === 'en'
                      ? 'bg-white shadow-[0px_2px_8px_rgba(18,23,38,0.1)] text-[#191b14]'
                      : 'text-[#5d6157]'
                  }`}
                >
                  <span className="font-['Plus_Jakarta_Sans:SemiBold'] font-semibold text-[16px]">
                    English
                  </span>
                </button>
              </div>
            </div>

            {/* Cỡ chữ */}
            <div data-gsap="stagger" className="flex flex-col gap-[8px] w-full">
              <p className="font-['Plus_Jakarta_Sans:SemiBold'] font-semibold text-[#5d6157] text-[13px] tracking-[0.78px] uppercase">
                {lang === 'vi' ? 'CỠ CHỮ' : 'TEXT SIZE'}
              </p>
              <div className="bg-[#eceee6] flex gap-[6px] p-[6px] rounded-[20px] w-full">
                {textSizeOptions.map((opt) => {
                  const selected = textSize === opt.id
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => onChangeTextSize(opt.id)}
                      className={`flex flex-1 items-center justify-center min-h-[48px] py-[12px] rounded-[12px] transition ${
                        selected
                          ? 'bg-white shadow-[0px_2px_8px_rgba(18,23,38,0.1)] text-[#191b14]'
                          : 'text-[#5d6157]'
                      }`}
                    >
                      <span className="font-['Plus_Jakarta_Sans:SemiBold'] font-semibold text-[16px]">
                        {lang === 'vi' ? opt.labelVi : opt.labelEn}
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Hiển thị */}
            <div data-gsap="stagger" className="flex flex-col gap-[8px] w-full">
              <p className="font-['Plus_Jakarta_Sans:SemiBold'] font-semibold text-[#5d6157] text-[13px] tracking-[0.78px] uppercase">
                {lang === 'vi' ? 'HIỂN THỊ' : 'DISPLAY'}
              </p>
              <div className="bg-white px-[16px] py-[4px] rounded-[20px] shadow-[0px_4px_16px_rgba(26,28,20,0.06)] w-full">
                <div className="flex gap-[12px] items-center min-h-[64px] py-[12px]">
                  <div className="flex flex-1 flex-col gap-[2px]">
                    <p className="font-['Plus_Jakarta_Sans:SemiBold'] font-semibold text-[#191b14] text-[16px]">
                      {lang === 'vi' ? 'Tiết kiệm dữ liệu' : 'Data saver'}
                    </p>
                    <p className="font-['Plus_Jakarta_Sans:Regular'] text-[#5d6157] text-[15px]">
                      {lang === 'vi'
                        ? 'Chỉ bản đồ nhẹ và cảnh báo. Tắt lớp radar nặng.'
                        : 'Lightweight map and warnings only. Disables heavy radar tiles.'}
                    </p>
                  </div>
                  <ToggleSwitch
                    checked={dataSaver}
                    onChange={onChangeDataSaver}
                    label="Data saver"
                    lang={lang}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-[22px] w-full">
            {/* Quyền và đồng ý */}
            <div data-gsap="stagger" className="flex flex-col gap-[8px] w-full">
              <p className="font-['Plus_Jakarta_Sans:SemiBold'] font-semibold text-[#5d6157] text-[13px] tracking-[0.78px] uppercase">
                {lang === 'vi' ? 'QUYỀN VÀ ĐỒNG Ý' : 'PERMISSIONS & CONSENT'}
              </p>
              <div className="bg-white px-[16px] py-[4px] rounded-[20px] shadow-[0px_4px_16px_rgba(26,28,20,0.06)] w-full">
                <div className="flex gap-[12px] items-center min-h-[64px] py-[12px]">
                  <div className="flex flex-1 flex-col gap-[2px]">
                    <p className="font-['Plus_Jakarta_Sans:SemiBold'] font-semibold text-[#191b14] text-[16px]">
                      {lang === 'vi' ? 'Vị trí chính xác' : 'Precise location'}
                    </p>
                    <p className="font-['Plus_Jakarta_Sans:Regular'] text-[#5d6157] text-[15px]">
                      {lang === 'vi'
                        ? 'Chỉ khi bạn gửi báo cáo hoặc hỏi đường. Không theo dõi liên tục.'
                        : 'Only when submitting a report or planning a route.'}
                    </p>
                  </div>
                  <ToggleSwitch
                    checked={preciseLocationConsent}
                    onChange={onChangePreciseLocationConsent}
                    label="Precise location"
                    lang={lang}
                  />
                </div>
                <div className="bg-[#cdd1c6] h-px w-full" />
                <div className="flex gap-[12px] items-center min-h-[64px] py-[12px]">
                  <div className="flex flex-1 flex-col gap-[2px]">
                    <p className="font-['Plus_Jakarta_Sans:SemiBold'] font-semibold text-[#191b14] text-[16px]">
                      {lang === 'vi' ? 'Ảnh' : 'Photos'}
                    </p>
                    <p className="font-['Plus_Jakarta_Sans:Regular'] text-[#5d6157] text-[15px]">
                      {lang === 'vi'
                        ? 'Chỉ khi bạn báo cáo. Mặt người và biển số được làm mờ trên máy.'
                        : 'Only when reporting. Faces and license plates blurred on device.'}
                    </p>
                  </div>
                  <ToggleSwitch
                    checked={photoConsent}
                    onChange={onChangePhotoConsent}
                    label="Photos"
                    lang={lang}
                  />
                </div>
              </div>

              <div className="bg-[#eceee6] px-[16px] py-[14px] rounded-[20px] w-full">
                <p className="font-['Plus_Jakarta_Sans:Regular'] leading-[23px] text-[#191b14] text-[15px]">
                  {lang === 'vi'
                    ? 'Ảnh được gỡ dữ liệu EXIF GPS và phân tích qua runtime máy chủ FloodScout. Bạn có thể rút lại đồng ý bất cứ lúc nào.'
                    : 'Photos are EXIF-stripped and analyzed via FloodScout server runtime. You may withdraw consent anytime.'}
                </p>
              </div>
            </div>

            {/* Dữ liệu của bạn */}
            <div data-gsap="stagger" className="flex flex-col gap-[8px] w-full">
              <p className="font-['Plus_Jakarta_Sans:SemiBold'] font-semibold text-[#5d6157] text-[13px] tracking-[0.78px] uppercase">
                {lang === 'vi' ? 'DỮ LIỆU CỦA BẠN' : 'YOUR DATA'}
              </p>
              <div className="bg-white flex flex-col gap-[14px] p-[16px] rounded-[20px] shadow-[0px_4px_16px_rgba(26,28,20,0.06)] w-full">
                <p className="font-['Plus_Jakarta_Sans:Regular'] leading-[23px] text-[#191b14] text-[15px]">
                  {lang === 'vi'
                    ? 'Ảnh được giữ tối đa 7 ngày. Bạn có thể xoá ngay toàn bộ báo cáo đã gửi từ thiết bị này khỏi hệ thống Payload.'
                    : 'Photos are retained up to 7 days. You can immediately delete reports submitted from this device.'}
                </p>
                <ButtonSecondary
                  danger
                  fullWidth
                  label={
                    deletedNotice
                      ? lang === 'vi'
                        ? 'Đã xoá báo cáo của thiết bị này'
                        : 'Your device reports were deleted'
                      : ownReportCount > 0
                        ? lang === 'vi'
                          ? `Xoá báo cáo của tôi (${ownReportCount})`
                          : `Delete my reports (${ownReportCount})`
                        : lang === 'vi'
                          ? 'Xoá báo cáo của tôi'
                          : 'Delete my reports'
                  }
                  onClick={handleDelete}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
