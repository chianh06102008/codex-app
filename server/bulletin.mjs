// Official bulletin + rain context server (Dev 2, PRD §13 and §14).
//
//   node server/bulletin.mjs                 start the HTTP server (port 8788)
//   node server/bulletin.mjs --parse <url>   fetch one NCHMF bulletin page and print the OfficialStatement
//   node server/bulletin.mjs --list [hours]  list bulletins NCHMF published in the last N hours (default 24)
//   node server/bulletin.mjs --rain <lat> <lon>
//
// Endpoints:
//   GET /                                                  -> browser preview: recent bulletins (dev only)
//   GET /?url=<nchmf bulletin page>                        -> browser preview of one bulletin (dev only)
//   GET /api/official/list?hours=24                        -> titles + publish times, per-category status
//   GET /api/official/recent?hours=24                      -> same bulletins read into OfficialStatement + validity
//   GET /api/official/statement?url=<nchmf bulletin page>  -> OfficialStatement (parse_status ok | partial | failed)
//   GET /api/rain?lat=<lat>&lon=<lon>                      -> rain context from Open-Meteo, labeled as a model
//
// Rules this file must keep:
// - Never invent a warning. A field we cannot read stays null.
// - A failed parse still returns source_url and retrieved_at, with no summary (parse_status 'failed').
// - Rain is model context only. It may add penalty and never sets the official floor.
import http from 'node:http';
import { pathToFileURL } from 'node:url';

const FETCH_TIMEOUT_MS = 10_000;
const ALLOWED_BULLETIN_HOSTS = new Set(['www.nchmf.gov.vn', 'nchmf.gov.vn']);
const VN_OFFSET = '+07:00';

// ---------- small text helpers ----------

const ENTITIES = { '&nbsp;': ' ', '&amp;': '&', '&lt;': '<', '&gt;': '>', '&quot;': '"', '&#39;': "'" };

