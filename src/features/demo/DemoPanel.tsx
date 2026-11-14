// Demo switches for judging/testing. Every simulated value is labeled in the UI.
// It never creates an official warning (PRD §13 honest demo rule).
import { StyleSheet, View } from 'react-native';
import { Switch, Text } from 'react-native-paper';

import { COPY, type Lang } from '@/copy/mapReport';
import { simulateHealthyFeed, simulateHeavyRain, useOfficialSource } from '@/features/fusion/officialSource';
import { BRAND } from '@/features/map/stateStyle';
import { setShowSamples, useReports } from '@/features/report/reportStore';
import { simulateSpeed, useSpeed } from '@/features/speed-gate/speed';
import { Card } from '@/features/ui/Card';

export function DemoPanel({ lang }: { lang: Lang }) {
  const c = COPY[lang];
  const official = useOfficialSource();
  const { showSamples } = useReports();
  const speed = useSpeed();
  const rows: { label: string; value: boolean; onChange: (v: boolean) => void }[] = [
    { label: c.demoFeed, value: official.simulated && official.feedStatus === 'ok', onChange: simulateHealthyFeed },
    { label: c.demoRain, value: official.heavyRainSimulated, onChange: simulateHeavyRain },
    { label: c.demoSamples, value: showSamples, onChange: setShowSamples },
    { label: c.demoSpeed, value: speed.simulatedKmh !== null, onChange: (v) => simulateSpeed(v ? 25 : null) },
  ];
  return (
    <Card style={styles.card}>
      <Text variant="titleSmall" style={styles.title}>{c.demoTitle}</Text>
      {rows.map((r) => (
        <View key={r.label} style={styles.row}>
          <Text style={styles.label}>{r.label}</Text>
          <Switch value={r.value} onValueChange={r.onChange} color={BRAND.primary} />
        </View>
      ))}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { borderStyle: 'dashed', backgroundColor: '#F7FAFA' },
  title: { fontWeight: '800', color: BRAND.inkSoft, marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.6 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 48 },
  label: { flex: 1, color: BRAND.ink, fontSize: 14 },
});
