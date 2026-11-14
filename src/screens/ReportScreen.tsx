import React, { useState } from "react";
import { ASSETS } from "../assets";
import {
  ButtonPrimary,
  ButtonSecondary,
  HeaderBack,
  MicButton,
} from "../components/SharedPrimitives";
import type { DepthCategory, Language } from "../types";

interface ReportScreenProps {
  lang: Language;
  photoConsent: boolean;
  preciseLocationConsent: boolean;
  onBack: () => void;
  onSubmitReport: (payload: { segmentName: string; category: DepthCategory }) => void;
}

const SEGMENTS = [
  {
    name: "Đầu ngõ Nguyễn Trãi",
    transcriptVi: "“Ở đầu ngõ Nguyễn Trãi đang bị ngập”",
    transcriptEn: "“Flooding at the entrance of Nguyễn Trãi alley”",
  },
  {
    name: "Nguyễn Như Kon Tum",
    transcriptVi: "“Đường Nguyễn Như Kon Tum nước dâng ngang bánh xe”",
    transcriptEn: "“Water up to motorbike wheels on Nguyễn Như Kon Tum”",
  },
  {
    name: "Ngã tư Khuất Duy Tiến",
    transcriptVi: "“Ngã tư Khuất Duy Tiến bắt đầu ngập mặt đường”",
    transcriptEn: "“Standing water starting at Khuất Duy Tiến junction”",
  },
];

