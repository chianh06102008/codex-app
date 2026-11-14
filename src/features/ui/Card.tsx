import type { ReactNode } from 'react';
import { StyleSheet, View, type ViewStyle } from 'react-native';

import { BRAND } from '@/features/map/stateStyle';

export function Card({ children, style }: { children: ReactNode; style?: ViewStyle }) {
  return <View style={[styles.card, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: BRAND.surface,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: BRAND.outline,
    shadowColor: '#0B2530',
    shadowOpacity: 0.06,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 3 },
    elevation: 1,
  },
});
