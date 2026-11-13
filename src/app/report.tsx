// Report screen: take (or choose) a photo of a flooded street, then let the "AI" analyze it.
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Alert, Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ScreenHeader } from '@/components/screen-header';
import { analyzeFloodPhoto } from '@/data/fake-flood-ai';

// Settings shared by the camera and the photo library.
const PICKER_OPTIONS: ImagePicker.ImagePickerOptions = {
  mediaTypes: ['images'], // photos only, no videos
  quality: 0.7, // slightly compressed: smaller file, faster upload later
};

export default function ReportScreen() {
  // Home passes the user's district so the report is filed in the right area.
  const { district } = useLocalSearchParams<{ district?: string }>();

  // The photo being analyzed. While it is set, we show the loading state.
  const [photoUri, setPhotoUri] = useState<string | null>(null);

  // Send the photo to the (fake) AI, then open the Analysis screen with the result.
  async function analyze(uri: string) {
    setPhotoUri(uri);
    try {
      const analysis = await analyzeFloodPhoto(uri);
      // `replace` instead of `push`: pressing Back on Analysis goes straight to Home.
      router.replace({
        pathname: '/analysis',
        params: { photoUri: uri, district: district ?? '', analysis: JSON.stringify(analysis) },
      });
    } catch {
      setPhotoUri(null);
      Alert.alert('Analysis failed', 'Please try again.');
    }
  }

  async function takePhoto() {
    // 1. Ask for camera permission. iOS shows its popup only the first time.
    const permission = await ImagePicker.requestCameraPermissionsAsync();

    // 2. If the user said "Don't Allow", explain and offer Settings or the library.
    if (!permission.granted) {
      Alert.alert(
        'Camera access needed',
        'To report flooding, the app needs a photo of the street. ' +
          'Turn on camera access in Settings, or choose a photo from your library.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Choose from library', onPress: chooseFromLibrary },
          { text: 'Open Settings', onPress: () => Linking.openSettings() },
        ]
      );
      return;
    }

    // 3. Open the camera. `canceled` is true if the user closed it without a photo.
    const result = await ImagePicker.launchCameraAsync(PICKER_OPTIONS);
    if (!result.canceled) analyze(result.assets[0].uri);
  }

  async function chooseFromLibrary() {
    // On iOS the system photo picker works without asking for library permission.
    const result = await ImagePicker.launchImageLibraryAsync(PICKER_OPTIONS);
    if (!result.canceled) analyze(result.assets[0].uri);
  }

  // --- Loading state: show the photo with a spinner while the AI "thinks" ---
  if (photoUri) {
    return (
      <View style={styles.screen}>
        <ScreenHeader title="Report flooding" />
        <View style={styles.loading}>
          <Image source={{ uri: photoUri }} style={styles.preview} contentFit="cover" />
          <ActivityIndicator size="large" />
          <Text style={styles.loadingText}>Estimating water depth…</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <ScreenHeader title="Report flooding" />
      <SafeAreaView edges={['bottom']} style={styles.body}>
        <View style={styles.intro}>
          <Text style={styles.emoji}>🛵🌊</Text>
          <Text style={styles.title}>Photograph the flooded street</Text>
          <Text style={styles.subtitle}>
            Stand somewhere safe and include a motorbike, car or curb if you can. It helps
            estimate the water depth.
          </Text>
          {district ? <Text style={styles.district}>Area: {district}</Text> : null}
        </View>

        <View style={styles.actions}>
          <Pressable
            style={({ pressed }) => [styles.primaryButton, pressed && { opacity: 0.7 }]}
            onPress={takePhoto}>
            <Text style={styles.primaryButtonText}>📷  Open camera</Text>
          </Pressable>
          <Pressable
            style={({ pressed }) => [styles.secondaryButton, pressed && { opacity: 0.7 }]}
            onPress={chooseFromLibrary}>
            <Text style={styles.secondaryButtonText}>Choose from library</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  body: {
    flex: 1,
    padding: 24,
    justifyContent: 'space-between',
  },
  intro: {
    marginTop: 40,
    alignItems: 'center',
    gap: 12,
  },
  emoji: {
    fontSize: 56,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: '#111827',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 17,
    lineHeight: 24,
    color: '#4B5563',
    textAlign: 'center',
  },
  district: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1D4ED8',
  },
  actions: {
    gap: 12,
    marginBottom: 12,
  },
  primaryButton: {
    backgroundColor: '#DC2626',
    paddingVertical: 22,
    borderRadius: 16,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: 'white',
    fontSize: 22,
    fontWeight: '800',
  },
  secondaryButton: {
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#D1D5DB',
    backgroundColor: 'white',
  },
  secondaryButtonText: {
    color: '#111827',
    fontSize: 18,
    fontWeight: '600',
  },
  loading: {
    flex: 1,
    padding: 24,
    alignItems: 'center',
    gap: 16,
  },
  preview: {
    width: '100%',
    aspectRatio: 3 / 4,
    borderRadius: 16,
    backgroundColor: '#E5E7EB',
  },
  loadingText: {
    fontSize: 17,
    color: '#4B5563',
  },
});
