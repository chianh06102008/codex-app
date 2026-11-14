// Repeats the official status on route and report screens (PRD R15: a route is
// never drawn above a hidden warning). Dev 1/2 own the real status band on S1;
// this compact version reads the same source.
import { StyleSheet, View } from 'react-native';
import { Icon, Text } from 'react-native-paper';

import { COPY, type Lang } from '@/copy/mapReport';
import { useOfficialSource } from '@/features/fusion/officialSource';
import { BRAND, STATE_STYLE } from '@/features/map/stateStyle';

export function OfficialBanner({ lang }: { lang: Lang }) {
  const c = COPY[lang];
  const official = useOfficialSource();
  const active = official.statements.length > 0;
  const down = official.feedStatus === 'unavailable';
  const text = active ? c.warningInForce : down ? c.feedDown : c.calmest;
  const bg = active ? STATE_STYLE.avoid.bg : down ? BRAND.warningBand : STATE_STYLE.no_adverse_evidence.bg;
  const fg = active ? STATE_STYLE.avoid.fg : down ? BRAND.warningInk : STATE_STYLE.no_adverse_evidence.fg;
  return (
    <View style={[styles.band, { backgroundColor: bg }]} accessible accessibilityLiveRegion="polite">
      <Icon source={active ? 'alert-octagon' : down ? 'access-point-network-off' : 'information-outline'} size={22} color={fg} />
      <View style={styles.textCol}>
        <Text style={[styles.text, { color: fg }]}>{text}</Text>
        {official.simulated && <Text style={[styles.badge, { color: fg }]}>{c.simulatedBadge}</Text>}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  band: { flexDirection: 'row', gap: 10, padding: 12, borderRadius: 14, alignItems: 'flex-start' },
  textCol: { flex: 1, gap: 4 },
  text: { fontSize: 15, fontWeight: '600', lineHeight: 21 },
  badge: { fontSize: 12, fontWeight: '700', opacity: 0.8 },
});
