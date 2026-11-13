// A grid of district buttons, used when we can't (or the user doesn't want to) use GPS.
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { DISTRICTS } from '@/data/districts';

type Props = {
  selected: string | null;
  onSelect: (districtName: string) => void;
};

export function DistrictPicker({ selected, onSelect }: Props) {
  return (
    <View style={styles.grid}>
      {DISTRICTS.map((district) => {
        const isSelected = district.name === selected;
        return (
          <Pressable
            key={district.name}
            onPress={() => onSelect(district.name)}
            style={[styles.chip, isSelected && styles.chipSelected]}>
            <Text style={[styles.chipText, isSelected && styles.chipTextSelected]}>
              {district.name}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    backgroundColor: 'white',
  },
  chipSelected: {
    backgroundColor: '#1D4ED8',
    borderColor: '#1D4ED8',
  },
  chipText: {
    fontSize: 15,
    color: '#111827',
  },
  chipTextSelected: {
    color: 'white',
    fontWeight: '700',
  },
});
