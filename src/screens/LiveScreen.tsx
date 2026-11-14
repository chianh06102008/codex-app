// Live situation where the phone is: what to do first, then the evidence, each with its source and age.
import { useEffect, useRef, useState } from 'react';
import { Animated, Linking, Platform, Pressable, StyleSheet, View } from 'react-native';
import { Icon } from 'react-native-paper';

import { T } from '@/components/SharedPrimitives';
import { LIVE } from '@/copy/live';
import type { Lang } from '@/copy/mapReport';
import { COPY } from '@/copy/mapReport';
import type { LatLon } from '@/domain/types';
import { refreshAllLive, setShowRadar } from '@/features/live/liveStore';
import { refreshVietnam } from '@/features/live/vietnam';
import type { SourceKey } from '@/features/live/liveStore';
import { useLiveSituation } from '@/features/live/useLiveSituation';
import { nationwide, useVietnam } from '@/features/live/vietnam';
import { STATE_STYLE } from '@/features/map/stateStyle';
import { statementTitle } from '@/features/official/officialView';
import { COLORS, RADIUS } from '@/theme';

const LEVEL_COLOR = { act: '#B91C1C', prepare: '#C2410C', watch: '#33454E' } as const;
const SEV = { warning: '#C2410C', heavy: '#B91C1C', rain: '#2563EB', quiet: '#64748B', unknown: '#94A3B8' } as const;

function time(iso: string | undefined, lang: Lang) {
  return iso ? new Date(iso).toLocaleTimeString(lang === 'vi' ? 'vi-VN' : 'en-GB', { hour: '2-digit', minute: '2-digit' }) : '';
}

export function openDirections(p: LatLon, name?: string | null) {
  const q = name ? `&q=${encodeURIComponent(name)}` : '';
  const url =
    Platform.OS === 'ios'
      ? `http://maps.apple.com/?daddr=${p.latitude},${p.longitude}&dirflg=w${q}`
      : `https://www.google.com/maps/dir/?api=1&destination=${p.latitude},${p.longitude}&travelmode=walking`;
  void Linking.openURL(url);
}

