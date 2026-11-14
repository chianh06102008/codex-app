// S1 Home: the map of the pilot area with the official status band on top (always,
// including when the status is unavailable), the legend, and the "Đi đường này?" sheet.
// Layout ported from Dev 1's Figma shell; data comes from Dev 2/3/4's features.
import { useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';
import { Icon } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { NavBottomBar, T, type NavTab } from '@/components/SharedPrimitives';
import { COPY, type Lang } from '@/copy/mapReport';
import { STRINGS } from '@/copy/strings';
import type { SegmentStateKey } from '@/domain/types';
import { DemoPanel } from '@/features/demo/DemoPanel';
import { useOfficialSource } from '@/features/fusion/officialSource';
import { NearYou } from '@/features/near/NearYou';
import { LiveOverlays } from '@/features/live/LiveOverlays';
import { LayerToggles } from '@/features/live/LayerToggles';
import { LIVE } from '@/copy/live';
import { useSegmentStates } from '@/features/fusion/segmentStates';
import { FloodMap } from '@/features/map/FloodMap';
import { STATE_STYLE } from '@/features/map/stateStyle';
import { OfficialStatusBand } from '@/features/official/OfficialStatusBand';
import { summarizeOfficial } from '@/features/official/officialView';
import { updateSession } from '@/features/routing/session';
import { updateSettings } from '@/features/settings/settingsStore';
import { COLORS, RADIUS, SHADOW, TOUCH } from '@/theme';
import type { Screen } from './_navigation';

const LEGEND: { state: SegmentStateKey; desc: 'legendAvoid' | 'legendDiscouraged' | 'legendUncertain' | 'legendNone' }[] = [
  { state: 'avoid', desc: 'legendAvoid' },
  { state: 'discouraged', desc: 'legendDiscouraged' },
  { state: 'uncertain', desc: 'legendUncertain' },
  { state: 'no_adverse_evidence', desc: 'legendNone' },
];

export function HomeScreen({ lang, go }: { lang: Lang; go: (screen: Screen) => void }) {
  const s = STRINGS[lang];
  const mr = COPY[lang];
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  const official = useOfficialSource();
  const states = useSegmentStates('motorbike');
  const view = summarizeOfficial(official);

  const [layersOpen, setLayersOpen] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(true);
  const [bandOpen, setBandOpen] = useState(true);
  const [legendOpen, setLegendOpen] = useState<SegmentStateKey | null>(null);
  const openLegend = LEGEND.find((l) => l.state === legendOpen);

  // One line under the heading that matches the band: never the calm sentence while a
  // warning is in force or the feed is down.
  const sheetLine = view.tone === 'warning' ? mr.warningInForce : view.tone === 'degraded' ? mr.feedDown : mr.calmest;

  return (
    <View style={styles.screen}>
      {/* Map fills the screen; everything else floats above it. */}
      <View style={StyleSheet.absoluteFill}>
        <FloodMap
          states={states}
          feedUnavailable={official.feedStatus !== 'ok'}
          statements={official.statements}
          height={height}
          cornerRadius={0}
          onSegmentPress={(id) => {
            updateSession({ segmentId: id });
            go('segment');
          }}
        >
          <LiveOverlays />
        </FloodMap>
      </View>

      {/* Top overlay: app bar, official status first, then the legend. */}
      <View style={[styles.top, { paddingTop: insets.top + 8 }]} pointerEvents="box-none">
        <View style={styles.appBar} pointerEvents="box-none">
          <View style={styles.pill}>
            <T t="wordmark" w="extrabold">{s.appName}</T>
          </View>
          <Pressable
            onPress={() => updateSettings({ lang: lang === 'vi' ? 'en' : 'vi' })}
            accessibilityRole="button"
            accessibilityLabel={s.switchLanguage}
            style={({ pressed }) => [styles.pill, pressed && styles.pressed]}
          >
            <T w="semibold">VI · EN</T>
          </Pressable>
        </View>

        {bandOpen ? (
          <View>
            <OfficialStatusBand lang={lang} titleLines={2} onPress={() => go('warning')} />
            <Pressable onPress={() => setBandOpen(false)} accessibilityRole="button" accessibilityLabel={mr.band_hide} hitSlop={10} style={styles.bandClose}>
              <Icon source="chevron-up" size={20} color={COLORS.ink} />
            </Pressable>
          </View>
        ) : (
          <Pressable onPress={() => setBandOpen(true)} accessibilityRole="button" style={[styles.bandPill, view.tone === 'warning' && styles.bandPillWarn]}>
            <Icon source={view.tone === 'warning' ? 'alert' : 'information-outline'} size={16} color={view.tone === 'warning' ? COLORS.white : COLORS.ink} />
            <T t="small" w="semibold" color={view.tone === 'warning' ? COLORS.white : COLORS.ink} numberOfLines={1}>
              {mr.band_show}
            </T>
            <Icon source="chevron-down" size={18} color={view.tone === 'warning' ? COLORS.white : COLORS.ink} />
          </Pressable>
        )}

        {official.rain && (
          <View style={styles.legendNote} accessibilityLiveRegion="polite">
            <T t="small">
              {mr.rainLine(
                official.rain.next3hMm,
                official.rain.maxProbability,
                official.userLocation !== null,
                new Date(official.rain.retrievedAt).toLocaleTimeString(lang === 'vi' ? 'vi-VN' : 'en-GB', { hour: '2-digit', minute: '2-digit' }),
              )}
            </T>
            {official.rain.heavy && <T t="small" w="semibold">{mr.rainHeavy}</T>}
          </View>
        )}

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.chipScroll}
          contentContainerStyle={styles.chips}
        >
          {LEGEND.map((item) => {
            const selected = legendOpen === item.state;
            return (
              <Pressable
                key={item.state}
                onPress={() => setLegendOpen(selected ? null : item.state)}
                accessibilityRole="button"
                accessibilityState={{ expanded: selected }}
                style={[styles.chip, selected && styles.chipSelected]}
              >
                <View style={[styles.dot, { backgroundColor: STATE_STYLE[item.state].line }]} />
                <T t="small" w="semibold">{mr[`state_${item.state}`]}</T>
              </Pressable>
            );
          })}
        </ScrollView>

        {openLegend && (
          <View style={styles.legendNote} accessibilityLiveRegion="polite">
            <T t="small">{s[openLegend.desc]}</T>
          </View>
        )}

        <View style={styles.controlsRow} pointerEvents="box-none">
          <Pressable
            onPress={() => go('live')}
            accessibilityRole="button"
            hitSlop={8}
            style={({ pressed }) => [styles.demoPill, pressed && styles.pressed]}
          >
            <T t="small" w="semibold" color={COLORS.white}>{LIVE[lang].nationwide}</T>
          </Pressable>
          <Pressable
            onPress={() => setLayersOpen(true)}
            accessibilityRole="button"
            accessibilityLabel={s.layersButton}
            style={({ pressed }) => [styles.mapButton, pressed && styles.pressed]}
          >
            <Icon source="layers-outline" size={22} color={COLORS.ink} />
          </Pressable>
        </View>
      </View>

      {/* Bottom sheet: the one main action, in the thumb zone. */}
      <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, 16) }]}>
        {/* Tap the handle to fold the panel away and see the map. */}
        <Pressable
          onPress={() => setSheetOpen((o) => !o)}
          accessibilityRole="button"
          accessibilityState={{ expanded: sheetOpen }}
          hitSlop={12}
          style={styles.handleRow}
        >
          <View style={styles.grabber} />
          <View style={styles.handleLabel}>
            <Icon source={sheetOpen ? 'chevron-down' : 'chevron-up'} size={18} color={COLORS.inkSoft} />
            <T t="tiny" w="semibold" color={COLORS.inkSoft}>{sheetOpen ? mr.near_show_map : mr.near_show_panel}</T>
          </View>
        </Pressable>
        {sheetOpen && (
          <>
            <View style={styles.sheetHeading}>
              <T t="title" w="bold" accessibilityRole="header">{s.askHeading}</T>
              <T t="small" color={COLORS.inkSoft}>{sheetLine}</T>
            </View>
            <NearYou lang={lang} states={states} onCheckRoute={() => go('ask')} onOpenLive={() => go('live')} />
          </>
        )}

        <Pressable
          onPress={() => go('ask')}
          accessibilityRole="button"
          accessibilityLabel={`${s.askHeading} ${s.searchPlaceholder}`}
          style={({ pressed }) => [styles.search, pressed && styles.pressed]}
        >
          <Icon source="magnify" size={22} color={COLORS.inkSoft} />
          <T color={COLORS.inkSoft} style={styles.flex} numberOfLines={1}>{s.searchPlaceholder}</T>
          <View style={styles.searchGo}>
            <Icon source="arrow-right" size={22} color={COLORS.white} />
          </View>
        </Pressable>

        <NavBottomBar
          active="home"
          navLabel={s.navLabel}
          labels={{ home: s.navMap, warning: s.navWarning, report: s.navReport, settings: s.navSettings }}
          onNavigate={(tab: NavTab) => go(tab)}
        />
      </View>

      {/* Map layers + demo switches. The official layer has no off switch (T14). */}
      <Modal visible={layersOpen} transparent animationType="slide" onRequestClose={() => setLayersOpen(false)}>
        <Pressable style={styles.scrim} onPress={() => setLayersOpen(false)} accessibilityLabel={s.close}>
          <Pressable style={[styles.layersSheet, { paddingBottom: Math.max(insets.bottom, 20) }]} onPress={() => undefined}>
            <View style={styles.layersHeader}>
              <T t="title" w="bold" style={styles.flex}>{s.layersTitle}</T>
              <Pressable onPress={() => setLayersOpen(false)} accessibilityRole="button" style={styles.closeButton}>
                <T t="small" w="semibold" color={COLORS.inkSoft}>{s.close}</T>
              </Pressable>
            </View>

            <ScrollView contentContainerStyle={styles.layersBody}>
              <View style={styles.lockedCard}>
                <View style={styles.lockedRow}>
                  <T w="semibold" style={styles.flex}>{s.officialLayer}</T>
                  <View style={styles.lockedTag}>
                    <T t="tiny" w="semibold" color={COLORS.white}>{s.lockedOn}</T>
                  </View>
                </View>
                <T t="small" color={COLORS.inkSoft}>{s.officialLayerNote}</T>
              </View>

              <LayerToggles lang={lang} />
              <DemoPanel lang={lang} />
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  bandClose: { position: 'absolute', right: 8, top: 8, width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.9)', alignItems: 'center', justifyContent: 'center' },
  bandPill: { flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start', backgroundColor: COLORS.surface, borderRadius: RADIUS.pill, paddingHorizontal: 12, minHeight: 36, borderWidth: 1, borderColor: COLORS.outline },
  bandPillWarn: { backgroundColor: COLORS.warningBorder, borderColor: COLORS.warningBorder },
  handleRow: { alignItems: 'center', gap: 4, paddingVertical: 2 },
  handleLabel: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  screen: { flex: 1, backgroundColor: COLORS.mapBackground },
  flex: { flex: 1 },
  pressed: { opacity: 0.75 },

  top: { paddingHorizontal: 16, gap: 10 },
  appBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  pill: {
    minHeight: TOUCH,
    paddingHorizontal: 18,
    borderRadius: RADIUS.pill,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOW.float,
  },

  chipScroll: { marginHorizontal: -16, flexGrow: 0 },
  chips: { paddingHorizontal: 16, gap: 8, paddingVertical: 2 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    minHeight: TOUCH,
    paddingLeft: 14,
    paddingRight: 16,
    borderRadius: RADIUS.pill,
    backgroundColor: COLORS.surface,
    borderWidth: 2,
    borderColor: COLORS.surface,
    ...SHADOW.card,
  },
  chipSelected: { borderColor: COLORS.ink },
  dot: { width: 10, height: 10, borderRadius: 5 },
  legendNote: { backgroundColor: COLORS.surface, borderRadius: RADIUS.md, paddingHorizontal: 14, paddingVertical: 10, ...SHADOW.float },

  controlsRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  demoPill: { minHeight: 32, paddingHorizontal: 12, borderRadius: RADIUS.pill, backgroundColor: COLORS.ink, justifyContent: 'center' },
  mapButton: {
    width: TOUCH,
    height: TOUCH,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOW.float,
  },

  sheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: RADIUS.xl,
    borderTopRightRadius: RADIUS.xl,
    paddingTop: 10,
    paddingHorizontal: 16,
    gap: 14,
    ...SHADOW.float,
  },
  grabber: { alignSelf: 'center', width: 40, height: 5, borderRadius: 3, backgroundColor: COLORS.outline },
  sheetHeading: { gap: 2 },
  search: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    minHeight: 60,
    paddingLeft: 18,
    paddingRight: 6,
    borderRadius: RADIUS.pill,
    backgroundColor: COLORS.surfaceSoft,
  },
  searchGo: { width: TOUCH, height: TOUCH, borderRadius: RADIUS.pill, backgroundColor: COLORS.ink, alignItems: 'center', justifyContent: 'center' },

  scrim: { flex: 1, backgroundColor: COLORS.scrim, justifyContent: 'flex-end' },
  layersSheet: {
    maxHeight: '88%',
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: RADIUS.xl,
    borderTopRightRadius: RADIUS.xl,
    paddingTop: 20,
    paddingHorizontal: 20,
  },
  layersHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  closeButton: { minHeight: TOUCH, paddingHorizontal: 14, borderRadius: RADIUS.pill, backgroundColor: COLORS.surfaceSoft, justifyContent: 'center' },
  layersBody: { gap: 16, paddingBottom: 8 },
  lockedCard: {
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.warningBorder,
    backgroundColor: COLORS.warningBand,
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 4,
  },
  lockedRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  lockedTag: { borderRadius: RADIUS.pill, backgroundColor: COLORS.warningInk, paddingHorizontal: 10, paddingVertical: 2 },
});
