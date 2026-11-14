// Map of the pilot slice with segment states, official layer and optional route.
// The official/uncertain layer has no off switch (PRD T14). On refusal, pass no
// route: nothing is drawn through blocked roads (P3).
import { memo, useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import MapView, { Marker, Polygon, Polyline, type MapPressEvent } from 'react-native-maps';
import { Text } from 'react-native-paper';

import type { LatLon, OfficialStatement, SegmentState } from '@/domain/types';
import { SEGMENT_BY_ID, SLICE_POLYGON, SLICE_REGION } from './roads';
import { BRAND, STATE_STYLE } from './stateStyle';

export type FloodMapProps = {
  states: Map<string, SegmentState>;
  feedUnavailable: boolean;
  statements?: OfficialStatement[];
  routes?: LatLon[][];
  origin?: LatLon | null;
  destination?: LatLon | null;
  highlightSegmentId?: string | null;
  onPress?: (p: LatLon) => void;
  onSegmentPress?: (segmentId: string) => void;
  height?: number;
  attribution: string;
};

function FloodMapInner({
  states,
  feedUnavailable,
  statements = [],
  routes = [],
  origin,
  destination,
  highlightSegmentId,
  onPress,
  onSegmentPress,
  height = 300,
  attribution,
}: FloodMapProps) {
  // Draw only roads with adverse or uncertain evidence; the basemap shows the rest.
  // When the feed is down every road is uncertain: the area tint carries that instead.
  const flagged = useMemo(
    () =>
      [...states.values()].filter(
        (s) => s.state === 'avoid' || s.state === 'discouraged' || (s.state === 'uncertain' && !feedUnavailable),
      ),
    [states, feedUnavailable],
  );

  const highlight = highlightSegmentId ? SEGMENT_BY_ID.get(highlightSegmentId) : null;

  return (
    <View style={[styles.wrap, { height }]}>
      <MapView
        style={StyleSheet.absoluteFill}
        initialRegion={SLICE_REGION}
        onPress={onPress ? (e: MapPressEvent) => onPress(e.nativeEvent.coordinate) : undefined}
        showsPointsOfInterest={false}
        showsBuildings={false}
        toolbarEnabled={false}
        rotateEnabled={false}
        pitchEnabled={false}
        accessibilityLabel="Bản đồ khu vực thí điểm"
      >
        {feedUnavailable && (
          <Polygon
            coordinates={SLICE_POLYGON}
            fillColor="rgba(110, 91, 170, 0.12)"
            strokeColor={STATE_STYLE.uncertain.line}
            strokeWidth={2}
            lineDashPattern={[8, 6]}
            tappable={false}
          />
        )}
        {statements.map((s) =>
          s.geometry ? (
            <Polygon
              key={s.id}
              coordinates={s.geometry}
              fillColor={s.do_not_travel ? 'rgba(198, 40, 40, 0.18)' : 'rgba(224, 123, 0, 0.16)'}
              strokeColor={s.do_not_travel ? STATE_STYLE.avoid.line : STATE_STYLE.discouraged.line}
              strokeWidth={2}
              tappable={false}
            />
          ) : null,
        )}
        {flagged.map((st) => {
          const seg = SEGMENT_BY_ID.get(st.segment_id);
          if (!seg) return null;
          const style = STATE_STYLE[st.state];
          return (
            <Polyline
              key={seg.id}
              coordinates={seg.geometry}
              strokeColor={style.line}
              strokeWidth={style.width}
              lineCap="round"
              lineDashPattern={st.state === 'uncertain' ? [6, 6] : undefined}
              tappable={!!onSegmentPress}
              onPress={onSegmentPress ? () => onSegmentPress(seg.id) : undefined}
              zIndex={st.state === 'avoid' ? 4 : 3}
            />
          );
        })}
        {routes.map((r, i) => (
          <Polyline
            key={`route-${i}`}
            coordinates={r}
            strokeColor={i === 0 ? BRAND.route : BRAND.routeAlt}
            strokeWidth={i === 0 ? 6 : 4}
            lineDashPattern={i === 0 ? undefined : [10, 6]}
            lineCap="round"
            lineJoin="round"
            zIndex={i === 0 ? 6 : 5}
          />
        ))}
        {highlight && (
          <Polyline coordinates={highlight.geometry} strokeColor="#111111" strokeWidth={10} zIndex={2} lineCap="round" />
        )}
        {origin && <Marker coordinate={origin} pinColor={BRAND.primary} title="A" />}
        {destination && <Marker coordinate={destination} pinColor="#7A1F5C" title="B" />}
      </MapView>
      <View style={styles.attribution} pointerEvents="none">
        <Text style={styles.attributionText}>{attribution}</Text>
      </View>
    </View>
  );
}

export const FloodMap = memo(FloodMapInner);

const styles = StyleSheet.create({
  wrap: { borderRadius: 20, overflow: 'hidden', backgroundColor: '#DCEBE8' },
  attribution: {
    position: 'absolute',
    right: 8,
    bottom: 6,
    backgroundColor: 'rgba(255,255,255,0.85)',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  attributionText: { fontSize: 10, color: '#33454E' },
});
