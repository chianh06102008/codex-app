// Switches for the live map layers (each names its source).
import { Pressable, StyleSheet, View } from 'react-native';
import { Icon } from 'react-native-paper';

import { T } from '@/components/SharedPrimitives';
import { LIVE } from '@/copy/live';
import type { Lang } from '@/copy/mapReport';
import { COLORS } from '@/theme';
import { setLayer, useLive, type LayerKey } from './liveStore';

export function LayerToggles({ lang }: { lang: Lang }) {
  const c = LIVE[lang];
  const live = useLive();
  const rows: [LayerKey, string, string][] = [
    ['showRadar', c.layer_radar, 'RainViewer'],
    ['showClouds', c.layer_clouds, 'Himawari-9 · NASA GIBS'],
    ['showPopulation', c.layer_population, 'NASA SEDAC GPW 2020'],
    ['showContours', c.layer_contours, 'OpenTopoMap · © OpenStreetMap'],
  ];
  return (
    <View style={styles.wrap}>
      {rows.map(([k, label, src]) => (
        <Pressable key={k} onPress={() => setLayer(k, !live[k])} accessibilityRole="switch" accessibilityState={{ checked: live[k] }} style={styles.row}>
          <Icon source={live[k] ? 'checkbox-marked' : 'checkbox-blank-outline'} size={22} color={COLORS.ink} />
          <View style={styles.flex}>
            <T w="semibold">{label}</T>
            <T t="tiny" color={COLORS.inkSoft}>{src}</T>
          </View>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 4 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 48 },
  flex: { flex: 1 },
});
