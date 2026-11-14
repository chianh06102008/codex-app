// S4 Result: refusal or at most two options. The headline is the risk statement.
// Options are ranked by how little discouraged road they use, never by minutes.
// On refusal no line is drawn at all (P3, T06).
import { Share, StyleSheet, View } from 'react-native';
import { Button, Icon, SegmentedButtons, Text } from 'react-native-paper';

import { COPY, type Lang, type MapReportCopy } from '@/copy/mapReport';
import type { ExplanationFact, SegmentStateKey } from '@/domain/types';
import { useOfficialSource } from '@/features/fusion/officialSource';
import { useSegmentStates } from '@/features/fusion/segmentStates';
import { FloodMap } from '@/features/map/FloodMap';
import { StateChip } from '@/features/map/StateChip';
import { SEGMENT_BY_ID } from '@/features/map/roads';
import { BRAND, STATE_STYLE } from '@/features/map/stateStyle';
import { updateSession, useRouteSession } from '@/features/routing/session';
import { SpeedGate } from '@/features/speed-gate/SpeedGate';
import { Card } from '@/features/ui/Card';
import { OfficialBanner } from '@/features/ui/OfficialBanner';

type Props = { lang: Lang; go: (screen: 'ask' | 'segment' | 'warning') => void };

export function factText(c: MapReportCopy, f: ExplanationFact): string | null {
  switch (f.kind) {
    case 'feed_unavailable': return c.fact_feed_unavailable;
    case 'official_floor': return f.do_not_travel ? c.fact_official_dnt : c.fact_official_floor;
    case 'avoided_segments': return c.fact_avoided(f.count);
    case 'discouraged_share': return c.fact_share(Math.round(f.share * 100), Math.round(f.limit * 100));
    case 'fresh_depth_on_route': {
      const seg = SEGMENT_BY_ID.get(f.segment_id);
      return c.fact_depth(seg?.name ?? c.unnamedRoad, c[`cat_${f.category}`]);
    }
    case 'no_path': return c.fact_no_path;
    case 'endpoint_on_flagged_road':
      return c.fact_endpoint(SEGMENT_BY_ID.get(f.segment_id)?.name ?? c.unnamedRoad, f.end === 'origin');
  }
}

