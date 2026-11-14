import React from "react";
import { ASSETS } from "../assets";
import type { Language } from "../types";

export type MapVariant = "home" | "home-degraded" | "route-found" | "route-blocked";

interface FloodMapCanvasProps {
  variant: MapVariant;
  zoom?: number;
  pan?: { x: number; y: number };
  onPanChange?: (next: { x: number; y: number }) => void;
  showCrowdLayer?: boolean;
  lang?: Language;
  destinationLabel?: string;
  latestReportTag?: string;
  onOpenSegment?: () => void;
  onTapDestination?: () => void;
}

export function FloodMapCanvas({
  variant,
  zoom = 1,
  pan = { x: 0, y: 0 },
  onPanChange,
  showCrowdLayer = true,
  lang = "vi",
  destinationLabel = "Biblio",
  latestReportTag = "Ngang bánh xe · 20 phút",
  onOpenSegment,
  onTapDestination,
}: FloodMapCanvasProps) {
  const dragRef = React.useRef<{
    startX: number;
    startY: number;
    originX: number;
    originY: number;
    dragging: boolean;
  } | null>(null);

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!onPanChange) return;
    if ((e.target as HTMLElement).closest("button")) return;
    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      originX: pan.x,
      originY: pan.y,
      dragging: true,
    };
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragRef.current?.dragging || !onPanChange) return;
    const dx = e.clientX - dragRef.current.startX;
    const dy = e.clientY - dragRef.current.startY;
    onPanChange({
      x: Math.max(-220, Math.min(220, dragRef.current.originX + dx)),
      y: Math.max(-220, Math.min(220, dragRef.current.originY + dy)),
    });
  };

  const handlePointerUp = () => {
    if (dragRef.current) {
      dragRef.current.dragging = false;
    }
  };

  // Vertical offset on compact result screens so the route & streets frame cleanly above the result sheet
  const stageOffsetY = variant === "route-found" || variant === "route-blocked" ? -105 : 0;

  return (
    <div
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      className="absolute inset-0 overflow-hidden bg-[#ecede6] select-none touch-none"
      data-name="Map stage"
    >
      {/* 1:1 Pilot Extract Coordinate Stage (preserves exact 390x844 SVG geometry without stretching) */}
      <div
        className="absolute left-1/2 top-0 md:top-1/2 w-[390px] h-[844px] origin-center transition-transform duration-150 ease-out"
        style={{
          transform: `translate(-50%, ${stageOffsetY}px) translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
        }}
      >
        <div className="md:-translate-y-1/2 relative w-[390px] h-[844px]">
          {/* Seamless wide-viewport continuation of pilot blocks & streets outside x=[0..390] */}
          <svg
            width="2790"
            height="1644"
            viewBox="-1200 -400 2790 1644"
            fill="none"
            aria-hidden="true"
            className="pointer-events-none absolute left-[-1200px] top-[-400px] hidden md:block"
          >
            <rect x="-1200" y="-400" width="2790" height="1644" fill="#E2E4DA" />
            {/* Vertical continuation streets */}
            {[
              -1050, -880, -710, -540, -370, -200, -30, 120, 291, 460, 630, 800, 970, 1140, 1310,
              1480,
            ].map((vx) => (
              <rect key={vx} x={vx - 6} y="-400" width="13" height="1644" fill="white" />
            ))}
            {/* Horizontal continuation streets */}
            <rect x="-1200" y="-12" width="2790" height="14" fill="white" />
            <rect x="-1200" y="338" width="2790" height="14" fill="white" />
            <rect x="-1200" y="836" width="2790" height="14" fill="white" />
            {/* Diagonal Nguyễn Trãi continuation: y(x) = 560 - 130*(x+20)/430 */}
            <line x1="-1200" y1="916.74" x2="1590" y2="73.26" stroke="white" strokeWidth="30" />
            {variant === "home-degraded" && (
              <g stroke="#6B7280" strokeWidth="5" strokeDasharray="8 8">
                <line x1="-1200" y1="345" x2="1590" y2="345" />
                <line x1="-1200" y1="916.74" x2="1590" y2="73.26" />
              </g>
            )}
          </svg>

          {/* Exact Figma Map Base SVG (width=390, height=844 preserved) */}
          <img
            alt=""
            className="relative block max-w-none pointer-events-none"
            src={ASSETS.mapBasePilotExtract}
          />

          {/* Dynamic Road State Overlays for Degraded, Route Found, and Route Blocked variants */}
          <svg
            width="390"
            height="844"
            viewBox="0 0 390 844"
            fill="none"
            className="pointer-events-none absolute left-0 top-0"
            aria-hidden="true"
          >
            {variant === "home-degraded" && (
              <g stroke="#6B7280" strokeWidth="5" strokeDasharray="8 8" strokeLinecap="round">
                <line x1="120" y1="0" x2="120" y2="844" />
                <line x1="291" y1="0" x2="291" y2="844" />
                <line x1="0" y1="345" x2="390" y2="345" />
                <line x1="-20" y1="560" x2="410" y2="430" />
              </g>
            )}

            {variant === "route-found" && (
              <g>
                {/* Red Tránh segment on lower Nguyễn Trãi */}
                <line
                  x1="12"
                  y1="550"
                  x2="148"
                  y2="509"
                  stroke="#B91C1C"
                  strokeWidth="8"
                  strokeLinecap="round"
                />
                {/* Safe detour polyline from Bạn (210, 468) avoiding lower Nguyễn Trãi up to Biblio (291, 298) */}
                <path
                  d="M 210 470 L 210 400 L 120 400 L 120 345 L 291 345 L 291 312"
                  stroke="#191B14"
                  strokeWidth="6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </g>
            )}

            {variant === "route-blocked" && (
              <g>
                {/* Both main corridors marked Tránh (#B91C1C, 8px) */}
                <line x1="0" y1="345" x2="390" y2="345" stroke="#B91C1C" strokeWidth="8" />
                <line x1="-20" y1="560" x2="410" y2="430" stroke="#B91C1C" strokeWidth="8" />
              </g>
            )}
          </svg>

          {/* Street Labels */}
          {variant !== "route-blocked" && (
            <p
              className={`[word-break:break-word] absolute font-['Plus_Jakarta_Sans:SemiBold'] font-semibold leading-[20px] text-[#5d6157] text-[14px] whitespace-nowrap pointer-events-none ${
                variant === "route-found" ? "left-[136px] top-[362px]" : "left-[20px] top-[358px]"
              }`}
            >
              Nguyễn Như Kon Tum
            </p>
          )}

          {variant !== "route-blocked" && (
            <div className="absolute flex h-[41.98px] items-center justify-center left-[236px] top-[497.17px] w-[81.409px] pointer-events-none">
              <div className="flex-none rotate-[-16.8deg]">
                <p className="[word-break:break-word] font-['Plus_Jakarta_Sans:SemiBold'] font-semibold leading-[20px] relative text-[#5d6157] text-[14px] whitespace-nowrap">
                  Nguyễn Trãi
                </p>
              </div>
            </div>
          )}

          {/* Destination Pin (Biblio) */}
          {variant !== "route-blocked" && (
            <button
              type="button"
              onClick={onTapDestination}
              className={`absolute flex flex-col items-center transition-transform hover:scale-105 ${
                variant === "route-found"
                  ? "left-[273px] top-[280px]"
                  : "left-[225.5px] top-[311px]"
              }`}
              data-name="Map/Destination pin"
            >
              <span
                className="flex items-center justify-center shrink-0 size-[36px]"
                data-name="icon/pin"
              >
                <img alt="" className="block max-w-none shrink-0" src={ASSETS.iconPin} />
              </span>
              {variant !== "route-found" && (
                <span className="[word-break:break-word] font-['Plus_Jakarta_Sans:SemiBold'] font-semibold leading-[20px] relative shrink-0 text-[#191b14] text-[14px] whitespace-nowrap">
                  {destinationLabel}
                </span>
              )}
            </button>
          )}

          {/* Crowd Report Markers */}
          {showCrowdLayer && (variant === "home" || variant === "home-degraded") && (
            <>
              {/* Ageing marker on vertical road */}
              <button
                type="button"
                onClick={onOpenSegment}
                aria-label={
                  lang === "vi"
                    ? "Mở đoạn đường có báo cáo đang giảm trọng số"
                    : "Open road segment with ageing crowd report"
                }
                className="absolute left-[110px] top-[378px] h-[64px] w-[20px] rounded-[10px] bg-[#86b6f2] border-[#2563eb] border-[1.5px] border-dashed transition-transform hover:scale-105"
                data-name="Map/Report marker (ageing)"
              />

              {/* Fresh marker on Nguyễn Trãi */}
              <button
                type="button"
                onClick={onOpenSegment}
                aria-label={
                  lang === "vi" ? "Mở đoạn Đầu ngõ Nguyễn Trãi" : "Open Nguyễn Trãi segment details"
                }
                className="absolute flex h-[46.893px] items-center justify-center left-[41.16px] top-[503.55px] w-[97.683px] group"
                data-name="Map/Report marker (fresh)"
              >
                <span className="flex-none rotate-[-16.8deg]">
                  <span className="block h-[20px] w-[96px] rounded-[10px] bg-[#2563eb] group-hover:brightness-110 transition" />
                </span>
              </button>

              {/* Report Tag */}
              <button
                type="button"
                onClick={onOpenSegment}
                className="absolute bg-white drop-shadow-[0px_8px_12px_rgba(26,28,20,0.14)] flex items-start left-[20px] px-[12px] py-[6px] rounded-[999px] top-[480px] transition-transform hover:scale-[1.02] active:scale-95"
                data-name="Map/Report tag"
              >
                <span className="[word-break:break-word] font-['Plus_Jakarta_Sans:SemiBold'] font-semibold leading-[20px] relative shrink-0 text-[#191b14] text-[14px] whitespace-nowrap">
                  {latestReportTag}
                </span>
              </button>
            </>
          )}

          {showCrowdLayer && variant === "route-found" && (
            <button
              type="button"
              onClick={onOpenSegment}
              aria-label="Đầu ngõ Nguyễn Trãi"
              className="absolute flex h-[54px] items-center justify-center left-[18px] top-[500px] w-[138px]"
            >
              <span className="flex-none rotate-[-16.8deg]">
                <span className="block h-[20px] w-[134px] rounded-[10px] bg-[#2563eb]/90" />
              </span>
            </button>
          )}

          {showCrowdLayer && variant === "route-blocked" && (
            <>
              <button
                type="button"
                onClick={onOpenSegment}
                aria-label="Nguyễn Như Kon Tum"
                className="absolute left-[48px] top-[335px] h-[20px] w-[132px] rounded-[10px] bg-[#2563eb]/90"
              />
              <button
                type="button"
                onClick={onOpenSegment}
                aria-label="Đầu ngõ Nguyễn Trãi"
                className="absolute flex h-[52px] items-center justify-center left-[22px] top-[502px] w-[132px]"
              >
                <span className="flex-none rotate-[-16.8deg]">
                  <span className="block h-[20px] w-[128px] rounded-[10px] bg-[#2563eb]/90" />
                </span>
              </button>
            </>
          )}

          {/* Map/You Marker */}
          <div
            className={`absolute size-[48px] pointer-events-none ${
              variant === "route-found"
                ? "left-[186px] top-[448px]"
                : variant === "route-blocked"
                  ? "left-[248px] top-[446px]"
                  : "left-[186px] top-[431px]"
            }`}
            data-name="Map/You"
          >
            <img alt="" className="block max-w-none shrink-0" src={ASSETS.mapYou} />
          </div>
          {(variant === "home" || variant === "home-degraded") && (
            <p className="[word-break:break-word] absolute font-['Plus_Jakarta_Sans:SemiBold'] font-semibold leading-[20px] left-[198px] text-[#2563eb] text-[14px] top-[478px] whitespace-nowrap pointer-events-none">
              {lang === "vi" ? "Bạn" : "You"}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
