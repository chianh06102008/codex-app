// One flooded street in the "Nearby reports" list on the Home screen.
import { Image } from 'expo-image';
import { StyleSheet, Text, View } from 'react-native';

import { DEPTH_LABELS, PASSABLE_BADGES, timeAgo } from '@/constants/flood-labels';
import type { FloodReport } from '@/data/flood-reports';

export function ReportRow({ report }: { report: FloodReport }) {
  const badge = PASSABLE_BADGES[report.passable];

  return (
    <View style={styles.row}>
      {/* A colored bar on the left shows danger at a glance. */}
      <View style={[styles.colorBar, { backgroundColor: badge.color }]} />

      {report.photoUri ? (
        <Image source={{ uri: report.photoUri }} style={styles.thumb} contentFit="cover" />
      ) : null}

      <View style={styles.info}>
        <Text style={styles.street}>{report.street}</Text>
        <Text style={styles.detail}>
          {DEPTH_LABELS[report.depth_level]} · ~{report.depth_cm} cm · {timeAgo(report.reported_at)}
        </Text>
        <Text style={[styles.badge, { color: badge.color }]}>{badge.label}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 12,
    overflow: 'hidden',
    gap: 12,
  },
  colorBar: {
    width: 6,
    alignSelf: 'stretch',
  },
  thumb: {
    width: 56,
    height: 56,
    borderRadius: 8,
    backgroundColor: '#E5E7EB',
  },
  info: {
    flex: 1,
    paddingVertical: 12,
    paddingRight: 12,
    gap: 2,
  },
  street: {
    fontSize: 17,
    fontWeight: '700',
    color: '#111827',
  },
  detail: {
    fontSize: 14,
    color: '#6B7280',
  },
  badge: {
    fontSize: 14,
    fontWeight: '700',
  },
});
