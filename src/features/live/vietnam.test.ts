import type { OfficialStatement } from '@/domain/types';
import { PROVINCES, nationwide, provinceFor, severityOf, statementsFor } from './vietnam';

const st = (areas: string[], until = '2099-01-01T00:00:00Z') =>
  ({ id: areas.join(), area_names: areas, instruction_text: '', valid_from: null, valid_until: until }) as unknown as OfficialStatement;

describe('nationwide situation', () => {
  test('34 provincial units', () => expect(PROVINCES.length).toBe(34));

  test('old province names map to the merged unit', () => {
    expect(provinceFor('Quảng Nam')?.name).toBe('Đà Nẵng');
    expect(provinceFor('Thành phố Hà Nội')?.name).toBe('Hà Nội');
    expect(provinceFor('Hanoi')?.name).toBe('Hà Nội');
    expect(provinceFor('Kon Tum')?.name).toBe('Quảng Ngãi');
  });

  test('bulletins match by current or former names, not by other provinces', () => {
    const dn = provinceFor('Đà Nẵng')!;
    expect(statementsFor(dn, [st(['TP. Đà Nẵng: Hiệp Đức'])]).length).toBe(1);
    expect(statementsFor(dn, [st(['Quảng Nam: Trà My'])]).length).toBe(1);
    expect(statementsFor(dn, [st(['Lâm Đồng: Đà Lạt'])]).length).toBe(0);
  });

  test('an official warning outranks rain; expired warnings do not count', () => {
    expect(severityOf({ nowMm: 0, cloudPct: 0, todayMm: 0, tomorrowMm: 0, weatherCode: 0 }, [st(['x'])])).toBe('warning');
    expect(severityOf({ nowMm: 0, cloudPct: 0, todayMm: 60, tomorrowMm: 0, weatherCode: 0 }, [])).toBe('heavy');
    expect(severityOf(null, [])).toBe('unknown');
    const out = nationwide([], [st(['TP. Đà Nẵng: Hiệp Đức'], '2000-01-01T00:00:00Z')]);
    expect(out.find((p) => p.province.name === 'Đà Nẵng')!.severity).toBe('unknown');
  });
});
