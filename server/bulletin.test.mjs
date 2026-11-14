// Tests for server/bulletin.mjs. Run with: node --test server/
// Uses a saved copy of a real NCHMF page, so no network is needed.
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';

import {
  fetchRain,
  isAllowedBulletinUrl,
  mergeBulletinLists,
  parseBulletinHtml,
  parseBulletinList,
  validityAt,
} from './bulletin.mjs';

const raw = (name) => readFile(new URL(`../fixtures/statements/raw/${name}`, import.meta.url), 'utf8');

const SOURCE_URL =
  'https://www.nchmf.gov.vn/kttv/vi-VN/1/tin-canh-bao-lu-quet-sat-lo-dat-sut-lun-dat-do-mua-lu-hoac-dong-chay-tren-khu-vuc-cac-tinh-thanh-pho-da-nang-va-quang-ngai-post55215.html';
const RETRIEVED_AT = '2026-11-14T14:01:00+07:00';
const html = await readFile(new URL('../fixtures/statements/raw/nchmf-post55215.html', import.meta.url), 'utf8');

test('parses the real LQSL_984 bulletin page', () => {
  const s = parseBulletinHtml({ html, sourceUrl: SOURCE_URL, retrievedAt: RETRIEVED_AT });
  assert.equal(s.parse_status, 'ok');
  assert.equal(s.id, 'nchmf-post55215');
  assert.equal(s.issuer, 'Trung tâm Dự báo KTTV quốc gia');
  assert.equal(s.hazard_type, 'flash_flood');
  assert.equal(s.valid_from, '2026-11-13T23:20:00+07:00');
  assert.equal(s.valid_until, '2026-11-14T05:20:00+07:00'); // "Trong 6 giờ tới"
  assert.equal(s.do_not_travel, false);
  assert.equal(s.geometry, null);
  assert.equal(s.severity, null); // the level is only in the PDF, so the page parse must not guess it
});

test('keeps every area name, in order', () => {
  const s = parseBulletinHtml({ html, sourceUrl: SOURCE_URL, retrievedAt: RETRIEVED_AT });
  assert.equal(s.area_names.length, 25);
  assert.equal(s.area_names[0], 'TP. Đà Nẵng: Hiệp Đức');
  assert.equal(s.area_names[9], 'TP. Đà Nẵng: Trà Vân');
  assert.equal(s.area_names[24], 'Quảng Ngãi: Trà Bồng');
});

test('instruction_text is the original text, not a summary', () => {
  const s = parseBulletinHtml({ html, sourceUrl: SOURCE_URL, retrievedAt: RETRIEVED_AT });
  assert.match(s.instruction_text, /Trong 6 giờ tới, có nguy cơ xảy ra lũ quét, sạt lở đất, sụt lún đất/);
  assert.equal(s.instruction_text_en, null); // no generated translation
});

test('a page we cannot read fails honestly: link and time kept, nothing invented', () => {
  const s = parseBulletinHtml({ html: '<html>maintenance</html>', sourceUrl: SOURCE_URL, retrievedAt: RETRIEVED_AT });
  assert.equal(s.parse_status, 'failed');
  assert.equal(s.source_url, SOURCE_URL);
  assert.equal(s.retrieved_at, RETRIEVED_AT);
  assert.equal(s.instruction_text, null);
  assert.equal(s.hazard_type, null);
  assert.deepEqual(s.area_names, []);
});

test('missing issue time gives partial, not ok', () => {
  const noPdf = html.replace(/_20261113_2320\.pdf/, '.pdf');
  const s = parseBulletinHtml({ html: noPdf, sourceUrl: SOURCE_URL, retrievedAt: RETRIEVED_AT });
  assert.equal(s.parse_status, 'partial');
  assert.equal(s.valid_from, null);
  assert.equal(s.valid_until, null);
});

test('detects do-not-travel wording', () => {
  const evac = html.replace('Chi tiết trong bản tin đính kèm', 'Người dân cần sơ tán khỏi khu vực nguy hiểm');
  const s = parseBulletinHtml({ html: evac, sourceUrl: SOURCE_URL, retrievedAt: RETRIEVED_AT });
  assert.equal(s.do_not_travel, true);
});

test('reads a published risk level, but not "cấp" inside ordinary words', () => {
  const withLevel = html.replace('Chi tiết trong bản tin đính kèm', 'Cảnh báo cấp độ rủi ro thiên tai: Cấp 2.');
  assert.equal(parseBulletinHtml({ html: withLevel, sourceUrl: SOURCE_URL, retrievedAt: RETRIEVED_AT }).severity, 'Cấp 2');

  const noise = html.replace('Chi tiết trong bản tin đính kèm', 'Trạm cung cấp 3 bản tin mỗi ngày');
  assert.equal(parseBulletinHtml({ html: noise, sourceUrl: SOURCE_URL, retrievedAt: RETRIEVED_AT }).severity, null);
});

