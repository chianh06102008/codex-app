// Nationwide situation: the 34 provincial units (from 1 July 2025) with their admin centres.
// `formerly` lists merged provinces so bulletins that still use old names map correctly.
// Rain: one Open-Meteo call for all 34 centres. Warnings: every NCHMF bulletin in force,
// matched by name. Disasters: GDACS. Each source labeled in the UI.
import type { LatLon, OfficialStatement } from '@/domain/types';
import { isInForce } from '@/features/official/officialView';
import { createStore, useStore } from '@/lib/store';
import { timeoutSignal } from '@/lib/timeout';

export type Province = { name: string; center: LatLon; formerly: string[] };

const P = (name: string, lat: number, lon: number, formerly: string[] = []): Province => ({
  name, center: { latitude: lat, longitude: lon }, formerly,
});

export const PROVINCES: Province[] = [
  P('Hà Nội', 21.028, 105.854),
  P('Huế', 16.463, 107.59, ['Thừa Thiên Huế']),
  P('Lai Châu', 22.396, 103.458),
  P('Điện Biên', 21.386, 103.017),
  P('Sơn La', 21.327, 103.914),
  P('Lạng Sơn', 21.853, 106.761),
  P('Quảng Ninh', 20.951, 107.08),
  P('Thanh Hóa', 19.807, 105.776),
  P('Nghệ An', 18.679, 105.681),
  P('Hà Tĩnh', 18.343, 105.906),
  P('Cao Bằng', 22.666, 106.258),
  P('Tuyên Quang', 21.823, 105.214, ['Hà Giang']),
  P('Lào Cai', 21.705, 104.875, ['Yên Bái']),
  P('Thái Nguyên', 21.594, 105.848, ['Bắc Kạn']),
  P('Phú Thọ', 21.322, 105.402, ['Vĩnh Phúc', 'Hòa Bình']),
  P('Bắc Ninh', 21.273, 106.194, ['Bắc Giang']),
  P('Hưng Yên', 20.646, 106.051, ['Thái Bình']),
  P('Hải Phòng', 20.845, 106.688, ['Hải Dương']),
  P('Ninh Bình', 20.25, 105.975, ['Hà Nam', 'Nam Định']),
  P('Quảng Trị', 17.468, 106.622, ['Quảng Bình']),
  P('Đà Nẵng', 16.054, 108.202, ['Quảng Nam']),
  P('Quảng Ngãi', 15.12, 108.792, ['Kon Tum']),
  P('Gia Lai', 13.782, 109.219, ['Bình Định']),
  P('Khánh Hòa', 12.238, 109.196, ['Ninh Thuận']),
  P('Lâm Đồng', 11.94, 108.458, ['Đắk Nông', 'Bình Thuận']),
  P('Đắk Lắk', 12.667, 108.038, ['Phú Yên']),
  P('TP. Hồ Chí Minh', 10.776, 106.7, ['Bình Dương', 'Bà Rịa - Vũng Tàu', 'Hồ Chí Minh']),
  P('Đồng Nai', 10.957, 106.843, ['Bình Phước']),
  P('Tây Ninh', 10.535, 106.413, ['Long An']),
  P('Cần Thơ', 10.045, 105.747, ['Sóc Trăng', 'Hậu Giang']),
  P('Vĩnh Long', 10.254, 105.972, ['Bến Tre', 'Trà Vinh']),
  P('Đồng Tháp', 10.36, 106.36, ['Tiền Giang']),
  P('Cà Mau', 9.177, 105.15, ['Bạc Liêu']),
  P('An Giang', 10.012, 105.08, ['Kiên Giang']),
];

/** Accent- and case-free key: "TP. Hồ Chí Minh" -> "hochiminh". */
export function key(s: string): string {
  return s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[đĐ]/g, 'd')
    .toLowerCase()
    .replace(/\b(thanh pho|tinh|tp\.?|city|province)\b/g, '')
    .replace(/[^a-z]/g, '');
}

export function provinceFor(name: string | null | undefined): Province | null {
  if (!name) return null;
  const k = key(name);
  return PROVINCES.find((p) => [p.name, ...p.formerly].some((n) => key(n) === k || k.includes(key(n)))) ?? null;
}

