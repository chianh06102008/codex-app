import type { OfficialStatement, Report } from '@/domain/types';
import { computeSegmentState, reportWeight, type FusionContext } from './fusion';

const NOW = new Date('2026-11-14T12:00:00Z');
const minsAgo = (m: number) => new Date(NOW.getTime() - m * 60_000).toISOString();

function report(p: Partial<Report> = {}): Report {
  return {
    id: 'r1', created_at: minsAgo(10), server_received_at: null, segment_id: 's1', lat: 16, lon: 108,
    accuracy_m: 5, model_category: null, model_confidence: null, model_reference_objects: [],
    human_category: 'ankle', water_visible: true, obstruction: 'none', vehicle_context: null,
    no_water: false, reporter_trust: 'low', perceptual_hash: null, status: 'published', retracted_at: null,
    ...p,
  };
}

function statement(p: Partial<OfficialStatement> = {}): OfficialStatement {
  return {
    id: 'st1', source_url: 'https://nchmf.gov.vn/x', retrieved_at: minsAgo(5), issuer: 'NCHMF',
    hazard_type: 'heavy_rain', area_names: ['Hải Châu'], geometry: null, valid_from: minsAgo(60),
    valid_until: null, instruction_text: '…', instruction_text_vi: null, instruction_text_en: null,
    severity: 'level 1', do_not_travel: false, pinned_by: null, parse_status: 'ok', ...p,
  };
}

const ctx = (p: Partial<FusionContext> = {}): FusionContext => ({
  now: NOW, feedStatus: 'ok', statements: [], reports: [], heavyRain: false, ...p,
});

describe('fusion', () => {
  test('no evidence with a healthy feed is the calmest state, never anything calmer', () => {
    expect(computeSegmentState('s1', 'motorbike', ctx()).state).toBe('no_adverse_evidence');
  });

  test('feed unavailable -> at least uncertain (P10)', () => {
    expect(computeSegmentState('s1', 'motorbike', ctx({ feedStatus: 'unavailable' })).state).toBe('uncertain');
  });

  test('T05: fresh no-water reports inside an official warning do not lower the floor', () => {
    const s = computeSegmentState('s1', 'motorbike', ctx({
      statements: [statement()],
      reports: [
        report({ id: 'a', human_category: 'ankle', created_at: minsAgo(30) }),
        report({ id: 'n1', no_water: true, water_visible: false, created_at: minsAgo(5) }),
        report({ id: 'n2', no_water: true, water_visible: false, created_at: minsAgo(4) }),
      ],
    }));
    expect(s.floor).toBe('warning');
    expect(s.state).toBe('discouraged');
    expect(s.reasons.some((r) => r.kind === 'no_water_retired_penalty')).toBe(false);
  });

  test('do-not-travel instruction is a hard block that photos cannot lift', () => {
    const s = computeSegmentState('s1', 'car', ctx({
      statements: [statement({ do_not_travel: true })],
      reports: [report({ no_water: true, water_visible: false }), report({ id: 'r2', no_water: true, water_visible: false })],
    }));
    expect(s.state).toBe('avoid');
    expect(s.floor).toBe('do_not_travel');
  });

  test('flash flood warning -> avoid', () => {
    expect(computeSegmentState('s1', 'car', ctx({ statements: [statement({ hazard_type: 'flash_flood' })] })).state).toBe('avoid');
  });

  test('confirmed wheel -> avoid for motorbike and walking, discouraged for car', () => {
    const c = ctx({ reports: [report({ human_category: 'wheel' })] });
    expect(computeSegmentState('s1', 'motorbike', c).state).toBe('avoid');
    expect(computeSegmentState('s1', 'walk', c).state).toBe('avoid');
    expect(computeSegmentState('s1', 'car', c).state).toBe('discouraged');
  });

  test('ankle is discouraged for every mode, including car (not a green light)', () => {
    const c = ctx({ reports: [report({ human_category: 'ankle' })] });
    for (const m of ['motorbike', 'walk', 'car'] as const) expect(computeSegmentState('s1', m, c).state).toBe('discouraged');
  });

  test('unknown with water visible -> avoid for motorbike; unknown without water adds nothing', () => {
    expect(computeSegmentState('s1', 'motorbike', ctx({ reports: [report({ human_category: 'unknown', water_visible: true })] })).state).toBe('avoid');
    expect(computeSegmentState('s1', 'motorbike', ctx({ reports: [report({ human_category: 'unknown', water_visible: false })] })).state).toBe('no_adverse_evidence');
  });

  test('model category is ignored; fusion uses the human category', () => {
    const s = computeSegmentState('s1', 'motorbike', ctx({ reports: [report({ model_category: 'wheel', human_category: 'ankle' })] }));
    expect(s.state).toBe('discouraged');
  });

  test('T12: report at 12 h + 1 min has weight 0 and no effect', () => {
    const r = report({ human_category: 'wheel', created_at: minsAgo(12 * 60 + 1) });
    expect(reportWeight(r, NOW, false)).toBe(0);
    expect(computeSegmentState('s1', 'motorbike', ctx({ reports: [r] })).state).toBe('no_adverse_evidence');
  });

  test('decay: weight halves at 45 min in heavy rain, 180 min when quiet', () => {
    const r = report({ created_at: minsAgo(45) });
    expect(reportWeight(r, NOW, true)).toBeCloseTo(0.5, 5);
    expect(reportWeight(report({ created_at: minsAgo(180) }), NOW, false)).toBeCloseTo(0.5, 5);
  });

  test('retracted report has weight 0 immediately', () => {
    expect(reportWeight(report({ status: 'retracted', retracted_at: minsAgo(1) }), NOW, false)).toBe(0);
  });

  test('two newer no-water reports retire a crowd penalty only to uncertain, never to calmest', () => {
    const s = computeSegmentState('s1', 'motorbike', ctx({
      reports: [
        report({ id: 'a', human_category: 'ankle', created_at: minsAgo(30) }),
        report({ id: 'n1', no_water: true, water_visible: false, created_at: minsAgo(5) }),
        report({ id: 'n2', no_water: true, water_visible: false, created_at: minsAgo(4) }),
      ],
    }));
    expect(s.state).toBe('uncertain');
  });

  test('no-water reports cannot retire a penalty during heavy rain', () => {
    const s = computeSegmentState('s1', 'motorbike', ctx({
      heavyRain: true,
      reports: [
        report({ id: 'a', human_category: 'ankle', created_at: minsAgo(20) }),
        report({ id: 'n1', no_water: true, water_visible: false, created_at: minsAgo(5) }),
        report({ id: 'n2', no_water: true, water_visible: false, created_at: minsAgo(4) }),
      ],
    }));
    expect(s.state).toBe('discouraged');
  });

  test('obstruction report -> avoid', () => {
    expect(computeSegmentState('s1', 'car', ctx({ reports: [report({ obstruction: 'landslide' })] })).state).toBe('avoid');
  });
});