test('validityAt: in force, expired, and unknown when the end time is missing', () => {
  const s = parseBulletinHtml({ html, sourceUrl: SOURCE_URL, retrievedAt: RETRIEVED_AT });
  assert.equal(validityAt(s, new Date('2026-11-14T01:00:00+07:00')), 'in_force');
  assert.equal(validityAt(s, new Date('2026-11-14T05:21:00+07:00')), 'expired');
  // Never call a warning ended just because we could not read its end time.
  assert.equal(validityAt({ ...s, valid_until: null }, new Date('2030-01-01T00:00:00Z')), 'unknown');
});

test('rain rejects bad coordinates before calling the network', async () => {
  await assert.rejects(fetchRain(Number('abc'), 108), RangeError);
  await assert.rejects(fetchRain(16, 999), RangeError);
});

test('list page: reads every bulletin with its printed publish time, newest first', async () => {
  const items = parseBulletinList(await raw('nchmf-list-lu-quet.html'), 'flash_flood');
  assert.equal(items.length, 10);
  assert.deepEqual(items[0], {
    id: 'nchmf-post55215',
    source_url: SOURCE_URL,
    title: 'TIN CẢNH BÁO LŨ QUÉT SẠT LỞ ĐẤT, SỤT LÚN ĐẤT DO MƯA LŨ HOẶC DÒNG CHẢY TRÊN KHU VỰC CÁC TỈNH/THÀNH PHỐ ĐÀ NẴNG VÀ QUẢNG NGÃI',
    published_at: '2026-11-13T23:20:00+07:00',
    categories: ['flash_flood'],
  });
  assert.equal(items[1].published_at, '2026-11-13T19:20:00+07:00');
});

test('list page with image thumbnails (heavy rain layout) gives one entry per bulletin', async () => {
  const items = parseBulletinList(await raw('nchmf-list-mua-lon.html'), 'heavy_rain');
  assert.equal(items.length, 3);
  assert.equal(new Set(items.map((i) => i.id)).size, 3);
  assert.equal(items[0].published_at, '2026-09-27T15:30:00+07:00');
});

test('a page without the list (maintenance, layout change) gives no items', () => {
  assert.deepEqual(parseBulletinList('<html>bảo trì</html>', 'flood'), []);
});

test('merging lists keeps one entry per bulletin and remembers every category', () => {
  const a = { id: 'nchmf-post1', source_url: 'x', title: 't', published_at: '2026-11-13T10:00:00+07:00', categories: ['flash_flood'] };
  const b = { ...a, categories: ['landslide'] };
  const c = { ...a, id: 'nchmf-post2', published_at: '2026-11-13T12:00:00+07:00', categories: ['flood'] };
  const merged = mergeBulletinLists([[a], [b, c]]);
  assert.equal(merged.length, 2);
  assert.equal(merged[0].id, 'nchmf-post2'); // newest first
  assert.deepEqual(merged[1].categories, ['flash_flood', 'landslide']);
});

test('the publish time from the list wins over the PDF file name', () => {
  const s = parseBulletinHtml({ html, sourceUrl: SOURCE_URL, retrievedAt: RETRIEVED_AT, publishedAt: '2026-11-13T23:25:00+07:00' });
  assert.equal(s.valid_from, '2026-11-13T23:25:00+07:00');
  assert.equal(s.valid_until, '2026-11-14T05:25:00+07:00');
});

test('province-only list ("- TP. Huế, TP. Đà Nẵng, …") keeps every province', async () => {
  const s = parseBulletinHtml({
    html: await raw('nchmf-post55196.html'),
    sourceUrl: 'https://www.nchmf.gov.vn/x-post55196.html',
    retrievedAt: RETRIEVED_AT,
  });
  assert.equal(s.parse_status, 'ok');
  assert.deepEqual(s.area_names, ['TP. Huế', 'TP. Đà Nẵng', 'Quảng Ngãi', 'Gia Lai', 'Đắk Lắk']);
});

test('river-flood bulletin: own stated time wins, level read, no invented area list', async () => {
  const s = parseBulletinHtml({
    html: await raw('nchmf-post55197.html'),
    sourceUrl: 'https://www.nchmf.gov.vn/x-post55197.html',
    retrievedAt: RETRIEVED_AT,
    publishedAt: '2026-11-13T08:57:00+07:00', // what the list page says
  });
  assert.equal(s.hazard_type, 'flood');
  assert.equal(s.valid_from, '2026-11-13T09:00:00+07:00'); // "Tin phát lúc 09h00' ngày 13/11/2026"
  assert.equal(s.valid_until, '2026-11-14T09:00:00+07:00'); // "Trong 24 giờ tới"
  assert.equal(s.severity, 'Cấp 1');
  assert.deepEqual(s.area_names, []);
  assert.equal(s.parse_status, 'partial'); // places only in running text: say so, don't guess
  assert.match(s.instruction_text, /Nguy cơ cao xảy ra ngập lụt tại vùng trũng thấp/);
});

test('only fetches https nchmf.gov.vn pages', () => {
  assert.equal(isAllowedBulletinUrl(SOURCE_URL), true);
  assert.equal(isAllowedBulletinUrl('http://www.nchmf.gov.vn/x'), false);
  assert.equal(isAllowedBulletinUrl('https://evil.example.com/nchmf.gov.vn'), false);
  assert.equal(isAllowedBulletinUrl('not a url'), false);
});
