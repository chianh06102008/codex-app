import type { CrowdReportItem, TravelMode } from "./types";

export const INITIAL_REPORTS: CrowdReportItem[] = [
  {
    id: "rep-1",
    segmentName: "Đầu ngõ Nguyễn Trãi",
    titleVi: "Ngang bánh xe",
    titleEn: "Wheel-hub deep",
    detailVi: "Người báo đã chọn: Bánh xe · AI đề xuất: Bánh xe",
    detailEn: "Reporter selected: Wheel · AI proposed: Wheel",
    freshnessVi: "20 phút trước · đang tính",
    freshnessEn: "20 min ago · active weight",
    swatchColor: "#b91c1c",
    hasPhoto: true,
    photoCaptionVi:
      "Ảnh đường ngập tại Đầu ngõ Nguyễn Trãi (đã làm mờ mặt người và biển số trên máy · dữ liệu demo)",
    photoCaptionEn:
      "Flooded street photo at Nguyễn Trãi alley entrance (faces & plates blurred on device · demo data)",
  },
  {
    id: "rep-2",
    segmentName: "Đầu ngõ Nguyễn Trãi",
    titleVi: "Chưa rõ, có thấy nước",
    titleEn: "Unclear depth, water visible",
    detailVi: "Người báo đã chọn: Chưa rõ · AI: không đủ căn cứ",
    detailEn: "Reporter selected: Unsure · AI: insufficient reference",
    freshnessVi: "1 giờ trước · trọng số đang giảm",
    freshnessEn: "1 hr ago · decaying weight",
    swatchColor: "#b91c1c",
    hasPhoto: true,
    photoCaptionVi:
      "Ảnh mặt nước phản chiếu ban ngày tại Đầu ngõ Nguyễn Trãi (đã làm mờ trên máy · dữ liệu demo)",
    photoCaptionEn:
      "Surface water photo at Nguyễn Trãi alley entrance (redacted on device · demo data)",
  },
  {
    id: "rep-3",
    segmentName: "Đầu ngõ Nguyễn Trãi",
    titleVi: "Ngang mắt cá",
    titleEn: "Ankle deep",
    detailVi: "Người báo đã chọn: Mắt cá · AI đề xuất: Bánh xe",
    detailEn: "Reporter selected: Ankle · AI proposed: Wheel",
    freshnessVi: "13 giờ trước · đã hết hạn, không còn tính",
    freshnessEn: "13 hr ago · expired, no longer counted",
    swatchColor: "#d97706",
    expired: true,
    hasPhoto: false,
  },
];

export function getTravelModeLabel(mode: TravelMode, lang: "vi" | "en"): string {
  if (lang === "en") {
    if (mode === "motorbike") return "Motorbike";
    if (mode === "walk") return "Walk";
    return "Car";
  }
  if (mode === "motorbike") return "Xe máy";
  if (mode === "walk") return "Đi bộ";
  return "Ô tô";
}