export function ReportScreen({
  lang,
  photoConsent,
  preciseLocationConsent,
  onBack,
  onSubmitReport,
}: ReportScreenProps) {
  const [dryGroundChecked, setDryGroundChecked] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<DepthCategory | null>("wheel");
  const [segmentIndex, setSegmentIndex] = useState(0);
  const [locationPickerOpen, setLocationPickerOpen] = useState(false);
  const [recording, setRecording] = useState(false);

  const currentSegment = SEGMENTS[segmentIndex];

  const categories: Array<{
    id: DepthCategory;
    labelVi: string;
    labelEn: string;
  }> = [
    { id: "ankle", labelVi: "Mắt cá", labelEn: "Ankle" },
    { id: "wheel", labelVi: "Bánh xe", labelEn: "Wheel" },
    { id: "unsure", labelVi: "Chưa rõ", labelEn: "Unsure" },
  ];

  const handleVoiceToggle = () => {
    setRecording(true);
    window.setTimeout(() => {
      setRecording(false);
      setSegmentIndex((i) => (i + 1) % SEGMENTS.length);
    }, 700);
  };

  const canSubmit = dryGroundChecked && selectedCategory !== null;

  return (
    <div
      className="bg-[#f3f4ef] flex flex-col min-h-dvh w-full justify-between"
      data-name="S6 Report — Báo cáo ngập"
    >
      <div className="w-full max-w-4xl mx-auto flex-1 flex flex-col">
        {/* Top */}
        <div
          className="flex flex-col items-start pb-[4px] pt-[16px] px-[16px] md:px-6 w-full"
          data-name="Top"
        >
          <HeaderBack
            title={lang === "vi" ? "Báo cáo ngập" : "Report flooding"}
            showSubtitle={false}
            onBack={onBack}
            lang={lang}
          />
        </div>

        {/* Report Form */}
        <div
          className="flex flex-1 flex-col gap-[14px] items-start pb-[16px] pt-[12px] px-[16px] md:px-6 w-full"
          data-name="Report form"
        >
          {/* Dry-ground acknowledgement (required) */}
          <button
            type="button"
            role="checkbox"
            aria-checked={dryGroundChecked}
            onClick={() => setDryGroundChecked((prev) => !prev)}
            className="bg-[#fff3e6] border-2 border-[#c2410c] border-solid flex gap-[14px] items-start px-[18px] py-[16px] relative rounded-[20px] shrink-0 text-left w-full"
            data-name="Dry-ground acknowledgement (required)"
          >
            <span
              className={`flex items-center justify-center relative rounded-[7px] shrink-0 size-[26px] transition ${
                dryGroundChecked ? "bg-[#191b14]" : "bg-white border-2 border-[#191b14]"
              }`}
              data-name="Checkbox/Checked"
            >
              {dryGroundChecked && (
                <span
                  className="flex items-center justify-center relative shrink-0 size-[18px]"
                  data-name="icon/check"
                >
                  <img alt="" className="block max-w-none shrink-0" src={ASSETS.iconCheck} />
                </span>
              )}
            </span>
            <span className="[word-break:break-word] flex-1 font-['Plus_Jakarta_Sans:Regular'] font-normal leading-[24px] min-w-0 relative text-[#191b14] text-[16px]">
              <strong className="font-['Plus_Jakarta_Sans:Bold'] font-bold">
                {lang === "vi" ? "Chỉ chụp từ chỗ khô ráo." : "Only take photos from dry ground."}
              </strong>
              {lang === "vi"
                ? " Đừng đi vào nước để chụp."
                : " Never step into floodwater to take a photo."}
            </span>
          </button>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-[14px] w-full items-start">
            <div className="flex flex-col gap-[14px] w-full">
              {/* Voice transcript */}
              <div
                className="bg-white flex gap-[14px] items-center p-[16px] relative rounded-[20px] shadow-[0px_4px_16px_0px_rgba(26,28,20,0.06)] shrink-0 w-full"
                data-name="Voice transcript"
              >
                <MicButton
                  size={64}
                  lang={lang}
                  isRecording={recording}
                  onClick={handleVoiceToggle}
                />
                <div
                  className="[word-break:break-word] flex flex-1 flex-col gap-[2px] items-start min-w-0 relative"
                  data-name="Copy"
                >
                  <p className="font-['Plus_Jakarta_Sans:SemiBold'] font-semibold leading-[18px] relative shrink-0 text-[#5d6157] text-[13px] tracking-[0.78px] uppercase whitespace-nowrap">
                    {lang === "vi" ? "Bạn nói" : "You said"}
                  </p>
                  <p className="font-['Plus_Jakarta_Sans:Bold'] font-bold leading-[26px] relative shrink-0 text-[#191b14] text-[18px] tracking-[-0.09px] w-full">
                    {recording
                      ? lang === "vi"
                        ? "Đang nghe..."
                        : "Listening..."
                      : lang === "vi"
                        ? currentSegment.transcriptVi
                        : currentSegment.transcriptEn}
                  </p>
                </div>
              </div>

              {/* Model proposal */}
              <div
                className="flex gap-[14px] items-start relative shrink-0 w-full"
                data-name="Model proposal"
              >
                <div
                  className="bg-[#d9dcd2] flex items-center justify-center overflow-clip relative rounded-[20px] shrink-0 size-[120px]"
                  data-name="Photo (redacted on device)"
                >
                  <p className="[word-break:break-word] font-['Plus_Jakarta_Sans:Regular'] font-normal leading-[24px] relative shrink-0 text-[#5d6157] text-[16px] text-center w-[96px]">
                    {!photoConsent
                      ? lang === "vi"
                        ? "[Đã tắt quyền ảnh]"
                        : "[Photo consent off]"
                      : lang === "vi"
                        ? "[Ảnh đường ngập]"
                        : "[Flooded road photo]"}
                  </p>
                </div>
                <div
                  className="[word-break:break-word] flex flex-1 flex-col gap-[2px] items-start min-w-0 relative"
                  data-name="Proposal copy"
                >
                  <p className="font-['Plus_Jakarta_Sans:SemiBold'] font-semibold leading-[18px] relative shrink-0 text-[#5d6157] text-[13px] tracking-[0.78px] uppercase whitespace-nowrap">
                    {lang === "vi" ? "AI đề xuất" : "AI proposal"}
                  </p>
                  <p className="font-['Plus_Jakarta_Sans:Bold'] font-bold leading-[28px] relative shrink-0 text-[#191b14] text-[20px] tracking-[-0.2px]">
                    {lang === "vi" ? "Ngang bánh xe" : "Wheel-hub deep"}
                  </p>
                  <p className="font-['Plus_Jakarta_Sans:Regular'] font-normal leading-[24px] relative shrink-0 text-[#5d6157] text-[16px] w-full">
                    {lang === "vi"
                      ? "Dựa vào bánh xe máy trong ảnh. Bạn chọn lại bên dưới nếu chưa đúng."
                      : "Based on motorbike wheel height in photo. Choose below if different."}
                  </p>
                </div>
              </div>
            </div>

            {/* Segment and category */}
            <div
              className="bg-white flex flex-col gap-[12px] items-start p-[16px] relative rounded-[20px] shadow-[0px_4px_16px_0px_rgba(26,28,20,0.06)] shrink-0 w-full"
              data-name="Segment and category"
            >
              <div
                className="flex gap-[12px] items-center relative shrink-0 w-full"
                data-name="Snapped segment"
              >
                <div
                  className="[word-break:break-word] flex flex-1 flex-col font-['Plus_Jakarta_Sans:SemiBold'] font-semibold items-start min-w-0 relative"
                  data-name="Copy"
                >
                  <p className="leading-[18px] relative shrink-0 text-[#5d6157] text-[13px] tracking-[0.78px] uppercase whitespace-nowrap">
                    {lang === "vi" ? "Vị trí" : "Location"}
                  </p>
                  <p className="leading-[24px] relative shrink-0 text-[#191b14] text-[16px] w-full">
                    {currentSegment.name}
                  </p>
                  {!preciseLocationConsent && (
                    <span className="font-['Plus_Jakarta_Sans:Regular'] font-normal text-[13px] leading-[18px] text-[#9a3412]">
                      {lang === "vi"
                        ? "Đã chọn thủ công (quyền vị trí tắt)"
                        : "Selected manually (precise location off)"}
                    </span>
                  )}
                </div>
                <ButtonSecondary
                  label={lang === "vi" ? "Đổi vị trí" : "Change"}
                  onClick={() => setLocationPickerOpen(true)}
                />
              </div>

              <p className="[word-break:break-word] font-['Plus_Jakarta_Sans:SemiBold'] font-semibold leading-[18px] relative shrink-0 text-[#5d6157] text-[13px] tracking-[0.78px] uppercase">
                {lang === "vi" ? "Mức nước (bắt buộc chọn)" : "Water depth (required)"}
              </p>

              <div
                role="radiogroup"
                aria-label={lang === "vi" ? "Mức nước" : "Water depth category"}
                className="flex gap-[10px] items-start relative shrink-0 w-full"
                data-name="Category (one tap required)"
              >
                {categories.map((cat) => {
                  const isSelected = selectedCategory === cat.id;
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      role="radio"
                      aria-checked={isSelected}
                      onClick={() => setSelectedCategory(cat.id)}
                      className={`flex flex-1 h-[56px] items-center justify-center min-w-0 relative rounded-[999px] transition ${
                        isSelected
                          ? "bg-[#191b14]"
                          : "bg-white border-[#dfe1d8] border-[1.5px] border-solid hover:border-[#191b14]"
                      }`}
                    >
                      <span
                        className={`[word-break:break-word] font-['Plus_Jakarta_Sans:SemiBold'] font-semibold leading-[24px] relative shrink-0 text-[16px] whitespace-nowrap ${
                          isSelected ? "text-white" : "text-[#191b14]"
                        }`}
                      >
                        {lang === "vi" ? cat.labelVi : cat.labelEn}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Action Bar */}
      <div
        className="bg-white border-[#dfe1d8] border-solid border-t flex flex-col gap-[10px] items-center pb-[20px] pt-[16px] px-[16px] md:px-6 w-full"
        data-name="Action bar"
      >
        <div className="w-full max-w-md flex flex-col gap-[10px]">
          <ButtonPrimary
            label={lang === "vi" ? "Gửi báo cáo" : "Submit report"}
            disabled={!canSubmit}
            onClick={() => {
              if (!selectedCategory || !dryGroundChecked) return;
              onSubmitReport({
                segmentName: currentSegment.name,
                category: selectedCategory,
              });
            }}
          />
          <p className="[word-break:break-word] font-['Plus_Jakarta_Sans:Regular'] font-normal leading-[24px] relative shrink-0 text-[#5d6157] text-[16px] text-center w-full">
            {lang === "vi"
              ? "Báo cáo hết tác dụng sau 12 giờ. Ảnh demo được ghi rõ là dữ liệu demo."
              : "Reports expire after 12 hours. Demo photos are clearly labeled as demo data."}
          </p>
        </div>
      </div>

      {/* Location Picker Sheet */}
      {locationPickerOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/45 flex items-end md:items-center justify-center p-0 md:p-6"
          onClick={() => setLocationPickerOpen(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-tl-[28px] rounded-tr-[28px] md:rounded-[28px] w-full max-w-[420px] p-[20px] flex flex-col gap-[12px]"
          >
            <h3 className="font-['Plus_Jakarta_Sans:Bold'] font-bold text-[20px] leading-[28px] text-[#191b14]">
              {lang === "vi" ? "Chọn đoạn đường" : "Select road segment"}
            </h3>
            {SEGMENTS.map((seg, idx) => {
              const active = idx === segmentIndex;
              return (
                <button
                  key={seg.name}
                  type="button"
                  onClick={() => {
                    setSegmentIndex(idx);
                    setLocationPickerOpen(false);
                  }}
                  className={`rounded-[16px] px-[16px] py-[14px] text-left font-['Plus_Jakarta_Sans:SemiBold'] text-[16px] transition ${
                    active
                      ? "bg-[#191b14] text-white"
                      : "bg-[#f3f4ef] text-[#191b14] hover:bg-[#eceee6]"
                  }`}
                >
                  {seg.name}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