export function LiveScreen({ lang }: { lang: Lang }) {
  const c = LIVE[lang];
  const m = COPY[lang];
  const s = useLiveSituation();
  const { live } = s;
  const vn = useVietnam();
  const [allVn, setAllVn] = useState(false);
  const provinces = nationwide(vn.rain, s.official.allStatements);
  const vnWarn = provinces.filter((p) => p.severity === 'warning').length;
  const vnHeavy = provinces.filter((p) => p.severity === 'heavy').length;

  const pulse = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1.25, duration: 700, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1, duration: 700, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [pulse]);

  const status = (k: SourceKey) => (
    <T t="tiny" color={COLORS.inkSoft}>
      {live.loading[k] ? c.loading : live.errors[k] && !live.updated[k] ? c.failed : live.updated[k] ? c.updated(time(live.updated[k], lang)) : c.loading}
    </T>
  );

  if (!live.here) {
    return (
      <View style={styles.wrap}>
        <T t="title" w="bold">{c.title}</T>
        <T>{c.noLocation}</T>
      </View>
    );
  }

  const level = s.overall.level;
  const advice = level === 'act' ? c.advice_act : level === 'prepare' ? c.advice_prepare : c.advice_watch;
  const w = live.weather;
  const maxBar = Math.max(4, ...(w?.hourly.map((h) => h.mm) ?? [0]));
  const dir = (b: number) => c.dirs[Math.round(b / 45) % 8];
  const flagged = s.roads.filter((r) => r.state !== 'no_adverse_evidence');

  return (
    <View style={styles.wrap}>
      <View style={styles.titleRow}>
        <T t="title" w="bold" style={styles.flex}>{c.title}</T>
        <Pressable onPress={() => { refreshAllLive(); void refreshVietnam(); }} accessibilityRole="button" style={styles.refresh} hitSlop={8}>
          <Icon source="refresh" size={18} color={COLORS.ink} />
          <T t="small" w="semibold">{c.refresh}</T>
        </Pressable>
      </View>
      {s.official.province && <T t="small" color={COLORS.inkSoft}>{s.official.province}</T>}

      {/* 1. What to do */}
      <View style={[styles.levelCard, { borderColor: LEVEL_COLOR[level] }]}>
        <View style={styles.row}>
          <Animated.View style={[styles.levelDot, { backgroundColor: LEVEL_COLOR[level], transform: [{ scale: pulse }] }]} />
          <T t="title" w="extrabold" color={LEVEL_COLOR[level]}>{c[`level_${level}`]}</T>
        </View>
        {s.overall.why.map((k) => (
          <T key={k} t="small" w="semibold">• {c[`why_${k}` as keyof typeof c] as string}</T>
        ))}
        {advice.map((a) => (
          <T key={a} t="small">– {a}</T>
        ))}
        <View style={styles.callRow}>
          {(['112', '113', '114', '115'] as const).map((n) => (
            <Pressable key={n} onPress={() => void Linking.openURL(`tel:${n}`)} accessibilityRole="button" style={styles.callBtn}>
              <Icon source="phone" size={14} color={COLORS.danger} />
              <T t="tiny" w="semibold" color={COLORS.danger}>{c[`c${n}`]}</T>
            </Pressable>
          ))}
        </View>
      </View>

      {/* 2. Higher ground */}
      <Section title={c.ground} source={c.groundSource} status={status('terrain')}>
        {s.hereRel !== null && s.hereRel <= -1 && <T t="small" w="semibold">{c.hereLow(Math.round(-s.hereRel))}</T>}
        {live.higher ? (
          <>
            <T>{c.groundLine(live.higher.riseM, live.higher.distanceM, dir(live.higher.bearing))}</T>
            <ActionButton icon="directions" label={c.directions} onPress={() => openDirections(live.higher!.point)} />
          </>
        ) : (
          live.updated.terrain && <T t="small">{c.groundNone}</T>
        )}
      </Section>

      {/* 3. Official + international alerts */}
      <Section title={c.official} source="nchmf.gov.vn" status={null}>
        <T t="small" w="semibold">
          {s.view.tone === 'warning'
            ? m.near_official_warning(s.official.province ?? '')
            : s.view.tone === 'calm'
              ? m.near_official_none(s.official.province ?? '')
              : m.near_official_unknown}
        </T>
        {s.view.inForce.map((st) => (
          <Pressable key={st.id} onPress={() => void Linking.openURL(st.source_url)} accessibilityRole="link">
            <T t="small" color={COLORS.warningInk} style={styles.link}>{statementTitle(st) ?? st.issuer}</T>
          </Pressable>
        ))}
      </Section>

      <Section
        title={c.vnTitle}
        source={c.vnSource}
        status={<T t="tiny" color={COLORS.inkSoft}>{vn.loading ? c.loading : vn.updated ? c.updated(time(vn.updated, lang)) : vn.error ? c.failed : c.loading}</T>}
      >
        <T t="small" w="semibold">{c.vnCount(vnWarn, vnHeavy)}</T>
        {(allVn ? provinces : provinces.slice(0, 8)).map((p) => (
          <View key={p.province.name} style={styles.roadRow}>
            <View style={[styles.sevDot, { backgroundColor: SEV[p.severity] }]} />
            <View style={styles.flex}>
              <T t="small" w="semibold">{p.province.name} · {c[`sev_${p.severity}`]}</T>
              {p.rain && <T t="tiny" color={COLORS.inkSoft}>{c.vnLine(p.rain.nowMm, p.rain.todayMm, p.rain.tomorrowMm)}</T>}
              {p.inForce.map((st) => (
                <Pressable key={st.id} onPress={() => void Linking.openURL(st.source_url)} accessibilityRole="link">
                  <T t="tiny" color={COLORS.warningInk} style={styles.link} numberOfLines={2}>{statementTitle(st) ?? st.issuer}</T>
                </Pressable>
              ))}
            </View>
          </View>
        ))}
        {!allVn && provinces.length > 8 && (
          <Pressable onPress={() => setAllVn(true)} accessibilityRole="button">
            <T t="small" w="semibold" style={styles.link}>{c.showAll} ({provinces.length})</T>
          </Pressable>
        )}
      </Section>

      <Section title={c.alerts} source={c.alertsSource} status={status('alerts')}>
        {live.alerts.length === 0 && live.updated.alerts ? <T t="small">{c.alertsNone}</T> : null}
        {live.alerts.slice(0, 4).map((a) => (
          <Pressable key={a.id} onPress={() => a.url && void Linking.openURL(a.url)} style={styles.row}>
            <View style={[styles.swatch, { backgroundColor: a.level === 'Red' ? '#B91C1C' : a.level === 'Orange' ? '#E07B00' : '#2E7D32' }]} />
            <T t="small" style={styles.flex}>{a.name} — {c.alertLine(a.type === 'flood' ? c.flood : c.cyclone, a.level, a.distanceKm)}</T>
          </Pressable>
        ))}
      </Section>

      {/* 4. Weather, clouds, rain */}
      <Section title={c.weather} source={c.weatherSource} status={status('weather')}>
        {w && (
          <>
            <T w="bold">{c.wmo(w.weatherCode ?? 0)} · {c.temp(w.temperatureC ?? '–')}</T>
            <View style={styles.chips}>
              <Chip text={c.rainNow(w.precipitationMm ?? 0)} />
              <Chip text={c.clouds(w.cloudCoverPct ?? '–')} />
              <Chip text={c.gusts(w.windGustKmh ?? '–')} />
              <Chip text={c.humidity(w.humidityPct ?? '–')} />
            </View>
            <T t="small" w="semibold">{c.next12}</T>
            <View style={styles.bars}>
              {w.hourly.map((h) => (
                <View key={h.time} style={styles.barCol}>
                  <View style={[styles.bar, { height: Math.max(2, (h.mm / maxBar) * 56), backgroundColor: h.mm >= 7.6 ? '#B91C1C' : h.mm >= 2 ? '#E07B00' : '#3B82F6' }]} />
                  <T t="tiny" color={COLORS.inkSoft}>{h.time.slice(11, 13)}</T>
                </View>
              ))}
            </View>
            <T t="small">{c.next24(w.next24hMm)} · {c.next3d(w.next3dMm[0] ?? 0, w.next3dMm[1] ?? 0)}</T>
          </>
        )}
        <Pressable onPress={() => setShowRadar(!live.showRadar)} style={styles.row} accessibilityRole="switch" accessibilityState={{ checked: live.showRadar }}>
          <Icon source={live.showRadar ? 'checkbox-marked' : 'checkbox-blank-outline'} size={20} color={COLORS.ink} />
          <T t="small" style={styles.flex}>{c.radar} — {c.radarSource}</T>
        </Pressable>
      </Section>

      {/* 5. River */}
      <Section title={c.river} source={c.riverSource} status={status('river')}>
        {live.river && (
          <>
            <T t="small">{c.riverLine(live.river.today.toFixed(1), live.river.peak.toFixed(1), live.river.peakDate.slice(5))}</T>
            <T t="small" w="semibold">{live.river.ratio >= 1.5 ? c.riverRising(live.river.ratio.toFixed(1)) : c.riverSteady}</T>
            <View style={styles.bars}>
              {live.river.days.map((d, i) => {
                const max = Math.max(...live.river!.days.map((x) => x.m3s), 0.01);
                return (
                  <View key={d.date} style={styles.barCol}>
                    <View style={[styles.bar, { height: Math.max(2, (d.m3s / max) * 56), backgroundColor: i < live.river!.todayIndex ? '#94A3B8' : i === live.river!.todayIndex ? COLORS.ink : '#0EA5E9' }]} />
                    <T t="tiny" color={COLORS.inkSoft}>{d.date.slice(8)}</T>
                  </View>
                );
              })}
            </View>
          </>
        )}
      </Section>

      {/* 6. Roads */}
      <Section title={c.roads} source={c.roadsSource} status={status('area')}>
        {s.roads.length === 0 && live.updated.area ? <T t="small">{c.roadsNone}</T> : null}
        {(flagged.length ? flagged : s.roads).slice(0, 8).map((r) => (
          <View key={r.road.id} style={styles.roadRow}>
            <View style={[styles.swatch, { backgroundColor: STATE_STYLE[r.state].line }]} />
            <View style={styles.flex}>
              <T t="small" w="semibold" numberOfLines={1}>{r.road.name ?? c.unnamed} · {m[`state_${r.state}`]}</T>
              <T t="tiny" color={COLORS.inkSoft}>
                {c.roadLine(r.distanceM, r.elevRelM === null ? '' : r.elevRelM < 0 ? c.lower(Math.abs(r.elevRelM)) : c.higher(r.elevRelM))}
                {r.reasons.length ? ` · ${r.reasons.map((k) => c[`r_${k}`]).join(', ')}` : ''}
              </T>
            </View>
          </View>
        ))}
        {(flagged.length ? flagged : s.roads).length > 8 && <T t="tiny" color={COLORS.inkSoft}>{c.more((flagged.length ? flagged : s.roads).length - 8)}</T>}
      </Section>

      {/* 7. Help */}
      <Section title={c.help} source="OpenStreetMap" status={status('area')}>
        {live.help.length === 0 && live.updated.area ? <T t="small">{c.helpNone}</T> : null}
        {live.help.filter((h) => h.kind !== 'school').slice(0, 6).concat(live.help.filter((h) => h.kind === 'school').slice(0, 2)).map((h) => (
          <Pressable key={h.id} onPress={() => openDirections(h.point, h.name)} style={styles.roadRow} accessibilityRole="button">
            <Icon source={h.kind === 'hospital' || h.kind === 'clinic' ? 'hospital-box' : h.kind === 'police' ? 'police-badge' : h.kind === 'fire_station' ? 'fire-truck' : h.kind === 'school' ? 'school' : 'home-roof'} size={20} color={COLORS.ink} />
            <View style={styles.flex}>
              <T t="small" w="semibold" numberOfLines={1}>{h.name ?? c[`k_${h.kind}`]}</T>
              <T t="tiny" color={COLORS.inkSoft}>{c[`k_${h.kind}`]} · {h.distanceM} m</T>
            </View>
            <Icon source="directions" size={20} color={COLORS.inkSoft} />
          </Pressable>
        ))}
      </Section>
    </View>
  );
}

