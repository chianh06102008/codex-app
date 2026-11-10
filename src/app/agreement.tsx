// Agreement screen: a bilingual (Vietnamese + English) card to show the seller.
// The visitor edits the fields at the top; the big card below updates live.
import { useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';

import { ScreenHeader } from '@/components/screen-header';
import { ScrollViewWithBar } from '@/components/scroll-view-with-bar';
import { formatVnd } from '@/utils/format';

export default function AgreementScreen() {
  // Starting values come from the Result screen (item name and quoted price).
  const params = useLocalSearchParams<{ item?: string; price?: string }>();

  // Each editable field is a piece of state. Text inputs always work with strings.
  const [item, setItem] = useState(params.item ?? '');
  const [quantity, setQuantity] = useState('1');
  const [total, setTotal] = useState(params.price ?? '');

  // Keep only digits, so "120.000" or "120,000" both become "120000".
  const onlyDigits = (text: string) => text.replace(/[^0-9]/g, '');

  return (
    <View style={{ flex: 1 }}>
      <ScreenHeader title="Agree on price" />
      <ScrollViewWithBar
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
        automaticallyAdjustKeyboardInsets>
        {/* --- Editable fields --- */}
        <View style={styles.form}>
          <Text style={styles.formLabel}>Service / item</Text>
          <TextInput
            style={styles.input}
            value={item}
            onChangeText={setItem}
            placeholder="e.g. Phở bò"
          />

          <Text style={styles.formLabel}>Quantity / number of people</Text>
          <TextInput
            style={styles.input}
            value={quantity}
            onChangeText={(text) => setQuantity(onlyDigits(text))}
            keyboardType="number-pad"
          />

          <Text style={styles.formLabel}>Total price (VND)</Text>
          <TextInput
            style={styles.input}
            value={total}
            onChangeText={(text) => setTotal(onlyDigits(text))}
            keyboardType="number-pad"
            placeholder="e.g. 100000"
          />
        </View>

        {/* --- The card to show the seller (large, easy-to-read text) --- */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Thỏa thuận giá</Text>
          <Text style={styles.cardTitleEn}>Price agreement</Text>

          <CardRow vi="Dịch vụ / Món" en="Service / Item" value={item || '—'} />
          <CardRow vi="Số lượng / Số người" en="Quantity / People" value={quantity || '—'} />
          <CardRow
            vi="Tổng giá"
            en="Total price"
            value={total ? formatVnd(Number(total)) : '—'}
            highlight
          />

          <Text style={styles.confirm}>Chúng ta đồng ý giá này nhé?</Text>
          <Text style={styles.confirmEn}>Do we agree on this price?</Text>
        </View>
      </ScrollViewWithBar>
    </View>
  );
}

// One line of the card: Vietnamese label, English label underneath, then the value.
function CardRow(props: { vi: string; en: string; value: string; highlight?: boolean }) {
  return (
    <View style={styles.cardRow}>
      <Text style={styles.rowLabelVi}>{props.vi}</Text>
      <Text style={styles.rowLabelEn}>{props.en}</Text>
      <Text style={[styles.rowValue, props.highlight && styles.rowValueHighlight]}>
        {props.value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    paddingRight: 28, // room for the scrollbar
    gap: 20,
  },
  form: {
    gap: 6,
  },
  formLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4B5563',
    marginTop: 8,
  },
  input: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 18,
    color: '#111827',
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 20,
    borderWidth: 3,
    borderColor: '#DA251D',
    padding: 24,
    gap: 4,
  },
  cardTitle: {
    fontSize: 32,
    fontWeight: '800',
    color: '#DA251D',
    textAlign: 'center',
  },
  cardTitleEn: {
    fontSize: 20,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 12,
  },
  cardRow: {
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  rowLabelVi: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
  },
  rowLabelEn: {
    fontSize: 16,
    color: '#6B7280',
  },
  rowValue: {
    fontSize: 32,
    fontWeight: '800',
    color: '#111827',
    marginTop: 6,
  },
  rowValueHighlight: {
    fontSize: 40,
    color: '#DA251D',
  },
  confirm: {
    fontSize: 22,
    fontWeight: '700',
    color: '#111827',
    textAlign: 'center',
    marginTop: 16,
  },
  confirmEn: {
    fontSize: 18,
    color: '#6B7280',
    textAlign: 'center',
  },
});
