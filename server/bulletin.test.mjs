// Tests for server/bulletin.mjs. Run with: node --test server/
// Uses a saved copy of a real NCHMF page, so no network is needed.
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';

import { isAllowedBulletinUrl, parseBulletinHtml } from './bulletin.mjs';

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

test('only fetches https nchmf.gov.vn pages', () => {
  assert.equal(isAllowedBulletinUrl(SOURCE_URL), true);
  assert.equal(isAllowedBulletinUrl('http://www.nchmf.gov.vn/x'), false);
  assert.equal(isAllowedBulletinUrl('https://evil.example.com/nchmf.gov.vn'), false);
  assert.equal(isAllowedBulletinUrl('not a url'), false);
});
