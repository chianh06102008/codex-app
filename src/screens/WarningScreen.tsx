// S2 Warning: the official bulletin in full. Issuer, issue time, validity, retrieval time
// and the link to the original sit above the fold (PRD P8, T11). The original text is shown
// as published; nothing here paraphrases or softens it.
// Layout ported from Dev 1's Figma shell; content comes from the official source (Dev 2).
import { Linking, StyleSheet, View } from 'react-native';

import { ButtonSecondary, Overline, ShellCard, StatusBand, T } from '@/components/SharedPrimitives';
import { COPY, type Lang } from '@/copy/mapReport';
import { STRINGS, type ShellCopy } from '@/copy/strings';
import type { OfficialStatement } from '@/domain/types';
import { useOfficialSource } from '@/features/fusion/officialSource';
import { statementTitle, summarizeOfficial } from '@/features/official/officialView';
import { formatVnTime } from '@/lib/time';
import { COLORS, RADIUS } from '@/theme';

const NCHMF_HOME = 'https://nchmf.gov.vn/';

export function openOfficialLink(url: string = NCHMF_HOME) {
  // Opening can fail (no browser, bad link): there is nothing more useful to do than stay put.
  Linking.openURL(url).catch(() => undefined);
}

/** Link the bottom action bar opens: the strictest bulletin in force, else the NCHMF site. */
export function usePrimaryOfficialUrl(): string {
  const view = summarizeOfficial(useOfficialSource());
  return view.inForce[0]?.source_url || NCHMF_HOME;
}

export function WarningScreen({ lang }: { lang: Lang }) {
  const s = STRINGS[lang];
  const mr = COPY[lang];
  const official = useOfficialSource();
  const view = summarizeOfficial(official);

  return (
    <View style={styles.wrap}>
      {view.simulated && <T t="small" w="semibold" color={COLORS.inkSoft}>{s.simulatedNote}</T>}

      {view.tone === 'degraded' && (
        <>
          <StatusBand tone="degraded" overline={s.bandStatusOverline} title={s.bandFeedDownTitle} body={s.bandFeedDownBody} />
          <ShellCard>
            <T t="heading" w="bold">{s.noBulletinTitle}</T>
            <T color={COLORS.inkSoft}>{s.noBulletinBody}</T>
            <ButtonSecondary label={s.openNchmf} onPress={() => openOfficialLink()} />
          </ShellCard>
        </>
      )}

      {view.tone === 'calm' && (
        <>
          <StatusBand tone="calm" overline={s.bandStatusOverline} title={s.bandCalmTitle} body={s.bandCalmBody} />
          <ShellCard>
            <T>{s.feedOkNoWarning}</T>
            <ButtonSecondary label={s.openNchmf} onPress={() => openOfficialLink()} />
          </ShellCard>
        </>
      )}

      {view.inForce.map((st) => (
        <Bulletin key={st.id} statement={st} s={s} inForce routingLine={mr.warningInForce} />
      ))}
      {view.expired.map((st) => (
        <Bulletin key={st.id} statement={st} s={s} inForce={false} routingLine={mr.warningInForce} />
      ))}

      <ShellCard>
        <Overline>{s.emergencyOverline}</Overline>
        <T t="heading" w="bold">{s.emergency}</T>
      </ShellCard>
    </View>
  );
}

function Bulletin({
  statement: st,
  s,
  inForce,
  routingLine,
}: {
  statement: OfficialStatement;
  s: ShellCopy;
  inForce: boolean;
  routingLine: string;
}) {
  const issued = formatVnTime(st.valid_from) ?? s.missing;
  const until = formatVnTime(st.valid_until) ?? s.missing;
  const rows: [string, string][] = [
    [s.rowIssuer, st.issuer || s.missing],
    [s.rowIssued, issued],
    [s.rowValid, `${issued} – ${until}`],
    [s.rowLevel, st.severity || s.missing],
    [s.rowArea, st.area_names.length ? st.area_names.join(', ') : s.missing], // every name, as published
    [s.rowRetrieved, formatVnTime(st.retrieved_at) ?? s.missing],
  ];

  return (
    <View style={styles.bulletin}>
      <StatusBand
        tone={inForce ? 'warning' : 'degraded'}
        overline={inForce ? s.bandWarningOverline : s.expiredTag}
        title={statementTitle(st) ?? s.bandWarningOverline}
      />

      {/* Source and clock (P8), with the original link above the fold (T11). */}
      <ShellCard>
        {rows.map(([label, value]) => (
          <View key={label} style={styles.row}>
            <T color={COLORS.inkSoft} style={styles.rowLabel}>{label}</T>
            <T w="semibold" style={styles.rowValue}>{value}</T>
          </View>
        ))}
        <ButtonSecondary label={`${s.openOriginal} · nchmf.gov.vn`} onPress={() => openOfficialLink(st.source_url)} />
      </ShellCard>

      {st.do_not_travel && inForce && (
        <View style={styles.dnt}>
          <Overline color={COLORS.warningInk}>{s.doNotTravelOverline}</Overline>
          <T t="heading" w="bold">{s.doNotTravelBody}</T>
        </View>
      )}

      <View style={styles.verbatim}>
        <Overline color={COLORS.warningInk}>{s.verbatimOverline}</Overline>
        {/* parse failed: the link only, no invented summary (PRD §13). */}
        <T selectable>{st.parse_status === 'failed' || !st.instruction_text ? s.parseFailed : st.instruction_text}</T>
      </View>

      {inForce && (
        <View style={styles.soft}>
          <Overline>{s.routingOverline}</Overline>
          <T w="semibold">{routingLine}</T>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 16 },
  bulletin: { gap: 16 },
  row: { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  rowLabel: { width: 124 },
  rowValue: { flex: 1 },
  dnt: {
    backgroundColor: COLORS.warningBand,
    borderWidth: 2,
    borderColor: COLORS.warningBorder,
    borderRadius: RADIUS.lg,
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 6,
  },
  verbatim: {
    backgroundColor: COLORS.warningBand,
    borderWidth: 1.5,
    borderColor: COLORS.warningSoftBorder,
    borderRadius: RADIUS.lg,
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 6,
  },
  soft: { backgroundColor: COLORS.surfaceSoft, borderRadius: RADIUS.lg, paddingHorizontal: 16, paddingVertical: 14, gap: 6 },
});
