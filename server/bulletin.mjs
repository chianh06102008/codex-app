// Official bulletin + rain context server (Dev 2, PRD §13 and §14).
//
//   node server/bulletin.mjs                 start the HTTP server (port 8788)
//   node server/bulletin.mjs --parse <url>   fetch one NCHMF bulletin page and print the OfficialStatement
//   node server/bulletin.mjs --rain <lat> <lon>
//
// Endpoints:
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
export function parseBulletinHtml({ html, sourceUrl, retrievedAt }) {
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
  const bodyMatch = html.match(/<div class="text-content-news">[\s\S]*?<\/div>\s*(<p>[\s\S]*?<\/p>)/i);
  if (!titleMatch || !bodyMatch) return base; // failed: keep only the link and time

  const title = htmlToLines(titleMatch[1]).join(' ');
  const lines = htmlToLines(bodyMatch[1]);
  if (lines.length === 0) return base;

  // Issuer: the site's own <title>, as published.
  const pageTitle = html.match(/<title>([\s\S]*?)<\/title>/i);
  const issuer = pageTitle ? htmlToLines(pageTitle[1]).join(' ') || null : null;

  // Issue time: NCHMF names the attached PDF ..._YYYYMMDD_HHMM.pdf. The page itself prints no time.
  const pdf = html.match(/href="([^"]+_(\d{4})(\d{2})(\d{2})_(\d{2})(\d{2})\.pdf)"/i);
  const validFrom = pdf ? isoVn(+pdf[2], +pdf[3], +pdf[4], +pdf[5], +pdf[6]) : null;

  // Validity: "Trong 6 giờ tới" -> valid_from + 6 h. No other end time is published on the page.
  const body = lines.join('\n');
  const hours = body.match(/Trong\s+0?(\d{1,2})\s+giờ\s+tới/i);
  const validUntil =
    validFrom && hours ? addHoursVn(validFrom, Number(hours[1])) : null;

  // Areas: lines like "- TP. Đà Nẵng: A, B, C." -> "TP. Đà Nẵng: A", ... Every name is kept.
  const areaNames = [];
  for (const line of lines) {
    const area = line.match(/^-\s*([^:]+):\s*(.+)$/);
    if (!area) continue;
    for (const name of area[2].split(/[,;]/)) {
      const clean = name.replace(/\.$/, '').trim();
      if (clean) areaNames.push(`${area[1].trim()}: ${clean}`);
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
export async function fetchBulletin(sourceUrl) {
  const retrievedAt = new Date().toISOString();
  try {
    const response = await fetch(sourceUrl, {
      headers: { 'User-Agent': 'FloodScout/0.1 (bulletin reader)' },
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    });
    if (!response.ok) throw new Error('HTTP ' + response.status);
    return parseBulletinHtml({ html: await response.text(), sourceUrl, retrievedAt });
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
export async function getBulletin(sourceUrl, now = Date.now()) {
  const cached = bulletinCache.get(sourceUrl);
  if (cached && now - cached.fetchedAt < CACHE_TTL_MS) return { statement: cached.statement, freshness: 'cached' };

  const statement = await fetchBulletin(sourceUrl);
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

// The real bulletin pinned in fixtures/statements/, used as the viewer's default.
const DEFAULT_BULLETIN_URL =
  'https://www.nchmf.gov.vn/kttv/vi-VN/1/tin-canh-bao-lu-quet-sat-lo-dat-sut-lun-dat-do-mua-lu-hoac-dong-chay-tren-khu-vuc-cac-tinh-thanh-pho-da-nang-va-quang-ngai-post55215.html';
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
      const source = url.searchParams.get('url') || DEFAULT_BULLETIN_URL;
      const html = isAllowedBulletinUrl(source)
        ? await renderPreview(source)
        : renderPage('<p class="bad">Link phải là trang https://www.nchmf.gov.vn/…</p>', source);
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
</style></head><body>
<h1>Official status · dev preview</h1>
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
