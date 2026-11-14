// S8 Settings: language, text size, what the app does with location and photos, and
// deleting your own reports. Layout ported from Dev 1's Figma shell.
// Every statement here describes what this build really does (reports stay on the phone).
import { useState } from 'react';
import { Linking, StyleSheet, View } from 'react-native';

import { ButtonSecondary, Overline, Segmented, ShellCard, T } from '@/components/SharedPrimitives';
import { COPY, type Lang } from '@/copy/mapReport';
import { STRINGS } from '@/copy/strings';
import { MAP_TILE_ATTRIBUTION } from '@/config';
import { deleteMyReports, useReports } from '@/features/report/reportStore';
import { updateSettings, useSettings } from '@/features/settings/settingsStore';
import { COLORS } from '@/theme';
import type { TextSize } from '@/theme';

export function SettingsScreen({ lang }: { lang: Lang }) {
  const s = STRINGS[lang];
  const mr = COPY[lang];
  const { textSize } = useSettings();
  const { reports } = useReports();
  const [deleted, setDeleted] = useState(false);
  const mine = reports.filter((r) => !r.sample).length;

  async function onDelete() {
    await deleteMyReports();
    setDeleted(true);
  }

  return (
    <View style={styles.wrap}>
      <View style={styles.group}>
        <Overline>{s.language}</Overline>
        <Segmented<Lang>
          label={s.language}
          value={lang}
          onChange={(next) => updateSettings({ lang: next })}
          options={[
            { value: 'vi', label: 'Tiếng Việt' },
            { value: 'en', label: 'English' },
          ]}
        />
      </View>

      <View style={styles.group}>
        <Overline>{s.textSize}</Overline>
        <Segmented<TextSize>
          label={s.textSize}
          value={textSize}
          onChange={(next) => updateSettings({ textSize: next })}
          options={[
            { value: 'default', label: s.textDefault },
            { value: 'large', label: s.textLarge },
            { value: 'xlarge', label: s.textXLarge },
          ]}
        />
      </View>

      <View style={styles.group}>
        <Overline>{s.permissions}</Overline>
        <ShellCard>
          <View style={styles.item}>
            <T w="semibold">{s.permLocationTitle}</T>
            <T color={COLORS.inkSoft}>{s.permLocationBody}</T>
          </View>
          <View style={styles.divider} />
          <View style={styles.item}>
            <T w="semibold">{s.permPhotoTitle}</T>
            <T color={COLORS.inkSoft}>{s.permPhotoBody}</T>
          </View>
          <ButtonSecondary label={s.openSystemSettings} onPress={() => Linking.openSettings().catch(() => undefined)} />
        </ShellCard>
      </View>

      <View style={styles.group}>
        <Overline>{s.yourData}</Overline>
        <ShellCard>
          <T>{s.retention}</T>
          <ButtonSecondary danger label={deleted && mine === 0 ? s.deleted : s.deleteMine(mine)} onPress={onDelete} />
        </ShellCard>
      </View>

      <View style={styles.group}>
        <Overline>{s.about}</Overline>
        <ShellCard>
          <T>{mr.pilotArea}</T>
          <T t="small" color={COLORS.inkSoft}>{MAP_TILE_ATTRIBUTION}</T>
          <T w="semibold">{s.emergency}</T>
        </ShellCard>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 22 },
  group: { gap: 8 },
  item: { gap: 2 },
  divider: { height: 1, backgroundColor: COLORS.divider },
});
