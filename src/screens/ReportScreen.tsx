// S6 Report: dry-ground acknowledgement -> camera -> confirm snapped road ->
// explicit category tap. Cannot publish without the tap (T04). Draft survives a
// killed app (T08). Only the redacted image is kept or uploaded (T13).
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Image, Pressable, StyleSheet, View } from 'react-native';
import { Button, Checkbox, Icon, Switch, Text } from 'react-native-paper';

import { SNAP_MAX_M } from '@/config';
import { COPY, type Lang } from '@/copy/mapReport';
import type { DepthCategory, Report } from '@/domain/types';
import { useOfficialSource } from '@/features/fusion/officialSource';
import { useSegmentStates } from '@/features/fusion/segmentStates';
import { FloodMap } from '@/features/map/FloodMap';
import { SEGMENT_BY_ID, insideSlice, snapToRoad } from '@/features/map/roads';
import { BRAND, STATE_STYLE } from '@/features/map/stateStyle';
import { type ReportDraft, clearDraft, emptyDraft, loadDraft, saveDraft } from '@/features/report/draft';
import { redactPhoto } from '@/features/report/redact';
import { addReport } from '@/features/report/reportStore';
import { analyzePhoto } from '@/features/report/vision';
import { updateSession } from '@/features/routing/session';
import { SpeedGate } from '@/features/speed-gate/SpeedGate';
import { useSpeed } from '@/features/speed-gate/speed';
import { Card } from '@/features/ui/Card';

type Props = { lang: Lang; go: (screen: 'home' | 'segment') => void };

const CATS: { key: DepthCategory; icon: string }[] = [
  { key: 'ankle', icon: 'shoe-sneaker' },
  { key: 'wheel', icon: 'tire' },
  { key: 'unknown', icon: 'help-circle-outline' },
];

