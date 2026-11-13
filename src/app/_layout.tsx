// Root layout: a simple "stack" navigator.
// Each screen is pushed on top of the previous one. Swipe from the left edge to go back.
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

export default function RootLayout() {
  return (
    <>
      <StatusBar style="dark" />
      {/* We hide the built-in header everywhere; screens draw their own <ScreenHeader>. */}
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: '#F6F7F9' },
          animation: 'slide_from_right',
        }}
      />
    </>
  );
}
