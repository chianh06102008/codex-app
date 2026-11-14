import React, { useState } from 'react'
import { ActivityIndicator, Linking, Pressable, StyleSheet, Text, View } from 'react-native'
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context'
import { WebView } from 'react-native-webview'

function readSite() {
  try {
    const url = new URL(process.env.EXPO_PUBLIC_FLOODSCOUT_URL?.trim())
    if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password) return null
    url.searchParams.set('expo', '1')
    return url
  } catch {
    return null
  }
}

const site = readSite()

const lockPageZoom = `
  (() => {
    const viewport = document.querySelector('meta[name="viewport"]');
    if (viewport) {
      viewport.content = 'width=device-width, initial-scale=1, minimum-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover';
    }
    // Cancel native WebView magnification while preserving touch events for MapLibre.
    if (!window.__floodScoutPageZoomLocked) {
      window.__floodScoutPageZoomLocked = true;
      for (const type of ['gesturestart', 'gesturechange', 'gestureend']) {
        document.addEventListener(type, event => event.preventDefault(), { passive: false });
      }
    }
  })();
  true;
`

function Button({ children, onPress }) {
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={styles.button}>
      <Text style={styles.buttonText}>{children}</Text>
    </Pressable>
  )
}

function FloodScout() {
  const [attempt, setAttempt] = useState(0)
  const [failed, setFailed] = useState(false)
  const [externalError, setExternalError] = useState(false)

  async function openExternal(url) {
    try {
      await Linking.openURL(url)
    } catch {
      setExternalError(true)
    }
  }

  function allowNavigation({ url, isTopFrame }) {
    if (isTopFrame === false) return true
    try {
      const destination = new URL(url)
      if (destination.origin === site.origin) return true
      if (['https:', 'http:', 'tel:', 'mailto:'].includes(destination.protocol)) {
        void openExternal(destination.href)
      }
    } catch {
      return false
    }
    return false
  }

  if (!site || failed) {
    return (
      <View style={styles.message}>
        <Text accessibilityRole="header" style={styles.heading}>FloodScout VN</Text>
        <Text style={styles.text}>
          {site ? 'Could not load FloodScout. Check that your phone can reach the server.'
            : 'Set EXPO_PUBLIC_FLOODSCOUT_URL in mobile/.env.local and restart Expo.'}
        </Text>
        {site && (
          <Button onPress={() => {
            setFailed(false)
            setAttempt((value) => value + 1)
          }}>Try again</Button>
        )}
      </View>
    )
  }

  return (
    <>
      <WebView
        key={attempt}
        source={{ uri: site.href }}
        originWhitelist={['http://*', 'https://*', 'tel:*', 'mailto:*']}
        onShouldStartLoadWithRequest={allowNavigation}
        onOpenWindow={({ nativeEvent }) => allowNavigation({ url: nativeEvent.targetUrl })}
        onError={() => setFailed(true)}
        onHttpError={({ nativeEvent }) => {
          if (nativeEvent.url === site.href) setFailed(true)
        }}
        geolocationEnabled={site.protocol === 'https:'}
        scalesPageToFit={false}
        injectedJavaScriptBeforeContentLoaded={lockPageZoom}
        injectedJavaScript={lockPageZoom}
        allowsInlineMediaPlayback
        mediaCapturePermissionGrantType="prompt"
        startInLoadingState
        renderLoading={() => <ActivityIndicator accessibilityLabel="Loading FloodScout" style={styles.loading} />}
        style={styles.web}
      />
      <View style={styles.toolbar}>
        <Button onPress={() => void openExternal(site.href)}>Open in browser</Button>
        {externalError && <Text accessibilityRole="alert">Could not open the link.</Text>}
      </View>
    </>
  )
}

export default function App() {
  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.container}><FloodScout /></SafeAreaView>
    </SafeAreaProvider>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f3f4ef' },
  web: { flex: 1 },
  message: { flex: 1, justifyContent: 'center', padding: 24, gap: 12 },
  heading: { fontSize: 22, fontWeight: '700', color: '#191b14' },
  text: { fontSize: 16, color: '#41463c' },
  button: { alignSelf: 'flex-start', minHeight: 44, justifyContent: 'center', paddingHorizontal: 16, borderRadius: 22, backgroundColor: '#191b14' },
  buttonText: { color: '#fff', fontWeight: '600' },
  loading: { ...StyleSheet.absoluteFillObject, backgroundColor: '#f3f4ef' },
  toolbar: { alignItems: 'center', padding: 4 },
})
