import React, { useState } from "react";
import { ButtonPrimary, HeaderBack, StatusBandFull } from "../components/SharedPrimitives";
import type { Language } from "../types";

interface WarningScreenProps {
  lang: Language;
  onBack: () => void;
}

export function WarningScreen({ lang, onBack }: WarningScreenProps) {
  const [sourceModalOpen, setSourceModalOpen] = useState(false);

  const rows =
    lang === "vi"
      ? [
          { label: "Đơn vị phát hành", value: "Trung tâm Dự báo KTTV Quốc gia" },
          { label: "Phát hành", value: "[GIỜ, NGÀY]" },
          { label: "Hiệu lực", value: "[GIỜ] – [GIỜ]" },
          { label: "Khu vực", value: "[Mọi địa danh như trong bản tin]" },
          { label: "Lấy về lúc", value: "[GIỜ]" },
        ]
      : [
          {
            label: "Issuing agency",
            value: "National Center for Hydro-Meteorological Forecasting",
          },
          { label: "Issued", value: "[TIME, DATE]" },
          { label: "Valid", value: "[TIME] – [TIME]" },
          { label: "Area", value: "[All place names verbatim from bulletin]" },
          { label: "Fetched at", value: "[TIME]" },
        ];

  return (
    <div
      className="bg-[#f3f4ef] flex flex-col min-h-dvh w-full justify-between"
      data-name="S2 Warning — Cảnh báo chính thức"
    >
      <div className="w-full max-w-5xl mx-auto flex-1 flex flex-col">
        {/* Header */}
        <div className="flex flex-col items-start pb-[4px] pt-[16px] px-[16px] md:px-6 w-full">
          <HeaderBack
            title={lang === "vi" ? "Cảnh báo chính thức" : "Official warning"}
            subtitle={
              lang === "vi"
                ? "Trung tâm Dự báo KTTV Quốc gia"
                : "National Center for Hydro-Meteorological Forecasting"
            }
            onBack={onBack}
            lang={lang}
          />
        </div>

        {/* Bulletin Content */}
        <div
          className="grid grid-cols-1 lg:grid-cols-2 gap-[16px] items-start pb-[20px] pt-[12px] px-[16px] md:px-6 w-full"
          data-name="Bulletin"
        >
          <div className="flex flex-col gap-[16px] w-full">
            <StatusBandFull lang={lang} onOpenBulletin={() => setSourceModalOpen(true)} />

            {/* Source and clock (P8) */}
            <div
              className="[word-break:break-word] bg-white flex flex-col gap-[10px] items-start leading-[24px] pb-[16px] pt-[14px] px-[16px] relative rounded-[20px] shadow-[0px_4px_16px_0px_rgba(26,28,20,0.06)] text-[16px] w-full"
              data-name="Source and clock (P8)"
            >
              {rows.map((row) => (
                <div
                  key={row.label}
                  className="flex gap-[12px] items-start relative shrink-0 w-full"
                >
                  <p className="font-['Plus_Jakarta_Sans:Regular'] font-normal relative shrink-0 text-[#5d6157] w-[132px]">
                    {row.label}
                  </p>
                  <p className="flex-1 font-['Plus_Jakarta_Sans:SemiBold'] font-semibold min-w-0 relative text-[#191b14]">
                    {row.value}
                  </p>
                </div>
              ))}
              <button
                type="button"
                onClick={() => setSourceModalOpen(true)}
                className="[text-underline-position:from-font] decoration-from-font decoration-solid font-['Plus_Jakarta_Sans:SemiBold'] font-semibold relative shrink-0 text-[#191b14] text-left underline w-full hover:opacity-80"
              >
                {lang === "vi"
                  ? "Mở bản tin gốc · nchmf.gov.vn"
                  : "Open original bulletin · nchmf.gov.vn"}
              </button>
            </div>

            {/* Evacuation / shelter */}
            <div
              className="[word-break:break-word] bg-[#fff3e6] border-2 border-[#c2410c] border-solid flex flex-col gap-[6px] items-start pb-[16px] pt-[14px] px-[16px] relative rounded-[20px] w-full"
              data-name="Evacuation / shelter (only if published)"
            >
              <p className="font-['Plus_Jakarta_Sans:SemiBold'] font-semibold leading-[18px] relative shrink-0 text-[#9a3412] text-[13px] tracking-[0.78px] uppercase w-full">
                {lang === "vi" ? "Hướng dẫn sơ tán / nơi trú ẩn" : "Evacuation / shelter guidance"}
              </p>
              <p className="font-['Plus_Jakarta_Sans:Bold'] font-bold leading-[26px] relative shrink-0 text-[#191b14] text-[18px] tracking-[-0.09px] w-full">
                {lang === "vi"
                  ? "[Nguyên văn hướng dẫn sơ tán hoặc nơi trú ẩn, nếu bản tin có. Nếu không có, khối này không hiện.]"
                  : "[Verbatim evacuation or shelter instructions if published in the bulletin. Hidden when absent.]"}
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-[16px] w-full">
            {/* Original text */}
            <div
              className="[word-break:break-word] bg-[#fff3e6] border-[#f5c38a] border-[1.5px] border-solid flex flex-col gap-[6px] items-start pb-[16px] pt-[14px] px-[16px] relative rounded-[20px] w-full"
              data-name="Original text"
            >
              <p className="font-['Plus_Jakarta_Sans:SemiBold'] font-semibold leading-[18px] relative shrink-0 text-[#9a3412] text-[13px] tracking-[0.78px] uppercase w-full">
                {lang === "vi" ? "Nguyên văn bản tin" : "Verbatim bulletin"}
              </p>
              <p className="font-['Plus_Jakarta_Sans:Regular'] font-normal leading-[24px] relative shrink-0 text-[#191b14] text-[16px] w-full">
                {lang === "vi"
                  ? "[Trích nguyên văn phần hướng dẫn của bản tin chính thức]"
                  : "[Verbatim excerpt of official bulletin guidance]"}
              </p>
            </div>

            {/* Paraphrase */}
            <div
              className="[word-break:break-word] bg-[#eceee6] flex flex-col gap-[6px] items-start pb-[16px] pt-[14px] px-[16px] relative rounded-[20px] w-full"
              data-name="Paraphrase (under the original)"
            >
              <p className="font-['Plus_Jakarta_Sans:SemiBold'] font-semibold leading-[18px] relative shrink-0 text-[#5d6157] text-[13px] tracking-[0.78px] uppercase w-full">
                {lang === "vi"
                  ? "Tóm tắt — không thay thế bản tin"
                  : "Summary — does not replace bulletin"}
              </p>
              <p className="font-['Plus_Jakarta_Sans:Regular'] font-normal leading-[24px] relative shrink-0 text-[#191b14] text-[16px] w-full">
                {lang === "vi"
                  ? "[Tóm tắt chỉ sinh từ các trường của bản tin. Trường nào thiếu thì ghi là thiếu. Không làm nhẹ đi lời bản tin.]"
                  : "[Summary generated strictly from bulletin fields. Missing fields are stated as missing. Never softens official wording.]"}
              </p>
            </div>

            {/* Routing consequence */}
            <div
              className="[word-break:break-word] bg-[#eceee6] flex flex-col font-['Plus_Jakarta_Sans:SemiBold'] font-semibold gap-[6px] items-start pb-[16px] pt-[14px] px-[16px] relative rounded-[20px] w-full"
              data-name="Routing consequence"
            >
              <p className="leading-[18px] relative shrink-0 text-[#5d6157] text-[13px] tracking-[0.78px] uppercase w-full">
                {lang === "vi" ? "Ảnh hưởng đến gợi ý đường" : "Effect on route guidance"}
              </p>
              <p className="leading-[24px] relative shrink-0 text-[#191b14] text-[16px] w-full">
                {lang === "vi"
                  ? "Cảnh báo chính thức đang có hiệu lực. Ảnh người dân không thể hạ mức này."
                  : "Official warning is in force. Crowd photos cannot lower this floor."}
              </p>
            </div>

            {/* Emergency */}
            <div
              className="[word-break:break-word] bg-white flex flex-col gap-[6px] items-start pb-[16px] pt-[14px] px-[16px] relative rounded-[20px] shadow-[0px_4px_16px_0px_rgba(26,28,20,0.06)] w-full"
              data-name="Emergency"
            >
              <p className="font-['Plus_Jakarta_Sans:SemiBold'] font-semibold leading-[18px] relative shrink-0 text-[#5d6157] text-[13px] tracking-[0.78px] uppercase w-full">
                {lang === "vi" ? "Khẩn cấp" : "Emergency"}
              </p>
              <p className="font-['Plus_Jakarta_Sans:Bold'] font-bold leading-[26px] relative shrink-0 text-[#191b14] text-[18px] tracking-[-0.09px] w-full">
                {lang === "vi"
                  ? "113 · 114 · 115. FloodScout không phải đơn vị cứu hộ."
                  : "113 · 114 · 115. FloodScout is not a rescue service."}
              </p>
              <p className="font-['Plus_Jakarta_Sans:Regular'] font-normal leading-[24px] relative shrink-0 text-[#5d6157] text-[16px] w-full">
                {lang === "vi"
                  ? "[Đường dây nóng in trong bản tin, nếu có]"
                  : "[Hotlines printed in the bulletin, if any]"}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Action Bar */}
      <div
        className="bg-white border-[#dfe1d8] border-solid border-t flex flex-col items-center pb-[20px] pt-[16px] px-[16px] md:px-6 w-full"
        data-name="Action bar"
      >
        <div className="w-full max-w-md">
          <ButtonPrimary
            label={lang === "vi" ? "Mở bản tin gốc" : "Open original bulletin"}
            onClick={() => setSourceModalOpen(true)}
          />
        </div>
      </div>

      {/* Original Bulletin External Link Preview */}
      {sourceModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/45 flex items-end md:items-center justify-center p-0 md:p-6"
          onClick={() => setSourceModalOpen(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-tl-[28px] rounded-tr-[28px] md:rounded-[28px] w-full max-w-[440px] p-[20px] flex flex-col gap-[14px] shadow-[0px_8px_24px_rgba(26,28,20,0.2)]"
          >
            <p className="font-['Plus_Jakarta_Sans:SemiBold'] text-[13px] tracking-[0.78px] uppercase text-[#9a3412]">
              nchmf.gov.vn
            </p>
            <h3 className="font-['Plus_Jakarta_Sans:Bold'] font-bold text-[20px] leading-[28px] text-[#191b14]">
              {lang === "vi"
                ? "Bản tin gốc Trung tâm Dự báo KTTV Quốc gia"
                : "Original NCHMF Official Bulletin"}
            </h3>
            <p className="font-['Plus_Jakarta_Sans:Regular'] text-[16px] leading-[24px] text-[#5d6157]">
              {lang === "vi"
                ? "Trong môi trường dữ liệu demo, liên kết trỏ tới cổng thông tin chính thức nchmf.gov.vn để đối chiếu nguyên văn bản tin."
                : "In demo mode, this opens the official nchmf.gov.vn portal so you can verify the verbatim bulletin."}
            </p>
            <div className="flex gap-[10px] pt-[4px]">
              <button
                type="button"
                onClick={() => setSourceModalOpen(false)}
                className="flex-1 min-h-[48px] rounded-[999px] border-[1.5px] border-[#dfe1d8] font-['Plus_Jakarta_Sans:SemiBold'] text-[16px] text-[#191b14]"
              >
                {lang === "vi" ? "Đóng" : "Close"}
              </button>
              <a
                href="https://nchmf.gov.vn"
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setSourceModalOpen(false)}
                className="flex-1 min-h-[48px] rounded-[999px] bg-[#191b14] flex items-center justify-center font-['Plus_Jakarta_Sans:Bold'] text-[16px] text-white"
              >
                nchmf.gov.vn
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