export function ReportScreen({ lang, go }: Props) {
  const c = COPY[lang];
  const official = useOfficialSource();
  const states = useSegmentStates('motorbike');
  const speed = useSpeed();
  const [draft, setDraft] = useState<ReportDraft>(emptyDraft);
  const [restored, setRestored] = useState(false);
  const [busy, setBusy] = useState<'' | 'redact' | 'vision'>('');
  const [error, setError] = useState('');
  const loaded = useRef(false);

  useEffect(() => {
    loadDraft().then((d) => {
      if (d && d.step > 1 && d.step < 5) {
        // A vision call cannot survive a restart: treat it as unavailable.
        setDraft({ ...d, vision: d.vision ?? { ok: false, reason: 'error' } });
        setRestored(true);
      }
      loaded.current = true;
    });
  }, []);

  function update(patch: Partial<ReportDraft>) {
    setDraft((d) => {
      const next = { ...d, ...patch };
      if (loaded.current && next.step < 5) saveDraft(next);
      return next;
    });
  }

  async function capture(fromCamera: boolean) {
    setError('');
    let result: ImagePicker.ImagePickerResult;
    if (fromCamera) {
      const perm = await ImagePicker.requestCameraPermissionsAsync();
      if (!perm.granted) { setError(c.cameraDenied); return; }
      result = await ImagePicker.launchCameraAsync({ mediaTypes: 'images', quality: 0.9, exif: false });
    } else {
      result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: 'images', quality: 0.9, exif: false });
    }
    if (result.canceled || !result.assets?.[0]) return;

    setBusy('redact');
    try {
      const red = await redactPhoto(result.assets[0].uri);
      // Try to pre-place the road from the current fix, if the person already allowed location.
      let segmentId: string | null = null;
      let point = null;
      if (speed.permission === 'granted') {
        try {
          const pos = await Location.getLastKnownPositionAsync();
          const p = pos && { latitude: pos.coords.latitude, longitude: pos.coords.longitude };
          const snap = p && insideSlice(p) ? snapToRoad(p, SNAP_MAX_M) : null;
          if (snap) { segmentId = snap.segment.id; point = snap.point; }
        } catch { /* person confirms on the map anyway */ }
      }
      update({ photoUri: red.uri, photoBytes: red.bytes, step: 3, segmentId, point, vision: null });
      setBusy('vision');
      const vision = await analyzePhoto(red.base64);
      update({
        vision,
        // If the model is down, the only depth choice is unknown (PRD Flow: report).
        category: null,
      });
    } catch {
      setError(c.modelUnavailable);
    } finally {
      setBusy('');
    }
  }

  async function publish() {
    if (!draft.category || !draft.segmentId || !draft.point) return;
    const v = draft.vision?.ok ? draft.vision : null;
    const report: Report = {
      id: `local-${Date.now()}`,
      created_at: new Date().toISOString(),
      server_received_at: null,
      segment_id: draft.segmentId,
      lat: draft.point.latitude,
      lon: draft.point.longitude,
      accuracy_m: null,
      model_category: v ? v.category : null,
      model_confidence: v ? v.confidence : null,
      model_reference_objects: v ? v.reference_objects : [],
      human_category: draft.category,
      water_visible: draft.category === 'unknown' ? draft.waterVisible : true,
      obstruction: draft.obstruction ? 'debris' : 'none',
      vehicle_context: null,
      no_water: false,
      reporter_trust: 'low',
      perceptual_hash: null,
      status: 'published',
      retracted_at: null,
      photo_uri: draft.photoUri,
    };
    await addReport(report);
    await clearDraft();
    setDraft((d) => ({ ...d, step: 5 }));
  }

  async function discard() {
    await clearDraft();
    setDraft(emptyDraft());
    setRestored(false);
  }

  const visionDown = draft.vision !== null && !draft.vision.ok;
  const seg = draft.segmentId ? SEGMENT_BY_ID.get(draft.segmentId) : null;

  return (
    <SpeedGate lang={lang}>
      <View style={styles.wrap}>
        <Text variant="headlineMedium" style={styles.h1}>{c.reportTitle}</Text>
        {draft.step < 5 && (
          <View style={styles.progressRow}>
            {[1, 2, 3, 4].map((n) => (
              <View key={n} style={[styles.progressDot, n <= Math.min(draft.step, 4) && styles.progressDotOn]} />
            ))}
            <Text style={styles.soft}>{c.step(Math.min(draft.step, 4))}</Text>
          </View>
        )}
        {restored && draft.step < 5 && (
          <View style={styles.restored}>
            <Text style={styles.soft}>{c.draftRestored}</Text>
            <Button compact onPress={discard}>{c.discard}</Button>
          </View>
        )}

        {/* Step 1: dry ground, always first (P6). */}
        {draft.step === 1 && (
          <>
            <View style={styles.dryCard}>
              <Icon source="weather-pouring" size={40} color={BRAND.warningInk} />
              <Text variant="titleLarge" style={styles.dryText}>{c.beforeCamera}</Text>
            </View>
            <Pressable style={styles.ackRow} onPress={() => update({ dryAck: !draft.dryAck })} accessibilityRole="checkbox" accessibilityState={{ checked: draft.dryAck }}>
              <Checkbox.Android status={draft.dryAck ? 'checked' : 'unchecked'} color={BRAND.primary} />
              <Text variant="titleMedium" style={styles.flex}>{c.dryAck}</Text>
            </Pressable>
            <Button mode="contained" disabled={!draft.dryAck} onPress={() => update({ step: 2 })} contentStyle={styles.cta} labelStyle={styles.ctaLabel}>
              {c.continue}
            </Button>
            <Text style={styles.emergency}>{c.emergency}</Text>
          </>
        )}

        {/* Step 2: photo. */}
        {draft.step === 2 && (
          <>
            <Card style={styles.photoCard}>
              <Icon source="camera-outline" size={56} color={BRAND.primary} />
              <Text style={styles.soft}>{c.beforeCamera}</Text>
            </Card>
            {busy === 'redact' ? (
              <View style={styles.busy}><ActivityIndicator /><Text>{c.redacting}</Text></View>
            ) : (
              <>
                <Button mode="contained" icon="camera" onPress={() => capture(true)} contentStyle={styles.cta} labelStyle={styles.ctaLabel}>{c.takePhoto}</Button>
                <Button mode="outlined" icon="image-multiple" onPress={() => capture(false)} contentStyle={styles.cta}>{c.choosePhoto}</Button>
              </>
            )}
            {!!error && <Text style={styles.error}>{error}</Text>}
          </>
        )}

        {/* Step 3: confirm the snapped road. */}
        {draft.step === 3 && (
          <>
            {draft.photoUri && (
              <View>
                <Image source={{ uri: draft.photoUri }} style={styles.photo} />
                <Text style={styles.small}>{c.redacted}{draft.photoBytes ? ` (${Math.round(draft.photoBytes / 1000)} KB)` : ''}</Text>
              </View>
            )}
            <Text variant="titleMedium" style={styles.h2}>{c.confirmRoad}</Text>
            <Text style={styles.soft}>{c.confirmRoadHint}</Text>
            <FloodMap
              states={states}
              feedUnavailable={official.feedStatus === 'unavailable'}
              statements={official.statements}
              highlightSegmentId={draft.segmentId}
              onPress={(p) => {
                const snap = snapToRoad(p, SNAP_MAX_M);
                if (snap) { update({ segmentId: snap.segment.id, point: snap.point }); setError(''); }
                else setError(c.noRoadNear);
              }}
              height={300}
              attribution={c.mapAttribution}
            />
            {seg && <Text variant="titleMedium">{seg.name ?? c.unnamedRoad}</Text>}
            {!!error && <Text style={styles.error}>{error}</Text>}
            <Button mode="contained" disabled={!draft.segmentId} onPress={() => update({ step: 4 })} contentStyle={styles.cta} labelStyle={styles.ctaLabel}>
              {c.thisRoad}
            </Button>
          </>
        )}

        {/* Step 4: explicit category tap. */}
        {draft.step === 4 && (
          <>
            <Text variant="titleLarge" style={styles.h2}>{c.pickDepth}</Text>
            <Text style={styles.soft}>{c.pickDepthHint}</Text>

            <Card style={styles.modelCard}>
              {busy === 'vision' || draft.vision === null ? (
                <View style={styles.busy}><ActivityIndicator /><Text>{c.analyzing}</Text></View>
              ) : draft.vision.ok ? (
                <>
                  <Text style={styles.body}>
                    {draft.vision.category === 'unknown' ? c.modelAbstains : c.modelProposal(c[`cat_${draft.vision.category}`])}
                  </Text>
                  {draft.vision.mock && <Text style={styles.badge}>{c.modelMock}</Text>}
                </>
              ) : (
                <Text style={styles.body}>{c.modelUnavailable}</Text>
              )}
            </Card>

            <View style={styles.cats}>
              {CATS.map(({ key, icon }) => {
                const disabled = (visionDown || busy === 'vision') && key !== 'unknown';
                const selected = draft.category === key;
                return (
                  <Pressable
                    key={key}
                    disabled={disabled}
                    onPress={() => update({ category: key })}
                    style={[styles.cat, selected && styles.catOn, disabled && styles.catOff]}
                    accessibilityRole="radio"
                    accessibilityState={{ selected, disabled }}
                  >
                    <Icon source={icon} size={30} color={selected ? '#FFFFFF' : BRAND.ink} />
                    <Text style={[styles.catText, selected && styles.catTextOn]}>{c[`cat_${key}`]}</Text>
                  </Pressable>
                );
              })}
            </View>

            {draft.category === 'unknown' && (
              <View style={styles.switchRow}>
                <Text style={styles.flex}>{c.waterVisible}</Text>
                <Switch value={draft.waterVisible} onValueChange={(v) => update({ waterVisible: v })} color={BRAND.primary} />
              </View>
            )}
            <View style={styles.switchRow}>
              <Text style={styles.flex}>{c.obstruction}</Text>
              <Switch value={draft.obstruction} onValueChange={(v) => update({ obstruction: v })} color={BRAND.primary} />
            </View>

            <Button mode="contained" icon="send" disabled={!draft.category} onPress={publish} contentStyle={styles.cta} labelStyle={styles.ctaLabel}>
              {c.publish}
            </Button>
            <Button mode="text" onPress={() => update({ step: 3 })}>{c.change}</Button>
          </>
        )}

        {/* Done. */}
        {draft.step === 5 && (
          <>
            <View style={[styles.dryCard, { backgroundColor: STATE_STYLE.no_adverse_evidence.bg }]}>
              <Icon source="check-circle-outline" size={40} color={BRAND.primary} />
              <Text variant="titleMedium" style={{ color: BRAND.ink }}>{c.savedLocal}</Text>
            </View>
            {draft.segmentId && (
              <Button mode="contained" icon="map-marker-radius" contentStyle={styles.cta} onPress={() => { updateSession({ segmentId: draft.segmentId }); go('segment'); }}>
                {c.whyRoad} {seg?.name ?? ''}
              </Button>
            )}
            <Button mode="outlined" contentStyle={styles.cta} onPress={() => { setDraft(emptyDraft()); go('home'); }}>{c.done}</Button>
          </>
        )}
      </View>
    </SpeedGate>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 14 },
  h1: { fontWeight: '800', color: BRAND.ink },
  h2: { fontWeight: '700', color: BRAND.ink },
  soft: { color: BRAND.inkSoft },
  small: { color: BRAND.inkSoft, fontSize: 12, marginTop: 6 },
  body: { fontSize: 15, color: BRAND.ink },
  flex: { flex: 1 },
  progressRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  progressDot: { width: 28, height: 6, borderRadius: 3, backgroundColor: BRAND.outline },
  progressDotOn: { backgroundColor: BRAND.primary },
  restored: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#EEF4F5', borderRadius: 12, paddingLeft: 12 },
  dryCard: { backgroundColor: BRAND.warningBand, borderRadius: 20, padding: 20, gap: 12 },
  dryText: { color: BRAND.warningInk, fontWeight: '800', lineHeight: 30 },
  ackRow: { flexDirection: 'row', alignItems: 'center', gap: 8, minHeight: 56, backgroundColor: BRAND.surface, borderRadius: 14, paddingHorizontal: 8, borderWidth: 1, borderColor: BRAND.outline },
  cta: { minHeight: 56 },
  ctaLabel: { fontSize: 17, fontWeight: '700' },
  emergency: { textAlign: 'center', color: BRAND.inkSoft, fontSize: 13 },
  photoCard: { alignItems: 'center', gap: 10, paddingVertical: 28 },
  busy: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 8 },
  error: { color: STATE_STYLE.avoid.fg, fontWeight: '600' },
  photo: { width: '100%', height: 220, borderRadius: 16, backgroundColor: '#DDE6E8' },
  modelCard: { gap: 8 },
  badge: { alignSelf: 'flex-start', fontSize: 12, fontWeight: '700', color: '#45397A', backgroundColor: '#EFEBFA', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, overflow: 'hidden' },
  cats: { flexDirection: 'row', gap: 10 },
  cat: { flex: 1, minHeight: 104, borderRadius: 18, borderWidth: 2, borderColor: BRAND.outline, backgroundColor: BRAND.surface, alignItems: 'center', justifyContent: 'center', gap: 8, padding: 8 },
  catOn: { backgroundColor: BRAND.primary, borderColor: BRAND.primary },
  catOff: { opacity: 0.35 },
  catText: { textAlign: 'center', fontWeight: '700', color: BRAND.ink },
  catTextOn: { color: '#FFFFFF' },
  switchRow: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 48 },
});
