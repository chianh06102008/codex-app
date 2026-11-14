// The official status band on S1 Home (PRD F01): always the first thing on screen,
// including when the status is unavailable. Reads the same source as fusion and routing.
import { StatusBand } from '@/components/SharedPrimitives';
import type { Lang } from '@/copy/mapReport';
import { COPY } from '@/copy/mapReport';
import { STRINGS } from '@/copy/strings';
import { useOfficialSource } from '@/features/fusion/officialSource';
import { formatVnTime } from '@/lib/time';
import { statementTitle, summarizeOfficial } from './officialView';

export function OfficialStatusBand({
  lang,
  onPress,
  titleLines,
}: {
  lang: Lang;
  onPress?: () => void;
  titleLines?: number;
}) {
  const s = STRINGS[lang];
  const official = useOfficialSource();
  const view = summarizeOfficial(official);
  const badge = view.simulated ? COPY[lang].simulatedBadge : undefined;

  if (view.tone === 'warning') {
    const first = view.inForce[0];
    // Issuer, issue time and validity on every statement (PRD P8). Missing parts are said to be missing.
    const meta = [
      first.issuer || s.missing,
      s.issuedAt(formatVnTime(first.valid_from) ?? s.missing),
      s.validUntil(formatVnTime(first.valid_until) ?? s.missing),
    ].join(' · ');
    const more = view.inForce.length > 1 ? ` (${s.bandMore(view.inForce.length - 1)})` : '';
    return (
      <StatusBand
        tone="warning"
        overline={s.bandWarningOverline}
        title={(statementTitle(first) ?? s.bandWarningOverline) + more}
        meta={meta}
        linkLabel={s.bandViewBulletin}
        badge={badge}
        titleLines={titleLines}
        onPress={onPress}
      />
    );
  }

  if (view.tone === 'degraded') {
    return (
      <StatusBand
        tone="degraded"
        overline={s.bandStatusOverline}
        title={s.bandFeedDownTitle}
        body={s.bandFeedDownBody}
        linkLabel={s.bandViewOfficial}
        badge={badge}
        onPress={onPress}
      />
    );
  }

  return (
    <StatusBand
      tone="calm"
      overline={s.bandStatusOverline}
      title={s.bandCalmTitle}
      body={s.bandCalmBody}
      linkLabel={s.bandViewOfficial}
      badge={badge}
      onPress={onPress}
    />
  );
}
