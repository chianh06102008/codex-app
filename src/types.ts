export type ScreenId =
  | "home"
  | "warning"
  | "ask"
  | "route-found"
  | "route-blocked"
  | "segment"
  | "report"
  | "settings"
  | "speed-gate";

export type Language = "vi" | "en";
export type TextSize = "default" | "large" | "xlarge";
export type TravelMode = "motorbike" | "walk" | "car";
export type DepthCategory = "ankle" | "wheel" | "unsure";

export interface CrowdReportItem {
  id: string;
  segmentName: string;
  titleVi: string;
  titleEn: string;
  detailVi: string;
  detailEn: string;
  freshnessVi: string;
  freshnessEn: string;
  swatchColor: "#b91c1c" | "#d97706";
  expired?: boolean;
  hasPhoto?: boolean;
  isOwn?: boolean;
  photoCaptionVi?: string;
  photoCaptionEn?: string;
}
