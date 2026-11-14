// App root: providers and navigation only. Screens live in src/screens/.
// One import per weight, so only the four font files the app uses are bundled.
import { PlusJakartaSans_400Regular } from '@expo-google-fonts/plus-jakarta-sans/400Regular';
import { PlusJakartaSans_600SemiBold } from '@expo-google-fonts/plus-jakarta-sans/600SemiBold';
import { PlusJakartaSans_700Bold } from '@expo-google-fonts/plus-jakarta-sans/700Bold';
import { PlusJakartaSans_800ExtraBold } from '@expo-google-fonts/plus-jakarta-sans/800ExtraBold';
import { useFonts } from 'expo-font';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useMemo } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { PaperProvider } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { loadReports } from '@/features/report/reportStore';
import { startLiveData } from '@/features/official/loadOfficial';
import { loadSettings, useSettings, useTextScale } from '@/features/settings/settingsStore';
import { Navigation } from '@/screens/_navigation';
import { COLORS, makePaperTheme } from '@/theme';

export default function App() {
  // Design font (Plus Jakarta Sans). If it fails to load, text falls back to the system font.
  const [fontsLoaded, fontError] = useFonts({
    PlusJakartaSans_400Regular,
    PlusJakartaSans_600SemiBold,
    PlusJakartaSans_700Bold,
    PlusJakartaSans_800ExtraBold,
  });
  const { lang } = useSettings();
  const scale = useTextScale();
  const theme = useMemo(() => makePaperTheme(scale), [scale]);

  // Restore what was saved on the phone: settings and this phone's own reports.
  useEffect(() => {
    void loadSettings();
    void loadReports();
    startLiveData();
  }, []);

  return (
    <SafeAreaProvider>
      <PaperProvider theme={theme}>
        <StatusBar style="dark" />
        {fontsLoaded || fontError ? (
          <Navigation lang={lang} />
        ) : (
          <View style={styles.loading}>
            <ActivityIndicator color={COLORS.ink} />
          </View>
        )}
      </PaperProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.background },
});
