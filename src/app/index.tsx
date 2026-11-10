// Home screen: app name, a short description, and buttons to take or pick a photo.
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { Alert, Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

// Settings shared by the camera and the photo library.
const PICKER_OPTIONS: ImagePicker.ImagePickerOptions = {
  mediaTypes: ['images'], // photos only, no videos
  quality: 0.7, // slightly compressed: smaller files, still easy to read
};

// Go to the Result screen and pass the photo's location (URI) along.
function goToResult(photoUri: string) {
  router.push({ pathname: '/result', params: { photoUri } });
}

export default function HomeScreen() {
  async function takePhoto() {
    // 1. Ask for camera permission. iOS shows its popup only the first time.
    const permission = await ImagePicker.requestCameraPermissionsAsync();

    // 2. If the user said "Don't Allow", explain why and offer to open Settings.
    if (!permission.granted) {
      Alert.alert(
        'Camera access needed',
        'To check a price, the app needs to take a photo of the item or menu. ' +
          'You can turn on camera access in Settings, or choose a photo from your library instead.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Open Settings', onPress: () => Linking.openSettings() },
        ]
      );
      return;
    }

    // 3. Open the camera. `canceled` is true if the user closed it without a photo.
    const result = await ImagePicker.launchCameraAsync(PICKER_OPTIONS);
    if (!result.canceled) {
      goToResult(result.assets[0].uri);
    }
  }

  async function chooseFromLibrary() {
    // On iOS the system photo picker works without asking for library permission.
    const result = await ImagePicker.launchImageLibraryAsync(PICKER_OPTIONS);
    if (!result.canceled) {
      goToResult(result.assets[0].uri);
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.emoji}>🧾</Text>
        <Text style={styles.title}>Fair Price VN</Text>
        <Text style={styles.subtitle}>
          Snap an item or menu and see if the price is fair in Vietnam.
        </Text>
      </View>

      <View style={styles.actions}>
        <Pressable
          style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed]}
          onPress={takePhoto}>
          <Text style={styles.primaryButtonText}>📷  Take a photo</Text>
        </Pressable>

        <Pressable
          style={({ pressed }) => [styles.secondaryButton, pressed && styles.pressed]}
          onPress={chooseFromLibrary}>
          <Text style={styles.secondaryButtonText}>Choose from library</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    justifyContent: 'space-between',
  },
  header: {
    marginTop: 80,
    alignItems: 'center',
    gap: 12,
  },
  emoji: {
    fontSize: 64,
  },
  title: {
    fontSize: 36,
    fontWeight: '800',
    color: '#111827',
  },
  subtitle: {
    fontSize: 18,
    color: '#4B5563',
    textAlign: 'center',
    lineHeight: 26,
  },
  actions: {
    gap: 12,
    marginBottom: 24,
  },
  primaryButton: {
    backgroundColor: '#DA251D', // Vietnamese flag red
    paddingVertical: 24,
    borderRadius: 16,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: 'white',
    fontSize: 22,
    fontWeight: '700',
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
  pressed: {
    opacity: 0.7,
  },
});
