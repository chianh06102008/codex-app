// Wrap any screen that shows route detail or the camera.
import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { Icon, Text } from 'react-native-paper';

import { COPY, type Lang } from '@/copy/mapReport';
import { BRAND } from '@/features/map/stateStyle';
import { isMoving, useSpeed, useSpeedWatcher } from './speed';

export function SpeedGate({ lang, children }: { lang: Lang; children: ReactNode }) {
  useSpeedWatcher();
  const speed = useSpeed();
  const c = COPY[lang];
  if (!isMoving(speed)) return <>{children}</>;
  return (
    <View style={styles.gate} accessibilityLiveRegion="assertive" accessibilityRole="alert">
      <Icon source="hand-back-left" size={72} color="#FFFFFF" />
      <Text variant="headlineMedium" style={styles.title}>{c.moving}</Text>
      <Text variant="bodyLarge" style={styles.body}>{c.movingBody}</Text>
      {speed.simulatedKmh !== null && <Text style={styles.badge}>{c.simulatedBadge}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  gate: {
    flex: 1,
    minHeight: 480,
    borderRadius: 24,
    backgroundColor: BRAND.ink,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    gap: 16,
  },
  title: { color: '#FFFFFF', textAlign: 'center', fontWeight: '800' },
  body: { color: '#D5E3E8', textAlign: 'center' },
  badge: { color: BRAND.ink, backgroundColor: '#FFFFFF', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, overflow: 'hidden' },
});
