// Map of the pilot slice with segment states, official layer and optional route.
// The official/uncertain layer has no off switch (PRD T14). On refusal, pass no
// route: nothing is drawn through blocked roads (P3).
import { memo, useEffect, useMemo, useRef } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import MapView, { Marker, Polygon, Polyline, UrlTile, type MapPressEvent } from 'react-native-maps';
import { Text } from 'react-native-paper';

import { MAP_TILE_ATTRIBUTION, MAP_TILE_URL } from '@/config';

const USE_OSM_TILES = Platform.OS !== 'ios';
// Apple shows its own legal link on iOS; our road overlays are OSM-derived either way.
const ATTRIBUTION = USE_OSM_TILES ? MAP_TILE_ATTRIBUTION : '© OpenStreetMap contributors';
import type { LatLon, OfficialStatement, SegmentState } from '@/domain/types';
import { useOfficialSource } from '@/features/fusion/officialSource';
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
  /** Corner radius of the map frame. 0 for a full-screen map (S1 Home). */
  cornerRadius?: number;
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
  cornerRadius = 20,
}: FloodMapProps) {
  // Fly to the phone's GPS fix once it arrives. Maps that show a route keep the route in view.
  const mapRef = useRef<MapView>(null);
  const { userLocation } = useOfficialSource();
  const centered = useRef(false);
  useEffect(() => {
    if (centered.current || !userLocation || routes.length > 0) return;
    centered.current = true;
    mapRef.current?.animateToRegion({ ...userLocation, latitudeDelta: 0.018, longitudeDelta: 0.018 }, 900);
  }, [userLocation, routes.length]);

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
    <View style={[styles.wrap, { height, borderRadius: cornerRadius }]}>
      <MapView
        ref={mapRef}
        style={StyleSheet.absoluteFill}
        initialRegion={SLICE_REGION}
        // iOS: Apple Maps, free, no key or developer account (muted so state colors stand out).
        // Android: the native map is Google, so OSM tiles replace it (no Google key needed).
        mapType={USE_OSM_TILES ? 'none' : 'mutedStandard'}
        minZoomLevel={5}
        maxZoomLevel={19}
        onPress={onPress ? (e: MapPressEvent) => onPress(e.nativeEvent.coordinate) : undefined}
        // Real position: the native blue dot (pulses on iOS). Needs location permission.
        showsUserLocation
        showsPointsOfInterests={false}
        showsBuildings={false}
        toolbarEnabled={false}
        rotateEnabled={false}
        pitchEnabled={false}
        accessibilityLabel="Bản đồ khu vực thí điểm"
      >
        {USE_OSM_TILES && (
          <UrlTile urlTemplate={MAP_TILE_URL} maximumZ={19} shouldReplaceMapContent zIndex={-1} tileCacheMaxAge={7 * 24 * 3600} />
        )}
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
        <Text style={styles.attributionText}>{ATTRIBUTION}</Text>
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
