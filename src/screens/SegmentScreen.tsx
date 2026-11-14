import React, { useState } from "react";
import { HeaderBack } from "../components/SharedPrimitives";
import type { CrowdReportItem, Language } from "../types";

interface SegmentScreenProps {
  lang: Language;
  reports: CrowdReportItem[];
  dataSaver: boolean;
  onBack: () => void;
  onOpenBulletin: () => void;
}

export function SegmentScreen({
  lang,
  reports,
  dataSaver,
  onBack,
  onOpenBulletin,
}: SegmentScreenProps) {
  const [activePhotoReport, setActivePhotoReport] = useState<CrowdReportItem | null>(null);

  return (
    <div
      className="bg-[#f3f4ef] flex flex-col min-h-dvh w-full"
      data-name="S5 Segment — Vì sao đoạn này"
    >
      <div className="w-full max-w-5xl mx-auto flex flex-col">
        {/* Top */}
        <div
          className="flex flex-col items-start pb-[4px] pt-[16px] px-[16px] md:px-6 w-full"
          data-name="Top"
        >
          <HeaderBack
            title="Đầu ngõ Nguyễn Trãi"
            subtitle={lang === "vi" ? "Vì sao đoạn này bị đánh dấu" : "Why this segment is marked"}
            onBack={onBack}
            lang={lang}
          />
        </div>

        {/* Evidence */}
        <div
          className="grid grid-cols-1 lg:grid-cols-2 gap-[16px] items-start pb-[24px] pt-[12px] px-[16px] md:px-6 w-full"
          data-name="Evidence"
        >
          <div className="flex flex-col gap-[16px] w-full">
            {/* Segment state */}
            <div
              className="bg-white flex gap-[14px] items-start p-[16px] relative rounded-[20px] shadow-[0px_4px_16px_0px_rgba(26,28,20,0.06)] w-full"
              data-name="Segment state"
            >
              <div
                className="bg-[#b91c1c] relative rounded-[4px] self-stretch shrink-0 w-[8px]"
                data-name="State bar"
              />
              <div
                className="[word-break:break-word] flex flex-1 flex-col gap-[2px] items-start min-w-0 relative"
                data-name="Copy"
              >
                <p className="font-['Plus_Jakarta_Sans:SemiBold'] font-semibold leading-[18px] relative shrink-0 text-[#5d6157] text-[13px] tracking-[0.78px] uppercase w-full">
                  {lang === "vi" ? "Trạng thái" : "Status"}
                </p>
                <p className="font-['Plus_Jakarta_Sans:ExtraBold'] font-extrabold leading-[32px] relative shrink-0 text-[#191b14] text-[26px] tracking-[-0.39px] w-full">
                  {lang === "vi" ? "Tránh" : "Avoid"}
                </p>
                <p className="font-['Plus_Jakarta_Sans:Regular'] font-normal leading-[24px] relative shrink-0 text-[#5d6157] text-[16px] w-full">
                  {lang === "vi"
                    ? "Không gợi ý đường đi qua đoạn này cho xe máy và đi bộ."
                    : "Routes through this segment are not suggested for motorbikes or pedestrians."}
                </p>
              </div>
            </div>

            {/* Official floor */}
            <div
              className="[word-break:break-word] bg-[#fff3e6] border-2 border-[#c2410c] border-solid flex flex-col gap-[6px] items-start pb-[16px] pt-[14px] px-[16px] relative rounded-[20px] w-full"
              data-name="Official floor"
            >
              <p className="font-['Plus_Jakarta_Sans:SemiBold'] font-semibold leading-[18px] relative shrink-0 text-[#9a3412] text-[13px] tracking-[0.78px] uppercase w-full">
                {lang === "vi" ? "Mức sàn chính thức" : "Official floor"}
              </p>
              <p className="font-['Plus_Jakarta_Sans:SemiBold'] font-semibold leading-[24px] relative shrink-0 text-[#191b14] text-[16px] w-full">
                {lang === "vi"
                  ? "Cảnh báo mưa lớn · Trung tâm Dự báo KTTV Quốc gia · [GIỜ]"
                  : "Heavy rain warning · NCHMF · [TIME]"}
              </p>
              <p className="font-['Plus_Jakarta_Sans:Regular'] font-normal leading-[24px] relative shrink-0 text-[#191b14] text-[16px] w-full">
                {lang === "vi"
                  ? "Ảnh người dân không thể hạ mức này."
                  : "Crowd photos cannot lower this official floor."}
              </p>
              <button
                type="button"
                onClick={onOpenBulletin}
                className="[text-underline-position:from-font] decoration-from-font decoration-solid font-['Plus_Jakarta_Sans:SemiBold'] font-semibold leading-[24px] relative shrink-0 text-[#191b14] text-[16px] text-left underline whitespace-nowrap hover:opacity-80"
              >
                {lang === "vi" ? "Xem bản tin gốc" : "View original bulletin"}
              </button>
            </div>

            {/* Freshness rule (shown in left column on desktop, bottom on mobile) */}
            <div
              className="hidden lg:flex [word-break:break-word] bg-[#eceee6] flex-col gap-[6px] items-start pb-[16px] pt-[14px] px-[16px] relative rounded-[20px] w-full"
              data-name="Freshness rule desktop"
            >
              <p className="font-['Plus_Jakarta_Sans:SemiBold'] font-semibold leading-[18px] relative shrink-0 text-[#5d6157] text-[13px] tracking-[0.78px] uppercase w-full">
                {lang === "vi" ? "Độ mới" : "Freshness"}
              </p>
              <p className="font-['Plus_Jakarta_Sans:Regular'] font-normal leading-[24px] relative shrink-0 text-[#191b14] text-[16px] w-full">
                {lang === "vi"
                  ? "Báo cáo hết tác dụng sau 12 giờ. Khi đang mưa lớn, trọng số giảm một nửa sau khoảng 45 phút. Ảnh “không thấy nước” không thể gỡ mức sàn chính thức."
                  : 'Reports expire after 12 hours. During heavy rain, weight halves after ~45 minutes. "No water seen" photos cannot lift an official floor.'}
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-[16px] w-full">
            <h2 className="[word-break:break-word] font-['Plus_Jakarta_Sans:Bold'] font-bold leading-[26px] relative shrink-0 text-[#191b14] text-[18px] tracking-[-0.09px]">
              {lang === "vi" ? "Báo cáo của người dân" : "Crowd reports"}
            </h2>

            {reports.map((rep) => (
              <div
                key={rep.id}
                className={`bg-white flex gap-[14px] items-start px-[16px] py-[14px] relative rounded-[20px] shadow-[0px_4px_16px_0px_rgba(26,28,20,0.06)] w-full ${
                  rep.expired ? "opacity-60" : ""
                }`}
              >
                <div className="flex items-start pt-[5px] relative shrink-0">
                  <div
                    className="relative rounded-[3px] shrink-0 size-[16px]"
                    style={{ backgroundColor: rep.swatchColor }}
                  />
                </div>
                <div className="[word-break:break-word] flex flex-1 flex-col gap-[2px] items-start leading-[24px] min-w-0 relative text-[16px]">
                  <p className="font-['Plus_Jakarta_Sans:SemiBold'] font-semibold relative shrink-0 text-[#191b14] w-full">
                    {lang === "vi" ? rep.titleVi : rep.titleEn}
                  </p>
                  <p className="font-['Plus_Jakarta_Sans:Regular'] font-normal relative shrink-0 text-[#5d6157] w-full">
                    {lang === "vi" ? rep.detailVi : rep.detailEn}
                  </p>
                  <p className="font-['Plus_Jakarta_Sans:Regular'] font-normal relative shrink-0 text-[#5d6157] w-full">
                    {lang === "vi" ? rep.freshnessVi : rep.freshnessEn}
                  </p>
                  {rep.hasPhoto && !rep.expired && (
                    <button
                      type="button"
                      onClick={() => setActivePhotoReport(rep)}
                      className="[text-underline-position:from-font] decoration-from-font decoration-solid font-['Plus_Jakarta_Sans:SemiBold'] font-semibold relative shrink-0 text-[#191b14] text-left underline whitespace-nowrap hover:opacity-80"
                    >
                      {lang === "vi" ? "Xem ảnh" : "View photo"}
                    </button>
                  )}
                </div>
              </div>
            ))}

            {/* Freshness rule (mobile) */}
            <div
              className="lg:hidden [word-break:break-word] bg-[#eceee6] flex flex-col gap-[6px] items-start pb-[16px] pt-[14px] px-[16px] relative rounded-[20px] w-full"
              data-name="Freshness rule"
            >
              <p className="font-['Plus_Jakarta_Sans:SemiBold'] font-semibold leading-[18px] relative shrink-0 text-[#5d6157] text-[13px] tracking-[0.78px] uppercase w-full">
                {lang === "vi" ? "Độ mới" : "Freshness"}
              </p>
              <p className="font-['Plus_Jakarta_Sans:Regular'] font-normal leading-[24px] relative shrink-0 text-[#191b14] text-[16px] w-full">
                {lang === "vi"
                  ? "Báo cáo hết tác dụng sau 12 giờ. Khi đang mưa lớn, trọng số giảm một nửa sau khoảng 45 phút. Ảnh “không thấy nước” không thể gỡ mức sàn chính thức."
                  : 'Reports expire after 12 hours. During heavy rain, weight halves after ~45 minutes. "No water seen" photos cannot lift an official floor.'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Redacted Photo Modal */}
      {activePhotoReport && (
        <div
          className="fixed inset-0 z-50 bg-black/55 flex items-end md:items-center justify-center p-0 md:p-6"
          onClick={() => setActivePhotoReport(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-tl-[28px] rounded-tr-[28px] md:rounded-[28px] w-full max-w-[420px] p-[20px] flex flex-col gap-[14px]"
          >
            <div className="flex items-center justify-between">
              <span className="bg-[#191b14] text-white font-['Plus_Jakarta_Sans:SemiBold'] text-[13px] px-[10px] py-[4px] rounded-[999px]">
                {lang === "vi" ? "Dữ liệu demo" : "Demo data"}
              </span>
              <button
                type="button"
                onClick={() => setActivePhotoReport(null)}
                className="font-['Plus_Jakarta_Sans:SemiBold'] text-[15px] text-[#5d6157] px-[12px] py-[6px] rounded-[999px] bg-[#eceee6]"
              >
                {lang === "vi" ? "Đóng" : "Close"}
              </button>
            </div>

            <div className="bg-[#d9dcd2] rounded-[20px] h-[220px] flex flex-col items-center justify-center p-[20px] text-center gap-[8px]">
              <p className="font-['Plus_Jakarta_Sans:SemiBold'] text-[16px] text-[#191b14]">
                {lang === "vi" ? "[Ảnh đường ngập đã làm mờ]" : "[Redacted street flood photo]"}
              </p>
              <p className="font-['Plus_Jakarta_Sans:Regular'] text-[14px] leading-[20px] text-[#5d6157]">
                {dataSaver
                  ? lang === "vi"
                    ? "Chế độ tiết kiệm dữ liệu: đang hiển thị bản nén nhẹ."
                    : "Data saver active: showing low-bandwidth thumbnail."
                  : lang === "vi"
                    ? activePhotoReport.photoCaptionVi ||
                      "Mặt người và biển số đã làm mờ trên thiết bị."
                    : activePhotoReport.photoCaptionEn ||
                      "Faces and license plates redacted on device."}
              </p>
            </div>

            <div className="flex flex-col gap-[2px]">
              <p className="font-['Plus_Jakarta_Sans:Bold'] text-[18px] text-[#191b14]">
                {lang === "vi" ? activePhotoReport.titleVi : activePhotoReport.titleEn}
              </p>
              <p className="font-['Plus_Jakarta_Sans:Regular'] text-[15px] text-[#5d6157]">
                {lang === "vi" ? activePhotoReport.freshnessVi : activePhotoReport.freshnessEn}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
