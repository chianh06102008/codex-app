import React, { useState } from "react";
import { ButtonSecondary, HeaderBack, ToggleSwitch } from "../components/SharedPrimitives";
import type { Language, TextSize } from "../types";

interface SettingsScreenProps {
  lang: Language;
  onChangeLang: (lang: Language) => void;
  textSize: TextSize;
  onChangeTextSize: (size: TextSize) => void;
  dataSaver: boolean;
  onChangeDataSaver: (val: boolean) => void;
  preciseLocationConsent: boolean;
  onChangePreciseLocationConsent: (val: boolean) => void;
  photoConsent: boolean;
  onChangePhotoConsent: (val: boolean) => void;
  ownReportCount: number;
  onDeleteOwnReports: () => void;
  onBack: () => void;
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
  const [deletedNotice, setDeletedNotice] = useState(false);

  const textSizeOptions: Array<{
    id: TextSize;
    labelVi: string;
    labelEn: string;
  }> = [
    { id: "default", labelVi: "Mặc định", labelEn: "Default" },
    { id: "large", labelVi: "Lớn", labelEn: "Large" },
    { id: "xlarge", labelVi: "Rất lớn", labelEn: "Extra large" },
  ];

  const handleDelete = () => {
    onDeleteOwnReports();
    setDeletedNotice(true);
    window.setTimeout(() => setDeletedNotice(false), 3000);
  };

