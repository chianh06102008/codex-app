// Current weather where the phone is (Open-Meteo), one scrollable row on Home.
import { ScrollView, StyleSheet, View } from 'react-native';
import { Icon } from 'react-native-paper';

import { T } from '@/components/SharedPrimitives';
import { LIVE } from '@/copy/live';
import type { Lang } from '@/copy/mapReport';
import { COLORS, RADIUS } from '@/theme';
import { useLive } from './liveStore';

function icon(code: number | null, day: boolean | null) {
  if (code === null) return 'weather-cloudy';
  if (code === 0) return day === false ? 'weather-night' : 'weather-sunny';
  if (code <= 3) return 'weather-partly-cloudy';
  if (code <= 48) return 'weather-fog';
  if (code <= 67) return 'weather-rainy';
  if (code <= 82) return 'weather-pouring';
  return 'weather-lightning-rainy';
}

export function WeatherStrip({ lang }: { lang: Lang }) {
  const c = LIVE[lang];
  const w = useLive().weather;
  if (!w) return null;
  const dir = w.windDirDeg === null ? '' : c.dirs[Math.round(w.windDirDeg / 45) % 8]; // where the wind comes from (meteorological convention: "gió Đông Bắc")
  const next3 = Math.round(w.hourly.slice(0, 3).reduce((a, h) => a + h.mm, 0) * 10) / 10;
  const items: [string, string][] = [
    ['thermometer', `${c.temp(w.temperatureC ?? '–')} · ${c.feels(w.feelsLikeC ?? '–')}`],
    ['water-percent', c.humidity(w.humidityPct ?? '–')],
    ['weather-windy', c.wind(w.windKmh ?? '–', dir)],
    ['weather-windy-variant', c.gusts(w.windGustKmh ?? '–')],
    ['cloud-outline', c.clouds(w.cloudCoverPct ?? '–')],
    ['weather-rainy', c.rainNow(w.precipitationMm ?? 0)],
    ['umbrella-outline', c.rainNext3(next3)],
    ['gauge', c.pressure(w.pressureHpa === null ? '–' : Math.round(w.pressureHpa))],
    ['eye-outline', c.visibility(w.visibilityM === null ? '–' : Math.round(w.visibilityM / 100) / 10)],
    ['white-balance-sunny', c.uv(w.uvIndex ?? '–')],
  ];
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
      <View style={[styles.chip, styles.main]}>
        <Icon source={icon(w.weatherCode, w.isDay)} size={18} color={COLORS.white} />
        <T t="small" w="bold" color={COLORS.white}>{c.wmo(w.weatherCode ?? 0)}</T>
      </View>
      {items.map(([ic, text]) => (
        <View key={ic} style={styles.chip}>
          <Icon source={ic} size={16} color={COLORS.ink} />
          <T t="small" w="semibold">{text}</T>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: { gap: 6, paddingRight: 16 },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(255,255,255,0.95)', borderRadius: RADIUS.pill, paddingHorizontal: 10, minHeight: 34, borderWidth: 1, borderColor: COLORS.outline },
  main: { backgroundColor: '#1D4ED8', borderColor: '#1D4ED8' },
});
