// A simple header we draw ourselves: a Back button and a title.
// We use this instead of iOS's built-in header, which on new iPhones
// is see-through and covered the top of our content.
import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export function ScreenHeader({ title }: { title: string }) {
  return (
    // edges={['top']} adds space for the clock / notch at the top of the phone.
    <SafeAreaView edges={['top']} style={styles.safeArea}>
      <View style={styles.row}>
        <Pressable onPress={() => router.back()} hitSlop={12} style={styles.back}>
          <Text style={styles.backText}>‹ Back</Text>
        </Pressable>
        <Text style={styles.title}>{title}</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  row: {
    height: 52,
    justifyContent: 'center',
  },
  back: {
    position: 'absolute',
    left: 16,
    zIndex: 1,
  },
  backText: {
    fontSize: 18,
    color: '#2563EB',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
    color: '#111827',
  },
});
