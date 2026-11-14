import React, { useEffect, useState } from "react";
import { INITIAL_REPORTS } from "./i18n";
import { AskScreen } from "./screens/AskScreen";
import { HomeScreen } from "./screens/HomeScreen";
import { ReportScreen } from "./screens/ReportScreen";
import { RouteResultScreen } from "./screens/RouteResultScreen";
import { SegmentScreen } from "./screens/SegmentScreen";
import { SettingsScreen } from "./screens/SettingsScreen";
import { SpeedGateScreen } from "./screens/SpeedGateScreen";
import { WarningScreen } from "./screens/WarningScreen";
import type {
  CrowdReportItem,
  DepthCategory,
  Language,
  ScreenId,
  TextSize,
  TravelMode,
} from "./types";

const VALID_SCREENS: ScreenId[] = [
  "home",
  "warning",
  "ask",
  "route-found",
  "route-blocked",
  "segment",
  "report",
  "settings",
  "speed-gate",
];

function parseHashScreen(): { screen: ScreenId; degraded?: boolean } {
  const raw = window.location.hash.replace(/^#\/?/, "");
  if (raw === "degraded") return { screen: "home", degraded: true };
  if ((VALID_SCREENS as string[]).includes(raw)) {
    return { screen: raw as ScreenId };
  }
  return { screen: "home" };
}

export default function App() {
  const initial = parseHashScreen();
  const [history, setHistory] = useState<ScreenId[]>([initial.screen]);
  const [lang, setLang] = useState<Language>("vi");
  const [textSize, setTextSize] = useState<TextSize>("default");
  const [dataSaver, setDataSaver] = useState(false);
  const [preciseLocationConsent, setPreciseLocationConsent] = useState(true);
  const [photoConsent, setPhotoConsent] = useState(true);
  const [officialFeedDegraded, setOfficialFeedDegraded] = useState(Boolean(initial.degraded));
  const [showCrowdLayer, setShowCrowdLayer] = useState(true);

  const [origin, setOrigin] = useState("Vị trí hiện tại");
  const [destination, setDestination] = useState("Biblio");
  const [travelMode, setTravelMode] = useState<TravelMode>("motorbike");
  const [reports, setReports] = useState<CrowdReportItem[]>(INITIAL_REPORTS);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const currentScreen = history[history.length - 1] ?? "home";

  useEffect(() => {
    document.title = "FloodScout VN";
    document.documentElement.lang = lang;
  }, [lang]);

  useEffect(() => {
    const onHashChange = () => {
      const parsed = parseHashScreen();
      if (parsed.degraded !== undefined) {
        setOfficialFeedDegraded(parsed.degraded);
      } else if (parsed.screen === "home") {
        setOfficialFeedDegraded(false);
      }
      setHistory((prev) => {
        if (prev[prev.length - 1] === parsed.screen) return prev;
        return [...prev, parsed.screen];
      });
    };
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    if (textSize === "large") {
      root.style.fontSize = "108%";
    } else if (textSize === "xlarge") {
      root.style.fontSize = "116%";
    } else {
      root.style.fontSize = "100%";
    }
  }, [textSize]);

  const navigate = (next: ScreenId) => {
    setHistory((prev) => {
      if (prev[prev.length - 1] === next) return prev;
      return [...prev, next];
    });
    const targetHash = next === "home" ? "" : `#${next}`;
    if (window.location.hash !== targetHash) {
      window.history.pushState(null, "", targetHash || window.location.pathname);
    }
    window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
  };

  const goBack = () => {
    setHistory((prev) => {
      const updated = prev.length > 1 ? prev.slice(0, -1) : (["home"] as ScreenId[]);
      const target = updated[updated.length - 1] ?? "home";
      const targetHash = target === "home" ? "" : `#${target}`;
      window.history.replaceState(null, "", targetHash || window.location.pathname);
      return updated;
    });
    window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    window.setTimeout(() => {
      setToastMessage((cur) => (cur === msg ? null : cur));
    }, 3200);
  };

  const handleSubmitReport = ({
    segmentName,
    category,
  }: {
    segmentName: string;
    category: DepthCategory;
  }) => {
    const categoryMap: Record<
      DepthCategory,
      {
        titleVi: string;
        titleEn: string;
        choiceVi: string;
        choiceEn: string;
        swatch: "#b91c1c" | "#d97706";
      }
    > = {
      wheel: {
        titleVi: "Ngang bánh xe",
        titleEn: "Wheel-hub deep",
        choiceVi: "Bánh xe",
        choiceEn: "Wheel",
        swatch: "#b91c1c",
      },
      ankle: {
        titleVi: "Ngang mắt cá",
        titleEn: "Ankle deep",
        choiceVi: "Mắt cá",
        choiceEn: "Ankle",
        swatch: "#d97706",
      },
      unsure: {
        titleVi: "Chưa rõ, có thấy nước",
        titleEn: "Unclear depth, water visible",
        choiceVi: "Chưa rõ",
        choiceEn: "Unsure",
        swatch: "#b91c1c",
      },
    };

    const mapped = categoryMap[category];
    const newItem: CrowdReportItem = {
      id: `own-${Date.now()}`,
      segmentName,
      titleVi: mapped.titleVi,
      titleEn: mapped.titleEn,
      detailVi: `Người báo đã chọn: ${mapped.choiceVi} · AI đề xuất: Bánh xe`,
      detailEn: `Reporter selected: ${mapped.choiceEn} · AI proposed: Wheel`,
      freshnessVi: "Vừa xong · đang tính (báo cáo của bạn)",
      freshnessEn: "Just now · active weight (your report)",
      swatchColor: mapped.swatch,
      hasPhoto: photoConsent,
      isOwn: true,
      photoCaptionVi: `Ảnh đường ngập tại ${segmentName} (dữ liệu demo)`,
      photoCaptionEn: `Flooded street photo at ${segmentName} (demo data)`,
    };

    setReports((prev) => [newItem, ...prev]);
    showToast(
      lang === "vi" ? `Đã gửi báo cáo cho ${segmentName}` : `Report submitted for ${segmentName}`,
    );
    navigate("segment");
  };

  const ownReportCount = reports.filter((r) => r.isOwn).length;
  const activeFirstReport = reports.find((r) => !r.expired);
  const latestReportTag =
    lang === "vi"
      ? activeFirstReport?.isOwn
        ? `${activeFirstReport.titleVi} · vừa xong`
        : "Ngang bánh xe · 20 phút"
      : activeFirstReport?.isOwn
        ? `${activeFirstReport.titleEn} · just now`
        : "Wheel-deep · 20 min";

  return (
    <>
      {currentScreen === "home" && (
        <HomeScreen
          lang={lang}
          onToggleLanguage={() => setLang((l) => (l === "vi" ? "en" : "vi"))}
          officialFeedDegraded={officialFeedDegraded}
          onChangeOfficialFeedDegraded={setOfficialFeedDegraded}
          showCrowdLayer={showCrowdLayer}
          onChangeShowCrowdLayer={setShowCrowdLayer}
          latestReportTag={latestReportTag}
          onNavigate={navigate}
          onQuickAskDestination={(dest) => {
            setDestination(dest);
            navigate("ask");
          }}
        />
      )}

      {currentScreen === "warning" && <WarningScreen lang={lang} onBack={goBack} />}

      {currentScreen === "ask" && (
        <AskScreen
          lang={lang}
          origin={origin}
          onChangeOrigin={setOrigin}
          destination={destination}
          onChangeDestination={setDestination}
          travelMode={travelMode}
          onChangeTravelMode={setTravelMode}
          onBack={goBack}
          onOpenBulletin={() => navigate("warning")}
          onSubmitRoute={(target) => navigate(target)}
        />
      )}

      {(currentScreen === "route-found" || currentScreen === "route-blocked") && (
        <RouteResultScreen
          mode={currentScreen}
          lang={lang}
          destination={destination}
          travelMode={travelMode}
          onBack={goBack}
          onNavigate={navigate}
        />
      )}

      {currentScreen === "segment" && (
        <SegmentScreen
          lang={lang}
          reports={reports}
          dataSaver={dataSaver}
          onBack={goBack}
          onOpenBulletin={() => navigate("warning")}
        />
      )}

      {currentScreen === "report" && (
        <ReportScreen
          lang={lang}
          photoConsent={photoConsent}
          preciseLocationConsent={preciseLocationConsent}
          onBack={goBack}
          onSubmitReport={handleSubmitReport}
        />
      )}

      {currentScreen === "settings" && (
        <SettingsScreen
          lang={lang}
          onChangeLang={setLang}
          textSize={textSize}
          onChangeTextSize={setTextSize}
          dataSaver={dataSaver}
          onChangeDataSaver={setDataSaver}
          preciseLocationConsent={preciseLocationConsent}
          onChangePreciseLocationConsent={setPreciseLocationConsent}
          photoConsent={photoConsent}
          onChangePhotoConsent={setPhotoConsent}
          ownReportCount={ownReportCount}
          onDeleteOwnReports={() => setReports((prev) => prev.filter((r) => !r.isOwn))}
          onBack={goBack}
        />
      )}

      {currentScreen === "speed-gate" && (
        <SpeedGateScreen
          lang={lang}
          onStopped={goBack}
          onOpenBulletin={() => navigate("warning")}
        />
      )}

      {toastMessage && (
        <div
          role="status"
          aria-live="polite"
          className="fixed top-[16px] left-1/2 -translate-x-1/2 z-50 bg-[#191b14] text-white px-[18px] py-[10px] rounded-[999px] shadow-[0px_8px_24px_rgba(26,28,20,0.22)] font-['Plus_Jakarta_Sans:SemiBold'] text-[14px] leading-[20px] whitespace-nowrap"
        >
          {toastMessage}
        </div>
      )}
    </>
  );
}