/** Bulletins whose areas or title name this province (or one it absorbed). */
export function statementsFor(p: Province, statements: OfficialStatement[]): OfficialStatement[] {
  const names = [p.name, ...p.formerly].map(key);
  return statements.filter((s) => {
    const text = key([...(s.area_names ?? []), (s.instruction_text ?? '').split('\n')[0]].join(' '));
    return names.some((n) => text.includes(n));
  });
}

export type ProvinceRain = { nowMm: number; cloudPct: number | null; todayMm: number; tomorrowMm: number; weatherCode: number | null };
export type Severity = 'warning' | 'heavy' | 'rain' | 'quiet' | 'unknown';
export type ProvinceSituation = {
  province: Province;
  rain: ProvinceRain | null;
  inForce: OfficialStatement[];
  severity: Severity;
};

export function severityOf(rain: ProvinceRain | null, inForce: OfficialStatement[]): Severity {
  if (inForce.length) return 'warning';
  if (!rain) return 'unknown';
  const most = Math.max(rain.todayMm, rain.tomorrowMm);
  if (rain.nowMm >= 7.6 || most >= 50) return 'heavy';
  if (rain.nowMm > 0 || most >= 10) return 'rain';
  return 'quiet';
}

const SEV_ORDER: Severity[] = ['warning', 'heavy', 'rain', 'unknown', 'quiet'];

export function nationwide(rain: (ProvinceRain | null)[], statements: OfficialStatement[], now = new Date()): ProvinceSituation[] {
  const live = statements.filter((s) => isInForce(s, now));
  return PROVINCES.map((province, i) => {
    const inForce = statementsFor(province, live);
    const r = rain[i] ?? null;
    return { province, rain: r, inForce, severity: severityOf(r, inForce) };
  }).sort(
    (a, b) =>
      SEV_ORDER.indexOf(a.severity) - SEV_ORDER.indexOf(b.severity) ||
      Math.max(b.rain?.todayMm ?? 0, b.rain?.tomorrowMm ?? 0) - Math.max(a.rain?.todayMm ?? 0, a.rain?.tomorrowMm ?? 0),
  );
}

// ---------- Store: one Open-Meteo call for all 34 centres, every 15 min ----------
type State = { rain: (ProvinceRain | null)[]; updated: string | null; error: string | null; loading: boolean };
export const vietnamStore = createStore<State>({ rain: [], updated: null, error: null, loading: false });
export const useVietnam = () => useStore(vietnamStore);

export async function refreshVietnam(): Promise<void> {
  vietnamStore.set((s) => ({ ...s, loading: true }));
  const lat = PROVINCES.map((p) => p.center.latitude.toFixed(3)).join(',');
  const lon = PROVINCES.map((p) => p.center.longitude.toFixed(3)).join(',');
  const url =
    `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}` +
    '&current=precipitation,weather_code,cloud_cover&daily=precipitation_sum&forecast_days=2&timezone=Asia%2FBangkok';
  try {
    const res = await fetch(url, { signal: timeoutSignal(25000) });
    if (!res.ok) throw new Error(String(res.status));
    const body = (await res.json()) as {
      current?: { precipitation?: number; weather_code?: number; cloud_cover?: number };
      daily?: { precipitation_sum?: (number | null)[] };
    }[];
    const rain = PROVINCES.map((_, i) => {
      const b = body[i];
      if (!b?.current) return null;
      return {
        nowMm: b.current.precipitation ?? 0,
        cloudPct: b.current.cloud_cover ?? null,
        weatherCode: b.current.weather_code ?? null,
        todayMm: b.daily?.precipitation_sum?.[0] ?? 0,
        tomorrowMm: b.daily?.precipitation_sum?.[1] ?? 0,
      };
    });
    vietnamStore.set({ rain, updated: new Date().toISOString(), error: null, loading: false });
  } catch (e) {
    vietnamStore.set((s) => ({ ...s, error: String(e), loading: false }));
  }
}

let timer: ReturnType<typeof setInterval> | null = null;
export function startVietnam() {
  void refreshVietnam();
  if (timer) clearInterval(timer);
  timer = setInterval(() => void refreshVietnam(), 15 * 60_000);
}
