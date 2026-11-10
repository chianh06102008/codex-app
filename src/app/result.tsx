// Result screen: shows the photo and whether the quoted price looks fair.
import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { checkPrice, type PriceCheckResult, type Verdict } from '@/data/fake-price-check';
import { ScreenHeader } from '@/components/screen-header';
import { ScrollViewWithBar } from '@/components/scroll-view-with-bar';
import { formatVnd } from '@/utils/format';

// Color and label for each verdict: green = normal, yellow = a bit high, red = unusually high.
const VERDICT_STYLES: Record<Verdict, { label: string; color: string; background: string }> = {
  normal: { label: 'Normal price', color: '#15803D', background: '#DCFCE7' },
  slightly_high: {
    label: 'A bit high',
    color: '#A16207',
    background: '#FEF9C3',
  },
  high: { label: 'Unusually high', color: '#B91C1C', background: '#FEE2E2' },
};

export default function ResultScreen() {
  // The Home screen passed the photo's URI as a route parameter.
  const { photoUri } = useLocalSearchParams<{ photoUri: string }>();

  // `null` while we are still "analyzing" the photo.
  const [result, setResult] = useState<PriceCheckResult | null>(null);

  // Run the (fake) price check once when the screen opens.
  useEffect(() => {
    checkPrice(photoUri).then(setResult);
  }, [photoUri]);

  return (
    <View style={{ flex: 1 }}>
      <ScreenHeader title="Price check" />
      <ScrollViewWithBar contentContainerStyle={styles.container}>
        <Image source={{ uri: photoUri }} style={styles.photo} contentFit="cover" />

        {result === null ? (
          <View style={styles.loading}>
            <ActivityIndicator size="large" />
            <Text style={styles.loadingText}>Checking the price…</Text>
          </View>
        ) : (
          <ResultCard result={result} />
        )}
      </ScrollViewWithBar>
    </View>
  );
}

// The card with item name, prices, verdict and explanation.
function ResultCard({ result }: { result: PriceCheckResult }) {
  const verdict = VERDICT_STYLES[result.verdict];
  const [low, high] = result.fair_range;

  function goToAgreement() {
    // Pre-fill the agreement with the item and quoted price; the user can edit them there.
    router.push({
      pathname: '/agreement',
      params: { item: result.item, price: String(result.quoted_price) },
    });
  }

  return (
    <View style={styles.card}>
      <Text style={styles.itemName}>{result.item}</Text>

      <View style={styles.row}>
        <Text style={styles.label}>Quoted price</Text>
        <Text style={styles.value}>{formatVnd(result.quoted_price)}</Text>
      </View>
      <View style={styles.row}>
        <Text style={styles.label}>Fair price</Text>
        <Text style={styles.value}>
          {formatVnd(low)} – {formatVnd(high)}
        </Text>
      </View>

      {/* Colored badge for the verdict */}
      <View style={[styles.verdictBadge, { backgroundColor: verdict.background }]}>
        <View style={[styles.verdictDot, { backgroundColor: verdict.color }]} />
        <Text style={[styles.verdictText, { color: verdict.color }]}>{verdict.label}</Text>
      </View>

      <Text style={styles.explanation}>{result.explanation}</Text>

      <Pressable
        style={({ pressed }) => [styles.button, pressed && { opacity: 0.7 }]}
        onPress={goToAgreement}>
        <Text style={styles.buttonText}>Agree on price</Text>
      </Pressable>
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
    aspectRatio: 3 / 4, // portrait, like most phone photos
    borderRadius: 16,
    backgroundColor: '#E5E7EB',
  },
  loading: {
    alignItems: 'center',
    gap: 12,
    paddingVertical: 32,
  },
  loadingText: {
    fontSize: 16,
    color: '#4B5563',
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    gap: 12,
  },
  itemName: {
    fontSize: 28,
    fontWeight: '800',
    color: '#111827',
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
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  verdictBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 8,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 999,
  },
  verdictDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  verdictText: {
    fontSize: 18,
    fontWeight: '700',
  },
  explanation: {
    fontSize: 16,
    lineHeight: 24,
    color: '#374151',
  },
  button: {
    marginTop: 8,
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
