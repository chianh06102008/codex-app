// Rules for the official status band (PRD P2, P10, T01).
import type { OfficialStatement } from '@/domain/types';
import { statementTitle, summarizeOfficial } from './officialView';

const NOW = new Date('2026-11-14T01:00:00+07:00');

function statement(p: Partial<OfficialStatement> = {}): OfficialStatement {
  return {
    id: 's1',
    source_url: 'https://www.nchmf.gov.vn/x-post1.html',
    retrieved_at: '2026-11-14T00:30:00+07:00',
    issuer: 'Trung tâm Dự báo KTTV quốc gia',
    hazard_type: 'flash_flood',
    area_names: ['TP. Đà Nẵng'],
    geometry: null,
    valid_from: '2026-11-13T23:20:00+07:00',
    valid_until: '2026-11-14T05:20:00+07:00',
    instruction_text: 'TIN CẢNH BÁO LŨ QUÉT\nTrong 6 giờ tới…',
    instruction_text_vi: null,
    instruction_text_en: null,
    severity: 'Cấp 1',
    do_not_travel: false,
    pinned_by: null,
    parse_status: 'ok',
    ...p,
  };
}

describe('official status band', () => {
  test('feed unavailable is degraded, never calm', () => {
    const v = summarizeOfficial({ feedStatus: 'unavailable', statements: [], simulated: false }, NOW);
    expect(v.tone).toBe('degraded');
  });

  test('feed ok with no statements is calm', () => {
    expect(summarizeOfficial({ feedStatus: 'ok', statements: [], simulated: false }, NOW).tone).toBe('calm');
  });

  test('a statement inside its validity is a warning', () => {
    const v = summarizeOfficial({ feedStatus: 'ok', statements: [statement()], simulated: false }, NOW);
    expect(v.tone).toBe('warning');
    expect(v.inForce).toHaveLength(1);
  });

  test('an expired statement is history, not a current warning', () => {
    const later = new Date('2026-11-14T05:21:00+07:00');
    const v = summarizeOfficial({ feedStatus: 'ok', statements: [statement()], simulated: false }, later);
    expect(v.tone).toBe('calm');
    expect(v.expired).toHaveLength(1);
  });

  test('no end time means still in force', () => {
    const far = new Date('2030-01-01T00:00:00Z');
    const v = summarizeOfficial({ feedStatus: 'ok', statements: [statement({ valid_until: null })], simulated: false }, far);
    expect(v.tone).toBe('warning');
  });

  test('last-known warning still shows as a warning when the feed is down', () => {
    const v = summarizeOfficial({ feedStatus: 'last_known', statements: [statement()], simulated: false }, NOW);
    expect(v.tone).toBe('warning');
  });

  test('last-known with only expired statements is degraded, not calm', () => {
    const later = new Date('2026-11-14T06:00:00+07:00');
    const v = summarizeOfficial({ feedStatus: 'last_known', statements: [statement()], simulated: false }, later);
    expect(v.tone).toBe('degraded');
  });

  test('do-not-travel statements come first', () => {
    const a = statement({ id: 'a' });
    const b = statement({ id: 'b', do_not_travel: true, valid_from: '2026-11-13T20:00:00+07:00' });
    const v = summarizeOfficial({ feedStatus: 'ok', statements: [a, b], simulated: false }, NOW);
    expect(v.inForce[0].id).toBe('b');
  });

  test('title is the first line of the original text', () => {
    expect(statementTitle(statement())).toBe('TIN CẢNH BÁO LŨ QUÉT');
    expect(statementTitle(statement({ instruction_text: '' }))).toBeNull();
  });
});
