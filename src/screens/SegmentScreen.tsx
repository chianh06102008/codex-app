// S5 Segment: why this road. Official floor, reports with ages, model vs human,
// freshness. No comment thread.
import { Image, StyleSheet, View } from 'react-native';
import { Button, ProgressBar, Text } from 'react-native-paper';

import { COPY, type Lang } from '@/copy/mapReport';
import { reportWeight } from '@/features/fusion/fusion';
import { useOfficialSource } from '@/features/fusion/officialSource';
import { useSegmentStates } from '@/features/fusion/segmentStates';
import { FloodMap } from '@/features/map/FloodMap';
import { StateChip } from '@/features/map/StateChip';
import { SEGMENT_BY_ID } from '@/features/map/roads';
import { BRAND } from '@/features/map/stateStyle';
import { retractReport, useReports } from '@/features/report/reportStore';
import { useRouteSession } from '@/features/routing/session';
import { Card } from '@/features/ui/Card';

type Props = { lang: Lang; go: (screen: 'result') => void };

export function SegmentScreen({ lang, go }: Props) {
  const c = COPY[lang];
  const session = useRouteSession();
  const official = useOfficialSource();
  const states = useSegmentStates(session.mode);
  const { reports, showSamples } = useReports();
  const seg = session.segmentId ? SEGMENT_BY_ID.get(session.segmentId) : null;
  if (!seg) return <Button onPress={() => go('result')}>{c.backToAsk}</Button>;

  const state = states.get(seg.id);
  const now = new Date();
  const mine = reports
    .filter((r) => r.segment_id === seg.id && (showSamples || !r.sample))
    .sort((a, b) => b.created_at.localeCompare(a.created_at));

  const floorText =
    state?.floor === 'do_not_travel' ? c.floorDnt
    : state?.floor === 'warning' ? c.floorWarning
    : official.feedStatus === 'unavailable' ? c.floorUnknown
    : c.floorNone;

  return (
    <View style={styles.wrap}>
      <Text variant="labelLarge" style={styles.soft}>{c.segmentTitle}</Text>
      <Text variant="headlineSmall" style={styles.h1}>{seg.name ?? c.unnamedRoad}</Text>
      {state && <StateChip lang={lang} state={state.state} />}
      {state?.state === 'no_adverse_evidence' && <Text style={styles.soft}>{c.calmest}</Text>}

      <FloodMap
        states={states}
        feedUnavailable={official.feedStatus === 'unavailable'}
        statements={official.statements}
        highlightSegmentId={seg.id}
        height={220}

      />

      <Card>
        <Text variant="titleMedium" style={styles.section}>{c.floor}</Text>
        <Text style={styles.body}>{floorText}</Text>
      </Card>

      <Card>
        <Text variant="titleMedium" style={styles.section}>{c.reports}</Text>
        {mine.length === 0 && <Text style={styles.soft}>{c.noReports}</Text>}
        {mine.map((r) => {
          const w = reportWeight(r, now, official.heavyRain);
          const age = Math.max(0, Math.round((now.getTime() - new Date(r.created_at).getTime()) / 60_000));
          return (
            <View key={r.id} style={styles.report}>
              <View style={styles.reportHead}>
                <Text style={styles.reportCat}>{c[`cat_${r.human_category}`]}</Text>
                <Text style={styles.soft}>{c.minutesAgo(age)}</Text>
              </View>
              {r.photo_uri ? <Image source={{ uri: r.photo_uri }} style={styles.photo} /> : null}
              {r.sample && <Text style={styles.badge}>{c.sampleBadge}</Text>}
              {r.status === 'retracted' ? null : w === 0 ? (
                <Text style={styles.soft}>{c.expired}</Text>
              ) : (
                <View style={styles.weightRow}>
                  <Text style={styles.small}>{c.weight}</Text>
                  <ProgressBar progress={w} color={BRAND.primary} style={styles.bar} />
                </View>
              )}
              <Text style={styles.small}>
                {c.humanSaid}: {c[`cat_${r.human_category}`]}
                {r.model_category ? ` · ${c.modelSaid}: ${c[`cat_${r.model_category}`]}` : ''}
              </Text>
              {!r.sample && !r.shared && r.status !== 'retracted' && (
                <Button compact mode="text" icon="undo" onPress={() => retractReport(r.id)}>{c.retract}</Button>
              )}
            </View>
          );
        })}
      </Card>

      <Button mode="text" icon="arrow-left" onPress={() => go('result')}>{c.backToAsk}</Button>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 12 },
  h1: { fontWeight: '800', color: BRAND.ink },
  soft: { color: BRAND.inkSoft },
  section: { fontWeight: '700', color: BRAND.ink, marginBottom: 6 },
  body: { fontSize: 15, color: BRAND.ink },
  report: { paddingVertical: 10, borderTopWidth: 1, borderTopColor: BRAND.outline, gap: 6 },
  reportHead: { flexDirection: 'row', justifyContent: 'space-between' },
  reportCat: { fontWeight: '700', fontSize: 16, color: BRAND.ink },
  photo: { width: '100%', height: 160, borderRadius: 12 },
  badge: { alignSelf: 'flex-start', fontSize: 12, fontWeight: '700', color: '#45397A', backgroundColor: '#EFEBFA', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, overflow: 'hidden' },
  weightRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  bar: { flex: 1, height: 6, borderRadius: 3, width: 160 },
  small: { fontSize: 13, color: BRAND.inkSoft },
});
