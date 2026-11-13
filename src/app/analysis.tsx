// Analysis screen: the photo, the (fake) AI's estimate, and a button to warn other riders.
import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';

import { ScreenHeader } from '@/components/screen-header';
import { ScrollViewWithBar } from '@/components/scroll-view-with-bar';
import { DEPTH_LABELS, PASSABLE_BADGES } from '@/constants/flood-labels';
import { addReport } from '@/data/flood-reports';
import type { FloodAnalysis } from '@/data/fake-flood-ai';

// Route params are always strings, so the Report screen sends the analysis as JSON text.
function parseAnalysis(json: string | undefined): FloodAnalysis | null {
  try {
    return json ? (JSON.parse(json) as FloodAnalysis) : null;
  } catch {
    return null;
  }
}

export default function AnalysisScreen() {
  const params = useLocalSearchParams<{ photoUri: string; district?: string; analysis: string }>();
  const analysis = parseAnalysis(params.analysis);

  if (!analysis) {
    return (
      <View style={{ flex: 1 }}>
        <ScreenHeader title="Analysis" />
        <Text style={[styles.tip, { padding: 24 }]}>Something went wrong. Please go back and try again.</Text>
      </View>
    );
  }

  const badge = PASSABLE_BADGES[analysis.passable];

  function shareWarning() {
    if (!analysis) return;
    // Add this report to the list that Home shows under "Flooded streets nearby".
    addReport({
      district: params.district || 'Unknown area',
      street: analysis.street,
      depth_level: analysis.depth_level,
      depth_cm: analysis.depth_cm,
      passable: analysis.passable,
      photoUri: params.photoUri,
    });
    Alert.alert('Warning shared', `Riders near ${analysis.street} will see your report.`, [
      { text: 'OK', onPress: () => router.back() }, // back to Home
    ]);
  }

  return (
    <View style={{ flex: 1 }}>
      <ScreenHeader title="Analysis" />
      <ScrollViewWithBar contentContainerStyle={styles.container}>
        <Image source={{ uri: params.photoUri }} style={styles.photo} contentFit="cover" />

        <View style={styles.card}>
          <Text style={styles.street}>{analysis.street}</Text>

          {/* Big colored verdict: can a motorbike pass? */}
          <View style={[styles.verdict, { backgroundColor: badge.background }]}>
            <Text style={[styles.verdictText, { color: badge.color }]}>{badge.label}</Text>
          </View>

          <Row label="Water depth" value={`${DEPTH_LABELS[analysis.depth_level]} (~${analysis.depth_cm} cm)`} />
          <Row label="AI confidence" value={`${Math.round(analysis.confidence * 100)}%`} />

          <View style={styles.tipBox}>
            <Text style={styles.tipTitle}>Safety tip</Text>
            <Text style={styles.tip}>{analysis.tip}</Text>
          </View>

          <Pressable
            style={({ pressed }) => [styles.button, pressed && { opacity: 0.7 }]}
            onPress={shareWarning}>
            <Text style={styles.buttonText}>📢  Share warning</Text>
          </Pressable>
        </View>
      </ScrollViewWithBar>
    </View>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    paddingRight: 28, // room for the scrollbar
    gap: 16,
  },
  photo: {
    width: '100%',
    aspectRatio: 3 / 4,
    borderRadius: 16,
    backgroundColor: '#E5E7EB',
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    gap: 14,
  },
  street: {
    fontSize: 28,
    fontWeight: '800',
    color: '#111827',
  },
  verdict: {
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  verdictText: {
    fontSize: 22,
    fontWeight: '800',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  label: {
    fontSize: 16,
    color: '#6B7280',
  },
  value: {
    fontSize: 17,
    fontWeight: '700',
    color: '#111827',
  },
  tipBox: {
    backgroundColor: '#EFF6FF',
    borderRadius: 12,
    padding: 14,
    gap: 4,
  },
  tipTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1D4ED8',
  },
  tip: {
    fontSize: 16,
    lineHeight: 23,
    color: '#1F2937',
  },
  button: {
    marginTop: 4,
    backgroundColor: '#111827',
    paddingVertical: 18,
    borderRadius: 14,
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '700',
  },
});