export function ResultScreen({ lang, go }: Props) {
  const c = COPY[lang];
  const session = useRouteSession();
  const official = useOfficialSource();
  const states = useSegmentStates(session.mode);
  const result = session.result;

  if (!result) {
    return (
      <Button mode="contained" onPress={() => go('ask')}>{c.backToAsk}</Button>
    );
  }

  const refusal = result.kind === 'refusal';
  const option = refusal ? null : result.options[session.selectedOption] ?? result.options[0];
  const facts = refusal ? result.refusal_facts : option!.explanation_facts;
  const depthSegments = [
    ...new Set(
      facts.flatMap((f) => (f.kind === 'fresh_depth_on_route' || f.kind === 'endpoint_on_flagged_road' ? [f.segment_id] : [])),
    ),
  ];
  const allCalm = option ? option.state_counts.discouraged + option.state_counts.uncertain + option.state_counts.avoid === 0 : false;

  return (
    <SpeedGate lang={lang}>
      <View style={styles.wrap}>
        {/* Official status sits above any route (R15). */}
        <OfficialBanner lang={lang} />

        {refusal ? (
          <View style={[styles.headline, { backgroundColor: STATE_STYLE.avoid.bg }]} accessibilityLiveRegion="assertive">
            <Icon source="sign-direction-remove" size={36} color={STATE_STYLE.avoid.fg} />
            <Text variant="headlineSmall" style={[styles.headlineText, { color: STATE_STYLE.avoid.fg }]}>{c.refusal}</Text>
            <Text variant="bodyLarge" style={{ color: STATE_STYLE.avoid.fg }}>{c.refusalBody}</Text>
          </View>
        ) : (
          <View style={[styles.headline, { backgroundColor: allCalm ? STATE_STYLE.no_adverse_evidence.bg : STATE_STYLE.uncertain.bg }]}>
            <Icon source="map-marker-path" size={32} color={BRAND.ink} />
            <Text variant="titleLarge" style={styles.headlineText}>{allCalm ? c.resultRoute : c.resultRouteUncertain}</Text>
            {allCalm && <Text variant="bodyMedium" style={styles.inkSoft}>{c.calmest}</Text>}
          </View>
        )}

        {!refusal && result.options.length > 1 && (
          <SegmentedButtons
            value={String(session.selectedOption)}
            onValueChange={(v) => updateSession({ selectedOption: Number(v) })}
            buttons={result.options.map((_, i) => ({ value: String(i), label: `${c.option} ${i + 1}` }))}
          />
        )}

        <FloodMap
          states={states}
          feedUnavailable={official.feedStatus !== 'ok'}
          statements={official.statements}
          routes={refusal ? [] : [option!.geometry, ...result.options.filter((o) => o !== option).map((o) => o.geometry)]}
          origin={session.origin.point}
          destination={session.destination?.point}
          onSegmentPress={(id) => { updateSession({ segmentId: id }); go('segment'); }}
          height={320}

        />

        {option && (
          <Card>
            <View style={styles.statsRow}>
              <View>
                <Text style={styles.statLabel}>{c.distance}</Text>
                <Text variant="titleLarge" style={styles.stat}>{(option.length_m / 1000).toFixed(1)} km</Text>
              </View>
              {option.duration_s !== null && (
                <Text style={styles.inkSoft}>{c.aboutMinutes(Math.max(1, Math.round(option.duration_s / 60)))}</Text>
              )}
            </View>
            <View style={styles.chips}>
              {(Object.keys(option.state_counts) as SegmentStateKey[])
                .filter((k) => option.state_counts[k] > 0)
                .map((k) => <StateChip key={k} lang={lang} state={k} count={option.state_counts[k]} />)}
            </View>
          </Card>
        )}

        <Card>
          <Text variant="titleMedium" style={styles.sectionTitle}>{c.evidence}</Text>
          {facts.map((f, i) => {
            const t = factText(c, f);
            return t ? (
              <View key={i} style={styles.fact}>
                <Icon source="circle-small" size={20} color={BRAND.inkSoft} />
                <Text style={styles.factText}>{t}</Text>
              </View>
            ) : null;
          })}
          {depthSegments.map((id) => (
            <Button key={id} mode="text" icon="information-outline" onPress={() => { updateSession({ segmentId: id }); go('segment'); }}>
              {`${c.whyRoad} ${SEGMENT_BY_ID.get(id)?.name ?? c.unnamedRoad}`}
            </Button>
          ))}
          <View style={styles.caveat}>
            <Icon source="map-legend" size={18} color={BRAND.inkSoft} />
            <Text style={styles.caveatText}>{c.unmapped}</Text>
          </View>
        </Card>

        {refusal && (
          <Button mode="contained" icon="share-variant" contentStyle={styles.cta} onPress={() => Share.share({ message: c.shareRefusal })}>
            {c.shareRefusalBtn}
          </Button>
        )}
        <Button mode="outlined" icon="bullhorn-outline" contentStyle={styles.cta} onPress={() => go('warning')}>{c.openWarning}</Button>
        <Button mode="text" icon="arrow-left" contentStyle={styles.cta} onPress={() => go('ask')}>{c.backToAsk}</Button>
        <Text style={styles.emergency}>{c.emergency}</Text>
      </View>
    </SpeedGate>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 14 },
  headline: { borderRadius: 20, padding: 18, gap: 8 },
  headlineText: { fontWeight: '800', color: BRAND.ink },
  inkSoft: { color: BRAND.inkSoft },
  statsRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  statLabel: { color: BRAND.inkSoft, fontSize: 13 },
  stat: { fontWeight: '800', color: BRAND.ink },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 },
  sectionTitle: { fontWeight: '700', marginBottom: 6, color: BRAND.ink },
  fact: { flexDirection: 'row', alignItems: 'flex-start', gap: 2, marginVertical: 3 },
  factText: { flex: 1, fontSize: 15, lineHeight: 21, color: BRAND.ink },
  caveat: { flexDirection: 'row', gap: 8, marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: BRAND.outline },
  caveatText: { flex: 1, fontSize: 14, color: BRAND.inkSoft },
  cta: { minHeight: 52 },
  emergency: { textAlign: 'center', color: BRAND.inkSoft, fontSize: 13, marginTop: 4 },
});
