// App settings (S8): language and text size. Saved on the phone so they survive a restart.
import AsyncStorage from '@react-native-async-storage/async-storage';

import type { Lang } from '@/copy/mapReport';
import { createStore, useStore } from '@/lib/store';
import { TEXT_SCALE, type TextSize } from '@/theme';

const KEY = 'floodscout.settings.v1';

type Settings = { lang: Lang; textSize: TextSize };

// Vietnamese is the default (PRD T10).
export const settingsStore = createStore<Settings>({ lang: 'vi', textSize: 'default' });

export function useSettings() {
  return useStore(settingsStore);
}

/** Multiplier for font sizes from the in-app text size setting. */
export function useTextScale(): number {
  return TEXT_SCALE[useSettings().textSize];
}

export function updateSettings(patch: Partial<Settings>) {
  settingsStore.set((s) => ({ ...s, ...patch }));
  // Saving is best-effort: if storage fails the setting still applies until the app closes.
  AsyncStorage.setItem(KEY, JSON.stringify(settingsStore.get())).catch(() => undefined);
}

export async function loadSettings(): Promise<void> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (!raw) return;
    const saved = JSON.parse(raw) as Partial<Settings>;
    settingsStore.set((s) => ({
      lang: saved.lang === 'en' || saved.lang === 'vi' ? saved.lang : s.lang,
      textSize: saved.textSize && saved.textSize in TEXT_SCALE ? saved.textSize : s.textSize,
    }));
  } catch {
    // Unreadable settings: keep the defaults.
  }
}