function Section({ title, source, status, children }: { title: string; source: string; status: React.ReactNode; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <View style={styles.row}>
        <T w="bold" style={styles.flex}>{title}</T>
        {status}
      </View>
      {children}
      <T t="tiny" color={COLORS.inkSoft}>{source}</T>
    </View>
  );
}

function Chip({ text }: { text: string }) {
  return (
    <View style={styles.chip}>
      <T t="tiny" w="semibold">{text}</T>
    </View>
  );
}

function ActionButton({ icon, label, onPress }: { icon: string; label: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} accessibilityRole="button" style={({ pressed }) => [styles.action, pressed && { opacity: 0.75 }]}>
      <Icon source={icon} size={18} color={COLORS.white} />
      <T t="small" w="semibold" color={COLORS.white}>{label}</T>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 12, paddingBottom: 24 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  flex: { flex: 1 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  refresh: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, minHeight: 36, borderRadius: RADIUS.pill, backgroundColor: COLORS.surfaceSoft },
  levelCard: { borderWidth: 2, borderRadius: RADIUS.md, padding: 12, gap: 4, backgroundColor: COLORS.surface },
  levelDot: { width: 14, height: 14, borderRadius: 7 },
  callRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 6 },
  callBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, borderWidth: 1, borderColor: COLORS.danger, borderRadius: RADIUS.pill, paddingHorizontal: 10, minHeight: 36 },
  section: { backgroundColor: COLORS.surface, borderRadius: RADIUS.md, padding: 12, gap: 6, borderWidth: 1, borderColor: COLORS.outline },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  chip: { backgroundColor: COLORS.surfaceSoft, borderRadius: RADIUS.pill, paddingHorizontal: 10, paddingVertical: 4 },
  bars: { flexDirection: 'row', alignItems: 'flex-end', gap: 4, height: 76 },
  barCol: { flex: 1, alignItems: 'center', justifyContent: 'flex-end', gap: 2 },
  bar: { width: '80%', borderRadius: 3 },
  swatch: { width: 16, height: 5, borderRadius: 3 },
  sevDot: { width: 12, height: 12, borderRadius: 6 },
  roadRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 4 },
  link: { textDecorationLine: 'underline' },
  action: { flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start', backgroundColor: COLORS.ink, borderRadius: RADIUS.pill, paddingHorizontal: 14, minHeight: 44 },
});
