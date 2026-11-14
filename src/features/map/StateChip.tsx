import { StyleSheet, View } from 'react-native';
import { Icon, Text } from 'react-native-paper';

import { COPY, type Lang } from '@/copy/mapReport';
import type { SegmentStateKey } from '@/domain/types';
import { STATE_STYLE } from './stateStyle';

const ORDER: SegmentStateKey[] = ['avoid', 'discouraged', 'uncertain', 'no_adverse_evidence'];

export function stateLabel(lang: Lang, s: SegmentStateKey) {
  return COPY[lang][`state_${s}`];
}

export function StateChip({ lang, state, count }: { lang: Lang; state: SegmentStateKey; count?: number }) {
  const st = STATE_STYLE[state];
  return (
    <View style={[styles.chip, { backgroundColor: st.bg }]} accessible accessibilityLabel={stateLabel(lang, state)}>
      <Icon source={st.icon} size={16} color={st.fg} />
      <Text style={[styles.chipText, { color: st.fg }]}>
        {stateLabel(lang, state)}
        {count !== undefined ? ` · ${count}` : ''}
      </Text>
    </View>
  );
}

export function Legend({ lang }: { lang: Lang }) {
  const c = COPY[lang];
  return (
    <View style={styles.legend}>
      <View style={styles.legendRow}>
        {ORDER.slice(0, 3).map((s) => (
          <View key={s} style={styles.legendItem}>
            <View style={[styles.swatch, { backgroundColor: STATE_STYLE[s].line }, s === 'uncertain' && styles.dashed]} />
            <Text style={styles.legendText}>{stateLabel(lang, s)}</Text>
          </View>
        ))}
      </View>
      <Text style={styles.calm}>{c.calmest}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  chip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999, alignSelf: 'flex-start' },
  chipText: { fontWeight: '700', fontSize: 13 },
  legend: { gap: 8 },
  legendRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 14 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  swatch: { width: 22, height: 6, borderRadius: 3 },
  dashed: { opacity: 0.75 },
  legendText: { fontSize: 13, color: '#33454E' },
  calm: { fontSize: 13, color: '#405863' },
});