function decodeEntities(text) {
  return text
    .replace(/&(nbsp|amp|lt|gt|quot|#39);/g, (m) => ENTITIES[m])
    .replace(/&#(\d+);/g, (_m, code) => String.fromCodePoint(Number(code)));
}

// HTML fragment -> plain text, one line per <br>/<p>/<li>, without emoji decorations.
// NFC: NCHMF pages mix Unicode forms for Vietnamese diacritics; without this,
// "Dự báo" from the page would not equal "Dự báo" typed in code, and name matching breaks.
function htmlToLines(html) {
  const text = decodeEntities(
    html
      .replace(/<(br|\/p|\/li|\/div)\s*\/?>/gi, '\n')
      .replace(/<[^>]+>/g, '')
  ).normalize('NFC');
  return text
    .split('\n')
    .map((line) => line.replace(/[\p{Extended_Pictographic}️]/gu, '').replace(/\s+/g, ' ').trim())
    .filter(Boolean);
}

const pad = (n) => String(n).padStart(2, '0');
const isoVn = (y, mo, d, h, mi) => `${y}-${pad(mo)}-${pad(d)}T${pad(h)}:${pad(mi)}:00${VN_OFFSET}`;

// Add hours to a +07:00 time and keep the answer in +07:00, e.g. 23:20 + 6 h -> next day 05:20.
function addHoursVn(isoTime, hours) {
  const shifted = new Date(new Date(isoTime).getTime() + hours * 3_600_000 + 7 * 3_600_000); // as UTC fields
  return isoVn(
    shifted.getUTCFullYear(),
    shifted.getUTCMonth() + 1,
    shifted.getUTCDate(),
    shifted.getUTCHours(),
    shifted.getUTCMinutes()
  );
}

// ---------- parsing ----------

// Map the published title to the schema's hazard_type. The first match wins.
const HAZARD_RULES = [
  [/LŨ QUÉT/i, 'flash_flood'],
  [/SẠT LỞ/i, 'landslide'],
  [/BÃO|ÁP THẤP/i, 'storm'],
  [/LŨ|NGẬP LỤT/i, 'flood'],
  [/MƯA LỚN|MƯA TO/i, 'heavy_rain'],
];

// Phrases that mean "do not go out / evacuate".
const DO_NOT_TRAVEL = /không ra khỏi nhà|hạn chế ra khỏi nhà|không đi lại|sơ tán|di dời/i;

/**
 * Parse an NCHMF bulletin page into an OfficialStatement.
 * Pure function: no network, so it can be tested with a saved page.
 */
export function parseBulletinHtml({ html, sourceUrl, retrievedAt, publishedAt = null }) {
  const base = {
    id: idFromUrl(sourceUrl),
    source_url: sourceUrl,
    retrieved_at: retrievedAt,
    issuer: null,
    hazard_type: null,
    area_names: [],
    geometry: null,
    valid_from: null,
    valid_until: null,
    instruction_text: null,
    instruction_text_vi: null,
    instruction_text_en: null,
    severity: null,
    do_not_travel: false,
    pinned_by: null,
    parse_status: 'failed',
  };

  const titleMatch = html.match(/<h2[^>]*class="[^"]*tt-content-news[^"]*"[^>]*>([\s\S]*?)<\/h2>/i);
  const bodyHtml = bulletinBodyHtml(html);
  if (!titleMatch || !bodyHtml) return base; // failed: keep only the link and time

  const title = htmlToLines(titleMatch[1]).join(' ');
  const lines = htmlToLines(bodyHtml);
  if (lines.length === 0) return base;

  // Issuer: the site's own <title>, as published.
  const pageTitle = html.match(/<title>([\s\S]*?)<\/title>/i);
  const issuer = pageTitle ? htmlToLines(pageTitle[1]).join(' ') || null : null;

  // Issue time, in order of trust:
  // 1. the bulletin's own words, e.g. "Tin phát lúc 09h00' ngày 13/11/2026" (river-flood bulletins);
  // 2. `publishedAt` = the time NCHMF prints next to the bulletin in its category list;
  // 3. the attached PDF's name ..._YYYYMMDD_HHMM.pdf.
  const body = lines.join('\n');
  const stated = body.match(/Tin phát lúc\s*(\d{1,2})h(\d{2})['’]?\s*ngày\s*(\d{1,2})\/(\d{1,2})\/(\d{4})/i);
  const pdf = html.match(/href="([^"]+_(\d{4})(\d{2})(\d{2})_(\d{2})(\d{2})\.pdf)"/i);
  const validFrom = stated
    ? isoVn(+stated[5], +stated[4], +stated[3], +stated[1], +stated[2])
    : publishedAt ?? (pdf ? isoVn(+pdf[2], +pdf[3], +pdf[4], +pdf[5], +pdf[6]) : null);

  // Validity: "Trong 6 giờ tới" -> valid_from + 6 h. No other end time is published on the page.
  const hours = body.match(/Trong\s+0?(\d{1,2})\s+giờ\s+tới/i);
  const validUntil =
    validFrom && hours ? addHoursVn(validFrom, Number(hours[1])) : null;

  // Areas. NCHMF uses two list shapes, always as "- " lines right after a line ending in ":":
  //   "- TP. Đà Nẵng: A, B, C."           -> "TP. Đà Nẵng: A", "TP. Đà Nẵng: B", ...  (communes)
  //   "- TP. Huế, TP. Đà Nẵng, Gia Lai"   -> "TP. Huế", "TP. Đà Nẵng", "Gia Lai"      (provinces)
  // Bulletins that only name places in running text (river floods) get no list -> parse_status partial.
  const areaNames = [];
  let inList = false;
  for (const line of lines) {
    if (!line.startsWith('-')) {
      inList = line.endsWith(':');
      continue;
    }
    if (!inList) continue;
    const withParent = line.match(/^-\s*([^:]+):\s*(.+)$/);
    const parent = withParent ? withParent[1].trim() + ': ' : '';
    const names = (withParent ? withParent[2] : line.replace(/^-\s*/, '')).split(/[,;]/);
    for (const name of names) {
      const clean = name.replace(/\.$/, '').trim();
      if (clean) areaNames.push(parent + clean);
    }
  }

  // Risk level as published, e.g. "Cấp 1". Case-sensitive on purpose: with /i, everyday
  // words like "cung cấp 3 ..." would be misread as a risk level.
  const severity = body.match(/(?<![\p{L}])Cấp (\d)\b/u);
  const hazard = HAZARD_RULES.find(([pattern]) => pattern.test(title));

  const statement = {
    ...base,
    issuer,
    hazard_type: hazard ? hazard[1] : 'other',
    area_names: areaNames,
    valid_from: validFrom,
    valid_until: validUntil,
    instruction_text: `${title}\n${body}`,
    severity: severity ? `Cấp ${severity[1]}` : null,
    do_not_travel: DO_NOT_TRAVEL.test(body),
  };
  // ok only when the fields a rider needs are all present; otherwise partial.
  statement.parse_status = issuer && validFrom && validUntil && areaNames.length > 0 ? 'ok' : 'partial';
  return statement;
}

// The bulletin text: everything inside .text-content-news before the signature/download block.
function bulletinBodyHtml(html) {
  const start = html.indexOf('<div class="text-content-news">');
  if (start === -1) return null;
  const rest = html.slice(start);
  const ends = ['<p style="text-align: right">', 'Chi tiết tin', '<iframe']
    .map((marker) => rest.indexOf(marker))
    .filter((i) => i > 0);
  return ends.length ? rest.slice(0, Math.min(...ends)) : null;
}

// ---------- bulletin lists (which bulletins exist right now) ----------

// NCHMF category pages that carry warnings. `hazard` is only a hint for the list;
// each bulletin's own title decides its hazard_type when it is parsed.
export const BULLETIN_CATEGORIES = [
  { key: 'flash_flood', hazard: 'flash_flood', url: 'https://www.nchmf.gov.vn/kttv/vi-VN/1/lu-quet-17-18.html' },
  { key: 'flood', hazard: 'flood', url: 'https://www.nchmf.gov.vn/kttv/vi-VN/1/lu-ngap-lut-16-18.html' },
  { key: 'landslide', hazard: 'landslide', url: 'https://www.nchmf.gov.vn/kttv/vi-VN/1/sat-lo-sut-lun-dat-da-18-18.html' },
  { key: 'heavy_rain', hazard: 'heavy_rain', url: 'https://www.nchmf.gov.vn/kttv/vi-VN/1/mua-lon-mua-lon-dien-rong-2053-15.html' },
  { key: 'storm', hazard: 'storm', url: 'https://www.nchmf.gov.vn/kttv/vi-VN/1/bao-ap-thap-nhiet-doi-2049-15.html' },
];

// One list entry: <a href="…postNNN.html">TITLE<span …> ( dd/mm/yyyy hh:mm ) </span></a>
const LIST_ITEM =
  /<a href="(https:\/\/www\.nchmf\.gov\.vn\/[^"]*?post(\d+)\.html)">([^<]+)<span[^>]*>\s*\(\s*(\d{2})\/(\d{2})\/(\d{4})\s+(\d{2}):(\d{2})\s*\)\s*<\/span>/g;

/**
 * Parse one NCHMF category page into [{ id, source_url, title, published_at, categories }],
 * newest first. Pure function. Only reads the main list, not the sidebar.
 */
export function parseBulletinList(html, categoryKey) {
  const start = html.indexOf('class="grp-list-item"');
  if (start === -1) return [];
  const end = html.indexOf('id="pagenav"', start);
  const section = html.slice(start, end === -1 ? undefined : end);

  const items = [];
  const seen = new Set();
  for (const m of section.matchAll(LIST_ITEM)) {
    const id = `nchmf-post${m[2]}`;
    if (seen.has(id)) continue;
    seen.add(id);
    items.push({
      id,
      source_url: m[1],
      title: htmlToLines(m[3]).join(' '),
      published_at: isoVn(+m[6], +m[5], +m[4], +m[7], +m[8]),
      categories: [categoryKey],
    });
  }
  return items;
}

/** Merge lists from several categories: one entry per bulletin, newest first. */
export function mergeBulletinLists(lists) {
  const byId = new Map();
  for (const item of lists.flat()) {
    const existing = byId.get(item.id);
    if (existing) existing.categories = [...new Set([...existing.categories, ...item.categories])];
    else byId.set(item.id, { ...item, categories: [...item.categories] });
  }
  return [...byId.values()].sort((a, b) => new Date(b.published_at) - new Date(a.published_at));
}

const listCache = new Map(); // category url -> { items, fetchedAt }

async function fetchCategory(category, now) {
  const cached = listCache.get(category.url);
  if (cached && now - cached.fetchedAt < CACHE_TTL_MS) return { key: category.key, status: 'ok', items: cached.items };
  try {
    const response = await fetch(category.url, {
      headers: { 'User-Agent': 'FloodScout/0.1 (bulletin reader)' },
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    });
    if (!response.ok) throw new Error('HTTP ' + response.status);
    const items = parseBulletinList(await response.text(), category.key);
    // A list page that suddenly has no items is more likely a layout change than "no warnings ever".
    if (items.length === 0) throw new Error('no items found (layout changed?)');
    listCache.set(category.url, { items, fetchedAt: now });
    return { key: category.key, status: 'ok', items };
  } catch (error) {
    console.error(`List ${category.key} failed:`, error.message);
    // Last good list if we have one; the caller still sees status 'last_known'.
    if (cached) return { key: category.key, status: 'last_known', items: cached.items };
    return { key: category.key, status: 'failed', items: [] };
  }
}

/**
 * Bulletins published in the last `hours` hours across all warning categories.
 * Every category reports its own status, so one failed page is never hidden (P10).
 */
export async function listRecentBulletins({ hours = 24, now = Date.now() } = {}) {
  const results = await Promise.all(BULLETIN_CATEGORIES.map((c) => fetchCategory(c, now)));
  const since = now - hours * 3_600_000;
  const items = mergeBulletinLists(results.map((r) => r.items)).filter(
    (item) => new Date(item.published_at).getTime() >= since
  );
  return {
    retrieved_at: new Date(now).toISOString(),
    hours,
    categories: results.map(({ key, status, items: list }) => ({ key, status, count: list.length })),
    complete: results.every((r) => r.status === 'ok'),
    items,
  };
}

/**
 * Recent bulletins, each fetched and parsed into an OfficialStatement.
 * At most `limit` pages are fetched, newest first, to stay polite to NCHMF.
 */
export async function getRecentStatements({ hours = 24, limit = 15, now = Date.now() } = {}) {
  const list = await listRecentBulletins({ hours, now });
  const picked = list.items.slice(0, limit);
  const statements = [];
  for (const item of picked) {
    // One at a time on purpose: a burst of parallel requests to a government site is rude.
    const { statement, freshness } = await getBulletin(item.source_url, now, item.published_at);
    statements.push({ ...statement, freshness, validity: validityAt(statement, new Date(now)) });
  }
  return {
    retrieved_at: list.retrieved_at,
    hours,
    categories: list.categories,
    complete: list.complete && list.items.length <= limit,
    truncated: list.items.length > limit,
    statements,
  };
}

function idFromUrl(url) {
  const post = String(url).match(/post(\d+)/);
  return post ? `nchmf-post${post[1]}` : `nchmf-${Buffer.from(String(url)).toString('base64url').slice(0, 24)}`;
}

// ---------- network ----------

export function isAllowedBulletinUrl(raw) {
  try {
    const url = new URL(raw);
    return url.protocol === 'https:' && ALLOWED_BULLETIN_HOSTS.has(url.hostname);
  } catch {
    return false;
  }
}

/** Fetch and parse one bulletin. Network failure -> parse_status 'failed' with the link kept. */
export async function fetchBulletin(sourceUrl, publishedAt = null) {
  const retrievedAt = new Date().toISOString();
  try {
    const response = await fetch(sourceUrl, {
      headers: { 'User-Agent': 'FloodScout/0.1 (bulletin reader)' },
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    });
    if (!response.ok) throw new Error('HTTP ' + response.status);
    return parseBulletinHtml({ html: await response.text(), sourceUrl, retrievedAt, publishedAt });
  } catch (error) {
    console.error('Bulletin fetch failed:', error.message);
    return parseBulletinHtml({ html: '', sourceUrl, retrievedAt });
  }
}

// Small in-memory cache so we don't hit NCHMF on every request, and so a
// temporary outage can still return the last good parse (with its OLD retrieved_at,
// so the app can label it "last known" instead of pretending it is fresh).
const CACHE_TTL_MS = 5 * 60_000;
const bulletinCache = new Map(); // url -> { statement, fetchedAt }

/** Returns { statement, freshness: 'fresh' | 'cached' | 'last_known' | 'failed' }. */
export async function getBulletin(sourceUrl, now = Date.now(), publishedAt = null) {
  const cached = bulletinCache.get(sourceUrl);
  if (cached && now - cached.fetchedAt < CACHE_TTL_MS) return { statement: cached.statement, freshness: 'cached' };

  const statement = await fetchBulletin(sourceUrl, publishedAt);
  if (statement.parse_status !== 'failed') {
    bulletinCache.set(sourceUrl, { statement, fetchedAt: now });
    return { statement, freshness: 'fresh' };
  }
  if (cached) return { statement: cached.statement, freshness: 'last_known' };
  return { statement, freshness: 'failed' };
}

/**
 * Is a statement in force at `now`? Returns 'in_force' | 'expired' | 'unknown'.
 * Without a valid_until we cannot say it has ended, so we answer 'unknown', never 'expired'.
 */
export function validityAt(statement, now = new Date()) {
  const from = statement.valid_from ? new Date(statement.valid_from) : null;
  const until = statement.valid_until ? new Date(statement.valid_until) : null;
  if (until && now > until) return 'expired';
  if (from && until && now >= from) return 'in_force';
  return 'unknown';
}

/** Rain context for the next hours from Open-Meteo. Labeled as a model; never a floor. */
export async function fetchRain(lat, lon, hours = 3) {
  if (!Number.isFinite(lat) || !Number.isFinite(lon) || Math.abs(lat) > 90 || Math.abs(lon) > 180) {
    throw new RangeError('lat and lon are required numbers');
  }
  const params = new URLSearchParams({
    latitude: String(lat),
    longitude: String(lon),
    hourly: 'precipitation,precipitation_probability',
    forecast_hours: String(hours),
    timezone: 'Asia/Bangkok',
  });
  const response = await fetch('https://api.open-meteo.com/v1/forecast?' + params, {
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
  });
  if (!response.ok) throw new Error('Open-Meteo HTTP ' + response.status);
  const data = await response.json();
  const precipitation = data.hourly?.precipitation ?? [];
  return {
    kind: 'model', // UI must say this is a model forecast, not an observation or a warning
    source: 'Open-Meteo',
    source_url: 'https://open-meteo.com/',
    attribution: 'Weather data by Open-Meteo.com (CC BY 4.0)', // must be shown wherever rain is shown
    may_set_floor: false,
    retrieved_at: new Date().toISOString(),
    hours,
    precipitation_mm_total: Math.round(precipitation.reduce((sum, mm) => sum + (mm ?? 0), 0) * 10) / 10,
    hourly: (data.hourly?.time ?? []).map((time, i) => ({
      time: time + VN_OFFSET,
      precipitation_mm: precipitation[i] ?? null,
      precipitation_probability: data.hourly?.precipitation_probability?.[i] ?? null,
    })),
  };
}

// ---------- HTTP server ----------

// The data is public, read-only, GET only, so any origin may read it (lets a browser page call it).
const CORS = { 'Access-Control-Allow-Origin': '*' };

function send(res, status, body, headers = {}) {
  res
    .writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', ...CORS, ...headers })
    .end(JSON.stringify(body));
}

const DEFAULT_POINT = { lat: 16.061, lon: 108.218 }; // Da Nang, same center as App.tsx

export function createServer() {
  return http.createServer(async (req, res) => {
    const url = new URL(req.url || '/', 'http://localhost');
    if (req.method !== 'GET') return send(res, 405, { error: 'Method not allowed' });

    if (url.pathname === '/api/official/statement') {
      const source = url.searchParams.get('url') || '';
      if (!isAllowedBulletinUrl(source)) return send(res, 400, { error: 'url must be an https nchmf.gov.vn page' });
      const { statement, freshness } = await getBulletin(source);
      // 200 even when parse failed: the app still needs the link and must show "unavailable".
      return send(res, 200, statement, { 'X-Bulletin-Freshness': freshness });
    }

    if (url.pathname === '/api/official/list' || url.pathname === '/api/official/recent') {
      const hours = Number(url.searchParams.get('hours') || 24);
      if (!Number.isInteger(hours) || hours < 1 || hours > 168) return send(res, 400, { error: 'hours must be 1–168' });
      const body =
        url.pathname === '/api/official/list'
          ? await listRecentBulletins({ hours }) // titles + times only, fast
          : await getRecentStatements({ hours }); // each bulletin read into an OfficialStatement
      return send(res, 200, body);
    }

    if (url.pathname === '/api/rain') {
      try {
        const rain = await fetchRain(Number(url.searchParams.get('lat')), Number(url.searchParams.get('lon')));
        return send(res, 200, rain);
      } catch (error) {
        if (error instanceof RangeError) return send(res, 400, { error: error.message });
        console.error('Rain fetch failed:', error.message);
        return send(res, 503, { error: 'Rain context unavailable' });
      }
    }

    // Developer preview: a plain web page that shows what the parser read, for reviewing in a browser.
    if (url.pathname === '/') {
      const source = url.searchParams.get('url');
      let html;
      if (!source) html = await renderListPreview(Number(url.searchParams.get('hours') || 48));
      else if (isAllowedBulletinUrl(source)) html = await renderPreview(source);
      else html = renderPage('<p class="bad">Link phải là trang https://www.nchmf.gov.vn/…</p>', source);
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' }).end(html);
      return;
    }

    return send(res, 404, { error: 'Not found' });
  });
}

// ---------- developer preview page (not the app UI; copy follows PRD §18) ----------

// Everything from the bulletin is untrusted text, so it is always escaped before going into HTML.
const escapeHtml = (value) =>
  String(value ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

const fmtVn = (iso) =>
  iso ? new Date(iso).toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh', hour12: false }) : 'không ghi';

const VALIDITY_LABEL = {
  in_force: ['Đang có hiệu lực. Ảnh người dân không thể hạ mức này.', 'bad'],
  expired: ['Đã hết hiệu lực theo thời hạn ghi trong bản tin.', 'muted'],
  unknown: ['Không rõ thời hạn. Coi như vẫn có thể còn hiệu lực.', 'bad'],
};

async function renderPreview(source) {
  const [{ statement: s, freshness }, rain] = await Promise.all([
    getBulletin(source),
    fetchRain(DEFAULT_POINT.lat, DEFAULT_POINT.lon).catch(() => null),
  ]);

  let body;
  if (s.parse_status === 'failed') {
    // §18 "feed down" copy. Only the link, no invented summary.
    body = `<p class="band bad">Không lấy được tình trạng chính thức. Đừng coi map trống là hết cảnh báo.</p>
      <p><a href="${escapeHtml(s.source_url)}">Mở bản tin gốc</a></p>`;
  } else {
    const [label, tone] = VALIDITY_LABEL[validityAt(s)];
    body = `
      <p class="band ${tone}">${escapeHtml(label)}</p>
      <p><a href="${escapeHtml(s.source_url)}">Mở bản tin gốc trên nchmf.gov.vn</a></p>
      <dl>
        <dt>Cơ quan</dt><dd>${escapeHtml(s.issuer ?? 'không ghi')}</dd>
        <dt>Phát hành / hiệu lực từ</dt><dd>${escapeHtml(fmtVn(s.valid_from))}</dd>
        <dt>Hiệu lực đến</dt><dd>${escapeHtml(fmtVn(s.valid_until))}</dd>
        <dt>Lấy tin lúc</dt><dd>${escapeHtml(fmtVn(s.retrieved_at))} (${escapeHtml(freshness)})</dd>
        <dt>Cấp độ rủi ro</dt><dd>${escapeHtml(s.severity ?? 'không có trên trang web, xem PDF')}</dd>
        <dt>Loại</dt><dd>${escapeHtml(s.hazard_type)}</dd>
        <dt>Kết quả đọc</dt><dd>${escapeHtml(s.parse_status)}</dd>
      </dl>
      <h2>Nguyên văn</h2>
      <pre>${escapeHtml(s.instruction_text)}</pre>
      <h2>Khu vực (${s.area_names.length})</h2>
      <ul>${s.area_names.map((n) => `<li>${escapeHtml(n)}</li>`).join('')}</ul>`;
  }

  const rainHtml = rain
    ? `<p>${escapeHtml(rain.precipitation_mm_total)} mm trong ${rain.hours} giờ tới tại trung tâm Đà Nẵng.</p>
       <p class="muted">Dự báo mô hình, không phải cảnh báo chính thức và không hạ mức cảnh báo. ${escapeHtml(rain.attribution)}</p>`
    : '<p class="muted">Không lấy được dữ liệu mưa.</p>';

  return renderPage(`${body}<h2>Mưa (mô hình)</h2>${rainHtml}`, source);
}

const CATEGORY_LABEL = {
  flash_flood: 'Lũ quét',
  flood: 'Lũ, ngập lụt',
  landslide: 'Sạt lở, sụt lún',
  heavy_rain: 'Mưa lớn',
  storm: 'Bão, áp thấp',
};

async function renderListPreview(rawHours) {
  const hours = Number.isInteger(rawHours) && rawHours >= 1 && rawHours <= 168 ? rawHours : 48;
  const list = await listRecentBulletins({ hours });

  // Any category we could not read is said out loud, never silently dropped (P10).
  const broken = list.categories.filter((c) => c.status !== 'ok');
  const bandHtml = broken.length
    ? `<p class="band bad">Không lấy được tình trạng chính thức của: ${broken
        .map((c) => escapeHtml(CATEGORY_LABEL[c.key]) + ' (' + escapeHtml(c.status) + ')')
        .join(', ')}. Đừng coi map trống là hết cảnh báo.</p>`
    : '';

  const rows = list.items
    .map((item) => {
      const detail = '/?url=' + encodeURIComponent(item.source_url);
      const tags = item.categories.map((k) => escapeHtml(CATEGORY_LABEL[k])).join(', ');
      return `<li><a href="${escapeHtml(detail)}">${escapeHtml(item.title)}</a>
        <div class="muted">${escapeHtml(fmtVn(item.published_at))} · ${tags}</div></li>`;
    })
    .join('');

  const empty = list.complete
    ? `<p>NCHMF chưa đăng bản tin nào trong ${hours} giờ qua ở các mục này. Danh sách chỉ gồm các mục bên dưới, không phải mọi cảnh báo.</p>`
    : '';

  const summary = list.categories
    .map((c) => `${escapeHtml(CATEGORY_LABEL[c.key])}: ${escapeHtml(c.status)}`)
    .join(' · ');

  return renderPage(
    `${bandHtml}
     <p>Bản tin NCHMF trong <b>${hours} giờ</b> qua (${list.items.length}). Xem
       <a href="/?hours=24">24 giờ</a> · <a href="/?hours=48">48 giờ</a> · <a href="/?hours=168">7 ngày</a>.</p>
     <ul class="list">${rows}</ul>${list.items.length ? '' : empty}
     <p class="muted">Lấy lúc ${escapeHtml(fmtVn(list.retrieved_at))}. ${summary}</p>`,
    ''
  );
}

function renderPage(content, source) {
  return `<!doctype html><html lang="vi"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Official status preview</title>
<style>
  body{font:16px/1.5 system-ui,sans-serif;max-width:640px;margin:0 auto;padding:16px;color:#152b36;background:#f7f9f8}
  .band{padding:12px;border-radius:8px;font-weight:700}
  .bad{background:#ffedce}.muted{color:#5b6b72}
  pre{white-space:pre-wrap;background:#fff;padding:12px;border-radius:8px}
  dt{font-weight:700;margin-top:6px} dd{margin:0}
  form{display:flex;gap:8px;margin-bottom:16px} input{flex:1;padding:8px;min-height:32px}
  .emergency{margin-top:24px;font-weight:700}
  .list{padding:0;list-style:none} .list li{background:#fff;border-radius:8px;padding:10px 12px;margin:8px 0}
</style></head><body>
<h1><a href="/" style="color:inherit;text-decoration:none">Official status · dev preview</a></h1>
<form><input name="url" value="${escapeHtml(source)}" aria-label="Link bản tin NCHMF"><button>Đọc</button></form>
${content}
<p class="emergency">113 · 114 · 115. FloodScout không phải đơn vị cứu hộ.</p>
</body></html>`;
}

// ---------- entry point (only when run directly, not when imported by tests) ----------

if (import.meta.url === pathToFileURL(process.argv[1] || '').href) {
  const [flag, a, b] = process.argv.slice(2);
  if (flag === '--parse') {
    if (!isAllowedBulletinUrl(a)) {
      console.error('Usage: node server/bulletin.mjs --parse <https://www.nchmf.gov.vn/...>');
      process.exit(1);
    }
    console.log(JSON.stringify(await fetchBulletin(a), null, 2));
  } else if (flag === '--list') {
    console.log(JSON.stringify(await listRecentBulletins({ hours: Number(a) || 24 }), null, 2));
  } else if (flag === '--rain') {
    try {
      console.log(JSON.stringify(await fetchRain(Number(a), Number(b)), null, 2));
    } catch (error) {
      console.error(error.message + '\nUsage: node server/bulletin.mjs --rain <lat> <lon>');
      process.exit(1);
    }
  } else {
    const port = Number(process.env.BULLETIN_PORT || 8788);
    const host = process.env.BULLETIN_SERVER_HOST || '127.0.0.1';
    createServer().listen(port, host, () => console.log(`Bulletin server listening on http://${host}:${port}`));
  }
}