  return (
    <div className="bg-[#f3f4ef] flex flex-col min-h-dvh w-full" data-name="S8 Settings — Cài đặt">
      <div className="w-full max-w-5xl mx-auto flex flex-col">
        {/* Top */}
        <div
          className="flex flex-col items-start pb-[4px] pt-[16px] px-[16px] md:px-6 w-full"
          data-name="Top"
        >
          <HeaderBack
            title={lang === "vi" ? "Cài đặt" : "Settings"}
            showSubtitle={false}
            onBack={onBack}
            lang={lang}
          />
        </div>

        {/* Settings Groups */}
        <div
          className="grid grid-cols-1 lg:grid-cols-2 gap-[22px] items-start pb-[28px] pt-[12px] px-[16px] md:px-6 w-full"
          data-name="Settings"
        >
          <div className="flex flex-col gap-[22px] w-full">
            {/* Group/Ngôn ngữ */}
            <div
              className="flex flex-col gap-[8px] items-start relative shrink-0 w-full"
              data-name="Group/Ngôn ngữ"
            >
              <p className="[word-break:break-word] font-['Plus_Jakarta_Sans:SemiBold'] font-semibold leading-[18px] relative shrink-0 text-[#5d6157] text-[13px] tracking-[0.78px] uppercase w-full">
                {lang === "vi" ? "Ngôn ngữ" : "Language"}
              </p>
              <div
                role="radiogroup"
                aria-label={lang === "vi" ? "Ngôn ngữ" : "Language"}
                className="bg-[#eceee6] flex gap-[6px] items-start p-[6px] relative rounded-[20px] shrink-0 w-full"
                data-name="Language"
              >
                <button
                  type="button"
                  role="radio"
                  aria-checked={lang === "vi"}
                  onClick={() => onChangeLang("vi")}
                  className={`flex flex-1 items-center justify-center min-h-[48px] min-w-0 py-[12px] relative rounded-[12px] transition ${
                    lang === "vi"
                      ? "bg-white shadow-[0px_2px_8px_0px_rgba(18,23,38,0.1)]"
                      : "hover:bg-white/40"
                  }`}
                >
                  <span
                    className={`[word-break:break-word] font-['Plus_Jakarta_Sans:SemiBold'] font-semibold leading-[24px] relative shrink-0 text-[16px] whitespace-nowrap ${
                      lang === "vi" ? "text-[#191b14]" : "text-[#5d6157]"
                    }`}
                  >
                    Tiếng Việt
                  </span>
                </button>
                <button
                  type="button"
                  role="radio"
                  aria-checked={lang === "en"}
                  onClick={() => onChangeLang("en")}
                  className={`flex flex-1 items-center justify-center min-h-[48px] min-w-0 py-[12px] relative rounded-[12px] transition ${
                    lang === "en"
                      ? "bg-white shadow-[0px_2px_8px_0px_rgba(18,23,38,0.1)]"
                      : "hover:bg-white/40"
                  }`}
                >
                  <span
                    className={`[word-break:break-word] font-['Plus_Jakarta_Sans:SemiBold'] font-semibold leading-[24px] relative shrink-0 text-[16px] whitespace-nowrap ${
                      lang === "en" ? "text-[#191b14]" : "text-[#5d6157]"
                    }`}
                  >
                    English
                  </span>
                </button>
              </div>
            </div>

            {/* Group/Cỡ chữ */}
            <div
              className="flex flex-col gap-[8px] items-start relative shrink-0 w-full"
              data-name="Group/Cỡ chữ"
            >
              <p className="[word-break:break-word] font-['Plus_Jakarta_Sans:SemiBold'] font-semibold leading-[18px] relative shrink-0 text-[#5d6157] text-[13px] tracking-[0.78px] uppercase w-full">
                {lang === "vi" ? "Cỡ chữ" : "Text size"}
              </p>
              <div
                role="radiogroup"
                aria-label={lang === "vi" ? "Cỡ chữ" : "Text size"}
                className="bg-[#eceee6] flex gap-[6px] items-start p-[6px] relative rounded-[20px] shrink-0 w-full"
                data-name="Text size"
              >
                {textSizeOptions.map((opt) => {
                  const selected = textSize === opt.id;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      role="radio"
                      aria-checked={selected}
                      onClick={() => onChangeTextSize(opt.id)}
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
                        {lang === "vi" ? opt.labelVi : opt.labelEn}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Group/Hiển thị */}
            <div
              className="flex flex-col gap-[8px] items-start relative shrink-0 w-full"
              data-name="Group/Hiển thị"
            >
              <p className="[word-break:break-word] font-['Plus_Jakarta_Sans:SemiBold'] font-semibold leading-[18px] relative shrink-0 text-[#5d6157] text-[13px] tracking-[0.78px] uppercase w-full">
                {lang === "vi" ? "Hiển thị" : "Display"}
              </p>
              <div
                className="bg-white flex flex-col items-start px-[16px] py-[4px] relative rounded-[20px] shadow-[0px_4px_16px_0px_rgba(26,28,20,0.06)] shrink-0 w-full"
                data-name="Display card"
              >
                <div
                  className="flex gap-[12px] items-center min-h-[64px] py-[12px] relative shrink-0 w-full"
                  data-name="Settings row"
                >
                  <div className="[word-break:break-word] flex flex-1 flex-col gap-[2px] items-start leading-[24px] min-w-0 relative text-[16px]">
                    <p className="font-['Plus_Jakarta_Sans:SemiBold'] font-semibold relative shrink-0 text-[#191b14] w-full">
                      {lang === "vi" ? "Tiết kiệm dữ liệu" : "Data saver"}
                    </p>
                    <p className="font-['Plus_Jakarta_Sans:Regular'] font-normal relative shrink-0 text-[#5d6157] w-full">
                      {lang === "vi"
                        ? "Chỉ bản đồ và cảnh báo. Không ảnh vệ tinh. Ảnh nén nhỏ."
                        : "Map and warnings only. No satellite imagery. Compressed photos."}
                    </p>
                  </div>
                  <ToggleSwitch
                    checked={dataSaver}
                    onChange={onChangeDataSaver}
                    label={lang === "vi" ? "Tiết kiệm dữ liệu" : "Data saver"}
                    lang={lang}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-[22px] w-full">
            {/* Group/Quyền và đồng ý */}
            <div
              className="flex flex-col gap-[8px] items-start relative shrink-0 w-full"
              data-name="Group/Quyền và đồng ý"
            >
              <p className="[word-break:break-word] font-['Plus_Jakarta_Sans:SemiBold'] font-semibold leading-[18px] relative shrink-0 text-[#5d6157] text-[13px] tracking-[0.78px] uppercase w-full">
                {lang === "vi" ? "Quyền và đồng ý" : "Permissions & consent"}
              </p>
              <div
                className="bg-white flex flex-col items-start px-[16px] py-[4px] relative rounded-[20px] shadow-[0px_4px_16px_0px_rgba(26,28,20,0.06)] shrink-0 w-full"
                data-name="Consent card"
              >
                <div className="flex gap-[12px] items-center min-h-[64px] py-[12px] relative shrink-0 w-full">
                  <div className="[word-break:break-word] flex flex-1 flex-col gap-[2px] items-start leading-[24px] min-w-0 relative text-[16px]">
                    <p className="font-['Plus_Jakarta_Sans:SemiBold'] font-semibold relative shrink-0 text-[#191b14] w-full">
                      {lang === "vi" ? "Vị trí chính xác" : "Precise location"}
                    </p>
                    <p className="font-['Plus_Jakarta_Sans:Regular'] font-normal relative shrink-0 text-[#5d6157] w-full">
                      {lang === "vi"
                        ? "Chỉ khi bạn gửi báo cáo hoặc hỏi đường. Không theo dõi liên tục."
                        : "Only when you submit a report or ask for a route. No continuous tracking."}
                    </p>
                  </div>
                  <ToggleSwitch
                    checked={preciseLocationConsent}
                    onChange={onChangePreciseLocationConsent}
                    label={lang === "vi" ? "Vị trí chính xác" : "Precise location"}
                    lang={lang}
                  />
                </div>

                <div className="bg-[#cdd1c6] h-px relative shrink-0 w-full" data-name="Divider" />

                <div className="flex gap-[12px] items-center min-h-[64px] py-[12px] relative shrink-0 w-full">
                  <div className="[word-break:break-word] flex flex-1 flex-col gap-[2px] items-start leading-[24px] min-w-0 relative text-[16px]">
                    <p className="font-['Plus_Jakarta_Sans:SemiBold'] font-semibold relative shrink-0 text-[#191b14] w-full">
                      {lang === "vi" ? "Ảnh" : "Photos"}
                    </p>
                    <p className="font-['Plus_Jakarta_Sans:Regular'] font-normal relative shrink-0 text-[#5d6157] w-full">
                      {lang === "vi"
                        ? "Chỉ khi bạn báo cáo. Mặt người và biển số được làm mờ trên máy."
                        : "Only when you report. Faces and license plates are blurred on device."}
                    </p>
                  </div>
                  <ToggleSwitch
                    checked={photoConsent}
                    onChange={onChangePhotoConsent}
                    label={lang === "vi" ? "Ảnh" : "Photos"}
                    lang={lang}
                  />
                </div>
              </div>

              <div
                className="bg-[#eceee6] flex flex-col items-start px-[16px] py-[14px] relative rounded-[20px] shrink-0 w-full"
                data-name="Cross-border notice (F80)"
              >
                <p className="[word-break:break-word] font-['Plus_Jakarta_Sans:Regular'] font-normal leading-[24px] relative shrink-0 text-[#191b14] text-[16px] w-full">
                  {lang === "vi"
                    ? "Ảnh được phân tích trên máy chủ đặt ngoài Việt Nam ([nơi đặt máy chủ]). Bạn có thể rút lại đồng ý bất cứ lúc nào."
                    : "Photos are analyzed on servers located outside Vietnam ([server region]). You may withdraw consent at any time."}
                </p>
              </div>
            </div>

            {/* Group/Dữ liệu của bạn */}
            <div
              className="flex flex-col gap-[8px] items-start relative shrink-0 w-full"
              data-name="Group/Dữ liệu của bạn"
            >
              <p className="[word-break:break-word] font-['Plus_Jakarta_Sans:SemiBold'] font-semibold leading-[18px] relative shrink-0 text-[#5d6157] text-[13px] tracking-[0.78px] uppercase w-full">
                {lang === "vi" ? "Dữ liệu của bạn" : "Your data"}
              </p>
              <div
                className="bg-white flex flex-col gap-[14px] items-start p-[16px] relative rounded-[20px] shadow-[0px_4px_16px_0px_rgba(26,28,20,0.06)] shrink-0 w-full"
                data-name="Retention card (F76)"
              >
                <p className="[word-break:break-word] font-['Plus_Jakarta_Sans:Regular'] font-normal leading-[24px] relative shrink-0 text-[#191b14] text-[16px] w-full">
                  {lang === "vi"
                    ? "Ảnh được giữ tối đa 7 ngày. Sau đó chỉ giữ mức nước, đoạn đường và thời gian. Báo cáo không có tài khoản được tính nhẹ hơn."
                    : "Photos are kept up to 7 days. Afterwards only water depth, segment, and timestamp remain. Unauthenticated reports carry lower weight."}
                </p>
                <ButtonSecondary
                  danger
                  label={
                    deletedNotice
                      ? lang === "vi"
                        ? "Đã xoá báo cáo trên thiết bị này"
                        : "Your reports have been deleted"
                      : ownReportCount > 0
                        ? lang === "vi"
                          ? `Xoá báo cáo của tôi (${ownReportCount})`
                          : `Delete my reports (${ownReportCount})`
                        : lang === "vi"
                          ? "Xoá báo cáo của tôi"
                          : "Delete my reports"
                  }
                  onClick={handleDelete}
                  className="bg-white border-[#dfe1d8] border-[1.5px] border-solid flex items-center justify-center min-h-[48px] px-[18px] py-[12px] relative rounded-[999px] shrink-0 w-full hover:bg-[#fef2f2] transition-colors"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
