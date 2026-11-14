// The app's screen switcher: which screen is showing, and where Back goes.
// A small history stack instead of a navigation library (TEAM.md: no new nav library mid-hackathon).
// S1 Home draws its own full-screen layout; every other screen sits in a frame with a
// back button, a scrolling body and an optional action bar at the bottom.
import { useEffect, useState, type ReactNode } from 'react';
import { BackHandler, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ButtonPrimary, HeaderBack } from '@/components/SharedPrimitives';
import type { Lang } from '@/copy/mapReport';
import { STRINGS } from '@/copy/strings';
import { COLORS } from '@/theme';
import { AskScreen } from './AskScreen';
import { HomeScreen } from './HomeScreen';
import { LiveScreen } from './LiveScreen';
import { TripScreen } from './TripScreen';
import { ReportScreen } from './ReportScreen';
import { ResultScreen } from './ResultScreen';
import { SegmentScreen } from './SegmentScreen';
import { SettingsScreen } from './SettingsScreen';
import { WarningScreen, openOfficialLink, usePrimaryOfficialUrl } from './WarningScreen';

export type Screen = 'home' | 'warning' | 'ask' | 'result' | 'segment' | 'report' | 'settings' | 'live' | 'trip';

export function Navigation({ lang }: { lang: Lang }) {
  // The last entry is the screen on show. Home is always at the bottom of the stack.
  const [history, setHistory] = useState<Screen[]>(['home']);
  const screen = history[history.length - 1];
  const s = STRINGS[lang];

  const go = (next: Screen) =>
    setHistory((prev) => {
      if (next === 'home') return ['home'];
      if (prev[prev.length - 1] === next) return prev;
      // Going to a screen already in the stack returns to it instead of piling up copies.
      const at = prev.indexOf(next);
      return at === -1 ? [...prev, next] : prev.slice(0, at + 1);
    });
  const back = () => setHistory((prev) => (prev.length > 1 ? prev.slice(0, -1) : prev));

  // Android back button: go back one screen; on Home let the system close the app.
  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (history.length <= 1) return false;
      back();
      return true;
    });
    return () => sub.remove();
  }, [history.length]);

  if (screen === 'home') return <HomeScreen lang={lang} go={go} />;

  if (screen === 'warning') {
    return (
      <Frame title={s.warningTitle} subtitle={s.warningSubtitle} backLabel={s.back} onBack={back} footer={<WarningFooter lang={lang} />}>
        <WarningScreen lang={lang} />
      </Frame>
    );
  }
  if (screen === 'settings') {
    return (
      <Frame title={s.settingsTitle} backLabel={s.back} onBack={back}>
        <SettingsScreen lang={lang} />
      </Frame>
    );
  }
  // Dev 3/4 screens bring their own headings, so the frame only shows the app name.
  return (
    <Frame title={s.appName} backLabel={s.back} onBack={back}>
      {screen === 'live' && <LiveScreen lang={lang} />}
      {screen === 'trip' && <TripScreen lang={lang} />}
      {screen === 'ask' && <AskScreen lang={lang} go={go} />}
      {screen === 'result' && <ResultScreen lang={lang} go={go} />}
      {screen === 'segment' && <SegmentScreen lang={lang} go={go} />}
      {screen === 'report' && <ReportScreen lang={lang} go={go} />}
    </Frame>
  );
}

function WarningFooter({ lang }: { lang: Lang }) {
  const url = usePrimaryOfficialUrl();
  return <ButtonPrimary label={STRINGS[lang].openOriginal} onPress={() => openOfficialLink(url)} />;
}

function Frame({
  title,
  subtitle,
  backLabel,
  onBack,
  footer,
  children,
}: {
  title: string;
  subtitle?: string;
  backLabel: string;
  onBack: () => void;
  footer?: ReactNode;
  children: ReactNode;
}) {
  return (
    <SafeAreaView style={styles.safe} edges={footer ? ['top'] : ['top', 'bottom']}>
      <View style={styles.header}>
        <HeaderBack title={title} subtitle={subtitle} onBack={onBack} backLabel={backLabel} />
      </View>
      <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
        {children}
      </ScrollView>
      {footer ? (
        <SafeAreaView edges={['bottom']} style={styles.footer}>
          <View style={styles.footerInner}>{footer}</View>
        </SafeAreaView>
      ) : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  header: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 8 },
  // Same content width cap Dev 3/4 used, so their screens lay out as before.
  body: { width: '100%', maxWidth: 460, alignSelf: 'center', paddingHorizontal: 16, paddingTop: 8, paddingBottom: 32, gap: 16, flexGrow: 1 },
  footer: { backgroundColor: COLORS.surface, borderTopWidth: 1, borderTopColor: COLORS.outline },
  footerInner: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 16 },
});
