// NCHMF bulletins read directly by the phone (no laptop server), ported from Dev 2's
// server/bulletin.mjs parser. Same rules: a page that cannot be read keeps only its link
// and counts as "failed"; one failed category makes the feed incomplete (P10).
import type { OfficialStatement } from '@/domain/types';
import { timeoutSignal } from '@/lib/timeout';

const VN = '+07:00';
const ENTITIES: Record<string, string> = { '&nbsp;': ' ', '&amp;': '&', '&lt;': '<', '&gt;': '>', '&quot;': '"', '&#39;': "'" };

function decodeEntities(t: string) {
  return t.replace(/&(nbsp|amp|lt|gt|quot|#39);/g, (m) => ENTITIES[m]).replace(/&#(\d+);/g, (_m, c) => String.fromCodePoint(Number(c)));
}
// Emoji ranges stripped explicitly (Hermes-safe; no \p{Extended_Pictographic}).
const EMOJI = /[☀-➿️]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|\uD83E[\uDC00-\uDFFF]/g;
function htmlToLines(html: string): string[] {
  const text = decodeEntities(html.replace(/<(br|\/p|\/li|\/div)\s*\/?>/gi, '\n').replace(/<[^>]+>/g, '')).normalize('NFC');
  return text.split('\n').map((l) => l.replace(EMOJI, '').replace(/\s+/g, ' ').trim()).filter(Boolean);
}
const pad = (n: number) => String(n).padStart(2, '0');
const isoVn = (y: number, mo: number, d: number, h: number, mi: number) => `${y}-${pad(mo)}-${pad(d)}T${pad(h)}:${pad(mi)}:00${VN}`;
function addHoursVn(iso: string, hours: number) {
  const s = new Date(new Date(iso).getTime() + hours * 3_600_000 + 7 * 3_600_000);
  return isoVn(s.getUTCFullYear(), s.getUTCMonth() + 1, s.getUTCDate(), s.getUTCHours(), s.getUTCMinutes());
}

const HAZARD_RULES: [RegExp, OfficialStatement['hazard_type']][] = [
  [/LŨ QUÉT/i, 'flash_flood'],
  [/SẠT LỞ/i, 'landslide'],
  [/BÃO|ÁP THẤP/i, 'storm' as OfficialStatement['hazard_type']],
  [/LŨ|NGẬP LỤT/i, 'flood'],
  [/MƯA LỚN|MƯA TO/i, 'heavy_rain'],
];
const DO_NOT_TRAVEL = /không ra khỏi nhà|hạn chế ra khỏi nhà|không đi lại|sơ tán|di dời/i;

function bodyHtml(html: string): string | null {
  const start = html.indexOf('<div class="text-content-news">');
  if (start === -1) return null;
  const rest = html.slice(start);
  const ends = ['<p style="text-align: right">', 'Chi tiết tin', '<iframe'].map((m) => rest.indexOf(m)).filter((i) => i > 0);
  return ends.length ? rest.slice(0, Math.min(...ends)) : null;
}

export function parseBulletinHtml(html: string, sourceUrl: string, retrievedAt: string, publishedAt: string | null) {
  const post = sourceUrl.match(/post(\d+)/);
  const base = {
    id: post ? `nchmf-post${post[1]}` : `nchmf-${sourceUrl.length}`,
    source_url: sourceUrl,
    retrieved_at: retrievedAt,
    issuer: null as string | null,
    hazard_type: null as OfficialStatement['hazard_type'] | null,
    area_names: [] as string[],
    geometry: null,
    valid_from: null as string | null,
    valid_until: null as string | null,
    instruction_text: null as string | null,
    severity: null as string | null,
    do_not_travel: false,
    pinned_by: null,
    parse_status: 'failed' as 'failed' | 'partial' | 'ok',
  };
  const titleMatch = html.match(/<h2[^>]*class="[^"]*tt-content-news[^"]*"[^>]*>([\s\S]*?)<\/h2>/i);
  const b = bodyHtml(html);
  if (!titleMatch || !b) return base;
  const title = htmlToLines(titleMatch[1]).join(' ');
  const lines = htmlToLines(b);
  if (!lines.length) return base;
  const pageTitle = html.match(/<title>([\s\S]*?)<\/title>/i);
  const issuer = pageTitle ? htmlToLines(pageTitle[1]).join(' ') || null : null;
  const body = lines.join('\n');
  const stated = body.match(/Tin phát lúc\s*(\d{1,2})h(\d{2})['’]?\s*ngày\s*(\d{1,2})\/(\d{1,2})\/(\d{4})/i);
  const pdf = html.match(/href="([^"]+_(\d{4})(\d{2})(\d{2})_(\d{2})(\d{2})\.pdf)"/i);
  const validFrom = stated
    ? isoVn(+stated[5], +stated[4], +stated[3], +stated[1], +stated[2])
    : publishedAt ?? (pdf ? isoVn(+pdf[2], +pdf[3], +pdf[4], +pdf[5], +pdf[6]) : null);
  const hours = body.match(/Trong\s+0?(\d{1,2})\s+giờ\s+tới/i);
  const validUntil = validFrom && hours ? addHoursVn(validFrom, Number(hours[1])) : null;

  const areaNames: string[] = [];
  let inList = false;
  for (const line of lines) {
    if (!line.startsWith('-')) {
      inList = line.endsWith(':');
      continue;
    }
    if (!inList) continue;
    const wp = line.match(/^-\s*([^:]+):\s*(.+)$/);
    const parent = wp ? wp[1].trim() + ': ' : '';
    for (const name of (wp ? wp[2] : line.replace(/^-\s*/, '')).split(/[,;]/)) {
      const clean = name.replace(/\.$/, '').trim();
      if (clean) areaNames.push(parent + clean);
    }
  }
  const sev = body.match(/(?:^|[^A-Za-zÀ-ỹ])Cấp (\d)\b/);
  const hazard = HAZARD_RULES.find(([re]) => re.test(title));
  const st = {
    ...base,
    issuer,
    hazard_type: hazard ? hazard[1] : ('other' as OfficialStatement['hazard_type']),
    area_names: areaNames,
    valid_from: validFrom,
    valid_until: validUntil,
    instruction_text: `${title}\n${body}`,
    severity: sev ? `Cấp ${sev[1]}` : null,
    do_not_travel: DO_NOT_TRAVEL.test(body),
  };
  st.parse_status = issuer && validFrom && validUntil && areaNames.length > 0 ? 'ok' : 'partial';
  return st;
}

const CATEGORIES = [
  'https://www.nchmf.gov.vn/kttv/vi-VN/1/lu-quet-17-18.html',
  'https://www.nchmf.gov.vn/kttv/vi-VN/1/lu-ngap-lut-16-18.html',
  'https://www.nchmf.gov.vn/kttv/vi-VN/1/sat-lo-sut-lun-dat-da-18-18.html',
  'https://www.nchmf.gov.vn/kttv/vi-VN/1/mua-lon-mua-lon-dien-rong-2053-15.html',
  'https://www.nchmf.gov.vn/kttv/vi-VN/1/bao-ap-thap-nhiet-doi-2049-15.html',
];
const LIST_ITEM =
  /<a href="(https:\/\/www\.nchmf\.gov\.vn\/[^"]*?post(\d+)\.html)">([^<]+)<span[^>]*>\s*\(\s*(\d{2})\/(\d{2})\/(\d{4})\s+(\d{2}):(\d{2})\s*\)\s*<\/span>/g;

function parseList(html: string) {
  const start = html.indexOf('class="grp-list-item"');
  if (start === -1) return [];
  const end = html.indexOf('id="pagenav"', start);
  const section = html.slice(start, end === -1 ? undefined : end);
  const out: { url: string; publishedAt: string }[] = [];
  let m: RegExpExecArray | null;
  LIST_ITEM.lastIndex = 0;
  while ((m = LIST_ITEM.exec(section))) out.push({ url: m[1], publishedAt: isoVn(+m[6], +m[5], +m[4], +m[7], +m[8]) });
  return out;
}

async function getText(url: string) {
  const res = await fetch(url, { signal: timeoutSignal(15000), headers: { Accept: 'text/html' } });
  if (!res.ok) throw new Error(String(res.status));
  return res.text();
}

/** Last `hours` hours of NCHMF warnings, read on the phone. */
export async function fetchNchmfDirect(hours = 24, limit = 12): Promise<{ statements: OfficialStatement[]; complete: boolean }> {
  const lists = await Promise.all(CATEGORIES.map((u) => getText(u).then(parseList).catch(() => null)));
  const complete = lists.every((l) => l !== null && l.length > 0);
  const since = Date.now() - hours * 3_600_000;
  const seen = new Set<string>();
  const items = lists
    .flatMap((l) => l ?? [])
    .filter((i) => Date.parse(i.publishedAt) >= since && !seen.has(i.url) && seen.add(i.url))
    .sort((a, b) => Date.parse(b.publishedAt) - Date.parse(a.publishedAt))
    .slice(0, limit);
  const statements: OfficialStatement[] = [];
  let allRead = true;
  for (const it of items) {
    const now = new Date().toISOString();
    try {
      statements.push(parseBulletinHtml(await getText(it.url), it.url, now, it.publishedAt) as unknown as OfficialStatement);
    } catch {
      allRead = false;
    }
  }
  if (lists.every((l) => l === null)) throw new Error('nchmf unreachable');
  return { statements, complete: complete && allRead };
}
