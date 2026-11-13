// Home screen: the user's area, flood risk for the next 3 hours, and nearby flooded streets.
import * as Location from 'expo-location';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { DistrictPicker } from '@/components/district-picker';
import { ReportRow } from '@/components/report-row';
import { RISK_BADGES, timeAgo } from '@/constants/flood-labels';
import { findNearestDistrict } from '@/data/districts';
import { useFloodReports } from '@/data/flood-reports';
import { getFloodRisk, type FloodRisk } from '@/data/fake-weather';

// What happened when we tried to find the user's district with GPS.
type LocationStatus = 'locating' | 'found' | 'denied' | 'outside' | 'error';

const STATUS_MESSAGES: Record<Exclude<LocationStatus, 'locating' | 'found'>, string> = {
  denied: 'Location is off. Pick your district below.',
  outside: "You don't seem to be in Hanoi. Pick a district below.",
  error: "We couldn't find your location. Pick your district below.",
};

export default function HomeScreen() {
  const [district, setDistrict] = useState<string | null>(null);
  const [status, setStatus] = useState<LocationStatus>('locating');
  const [showPicker, setShowPicker] = useState(false);
  const [risk, setRisk] = useState<FloodRisk | null>(null);
  const reports = useFloodReports();

  // 1. When the screen opens, ask for location and turn it into a district.
  useEffect(() => {
    async function locate() {
      try {
        // iOS shows the permission popup only the first time.
        const permission = await Location.requestForegroundPermissionsAsync();
        if (!permission.granted) {
          setStatus('denied');
          return;
        }
        // A rough position is enough to know the district, and it is faster.
        const position = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        const nearest = findNearestDistrict(position.coords.latitude, position.coords.longitude);
        if (nearest) {
          setDistrict(nearest.name);
          setStatus('found');
        } else {
          setStatus('outside');
        }
      } catch {
        setStatus('error');
      }
    }
    locate();
  }, []);

  // 2. Whenever the district changes, load its flood risk.
  useEffect(() => {
    if (!district) return;
    let isCurrent = true; // ignore old answers if the user switches district quickly
    getFloodRisk(district).then((result) => {
      if (isCurrent) setRisk(result);
    });
    return () => {
      isCurrent = false;
    };
  }, [district]);

  function pickDistrict(name: string) {
    setDistrict(name);
    setShowPicker(false);
  }

  // Only show reports in the user's district.
  const nearbyReports = reports.filter((report) => report.district === district);
  const riskIsLoading = district !== null && risk?.district !== district;
  const pickerVisible = showPicker || (status !== 'locating' && district === null);

  return (
    <View style={styles.screen}>
      <SafeAreaView edges={['top']} style={styles.header}>
        <Text style={styles.appName}>🌧️ Hanoi Flood Watch</Text>
      </SafeAreaView>

      <ScrollView contentContainerStyle={styles.content}>
        {/* --- Current area --- */}
        <View style={styles.card}>
          <Text style={styles.cardLabel}>Your area</Text>
          {status === 'locating' && district === null ? (
            <View style={styles.inline}>
              <ActivityIndicator />
              <Text style={styles.muted}>Finding your location…</Text>
            </View>
          ) : (
            <View style={styles.areaRow}>
              <Text style={styles.areaName}>{district ?? 'No district selected'}</Text>
              {district !== null && (
                <Pressable onPress={() => setShowPicker(!showPicker)} hitSlop={8}>
                  <Text style={styles.link}>{showPicker ? 'Close' : 'Change'}</Text>
                </Pressable>
              )}
            </View>
          )}

          {status !== 'locating' && status !== 'found' && (
            <Text style={styles.muted}>{STATUS_MESSAGES[status]}</Text>
          )}
          {pickerVisible && <DistrictPicker selected={district} onSelect={pickDistrict} />}
        </View>

        {/* --- Flood risk for the next 3 hours --- */}
        {district !== null && (
          <View style={styles.card}>
            <Text style={styles.cardLabel}>Flood risk · next 3 hours</Text>
            {riskIsLoading || risk === null ? (
              <ActivityIndicator style={{ marginVertical: 16 }} />
            ) : (
              <RiskSummary risk={risk} />
            )}
          </View>
        )}

        {/* --- Nearby flooded streets --- */}
        {district !== null && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Flooded streets nearby</Text>
            {nearbyReports.length === 0 ? (
              <Text style={styles.muted}>No reports in {district} yet.</Text>
            ) : (
              nearbyReports.map((report) => <ReportRow key={report.id} report={report} />)
            )}
          </View>
        )}
      </ScrollView>

      {/* --- Big button, always visible at the bottom --- */}
      <SafeAreaView edges={['bottom']} style={styles.footer}>
        <Pressable
          style={({ pressed }) => [styles.reportButton, pressed && { opacity: 0.7 }]}
          onPress={() => router.push({ pathname: '/report', params: { district: district ?? '' } })}>
          <Text style={styles.reportButtonText}>📷  Report flooding</Text>
        </Pressable>
      </SafeAreaView>
    </View>
  );
}

// The colored risk badge plus rainfall and update time.
function RiskSummary({ risk }: { risk: FloodRisk }) {
  const badge = RISK_BADGES[risk.risk_level];
  return (
    <View style={{ gap: 10 }}>
      <View style={[styles.riskBadge, { backgroundColor: badge.background }]}>
        <View style={[styles.riskDot, { backgroundColor: badge.color }]} />
        <Text style={[styles.riskText, { color: badge.color }]}>{badge.label}</Text>
      </View>
      <Text style={styles.rain}>
        Expected rain: <Text style={{ fontWeight: '800' }}>{risk.rain_mm_next_3h} mm</Text>
      </Text>
      <Text style={styles.muted}>Updated {timeAgo(risk.updated_at)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  header: {
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  appName: {
    fontSize: 22,
    fontWeight: '800',
    color: '#111827',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  content: {
    padding: 16,
    gap: 16,
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    gap: 10,
  },
  cardLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
    textTransform: 'uppercase',
  },
  inline: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  areaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  areaName: {
    fontSize: 26,
    fontWeight: '800',
    color: '#111827',
  },
  link: {
    fontSize: 16,
    color: '#2563EB',
    fontWeight: '600',
  },
  muted: {
    fontSize: 15,
    color: '#6B7280',
  },
  riskBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 999,
  },
  riskDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
  },
  riskText: {
    fontSize: 22,
    fontWeight: '800',
  },
  rain: {
    fontSize: 18,
    color: '#111827',
  },
  section: {
    gap: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  footer: {
    paddingHorizontal: 16,
    paddingTop: 12,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  reportButton: {
    backgroundColor: '#DC2626',
    paddingVertical: 20,
    borderRadius: 16,
    alignItems: 'center',
    marginBottom: 12,
  },
  reportButtonText: {
    color: 'white',
    fontSize: 22,
    fontWeight: '800',
  },
});
