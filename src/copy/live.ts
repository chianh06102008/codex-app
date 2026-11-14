// Copy for the live situation screen (PRD §18 rules apply: never "safe", models labeled).
import type { Lang } from './mapReport';

type Fn = (...a: never[]) => string;

const vi = {
  title: 'Tình hình hiện tại',
  nationwide: 'Toàn quốc · trực tiếp',
  vnTitle: 'Tình hình toàn quốc (34 tỉnh, thành)',
  vnSource: 'Mưa: Open-Meteo tại trung tâm mỗi tỉnh · Cảnh báo: NCHMF · Thiên tai: GDACS',
  vnLine: (now: unknown, today: unknown, tomorrow: unknown) => `Mưa hiện tại ${now} mm/giờ · hôm nay ${today} mm · ngày mai ${tomorrow} mm`,
  vnWarnings: (n: unknown) => `${n} cảnh báo NCHMF đang hiệu lực`,
  sev_warning: 'Có cảnh báo chính thức',
  sev_heavy: 'Mưa to',
  sev_rain: 'Có mưa',
  sev_quiet: 'Không mưa đáng kể',
  sev_unknown: 'Chưa có dữ liệu',
  vnCount: (w: unknown, h: unknown) => `${w} tỉnh có cảnh báo chính thức · ${h} tỉnh mưa to`,
  showAll: 'Xem tất cả',
  openLive: 'Xem tình hình chi tiết',
  updated: (t: unknown) => `Cập nhật ${t}`,
  loading: 'Đang tải…',
  failed: 'Không tải được, sẽ thử lại',
  noLocation: 'Cần quyền vị trí để đọc tình hình tại chỗ bạn.',
  refresh: 'Làm mới tất cả',

  level_act: 'Hành động ngay',
  level_prepare: 'Chuẩn bị',
  level_watch: 'Theo dõi',
  advice_act: [
    'Không đi qua nước ngập, kể cả khi nước có vẻ nông.',
    'Di chuyển lên chỗ cao gần nhất, hoặc lên tầng cao của một toà nhà kiên cố.',
    'Mang điện thoại đã sạc, giấy tờ, nước uống, thuốc.',
    'Ngắt điện nếu nước sắp vào nhà. Bị mắc kẹt: gọi 112.',
  ],
  advice_prepare: [
    'Sạc đầy điện thoại và pin dự phòng.',
    'Để giấy tờ, thuốc và đồ quý lên cao.',
    'Biết trước đường đến chỗ cao gần nhất (bên dưới).',
    'Theo dõi cảnh báo chính thức; tránh đi lại không cần thiết.',
  ],
  advice_watch: [
    'Chưa thấy dấu hiệu bất lợi từ các nguồn bên dưới. Đây không phải xác nhận an toàn.',
    'Theo dõi cảnh báo chính thức và ra-đa mưa.',
  ],
  why_official: 'Cảnh báo chính thức đang hiệu lực',
  why_rain_now: 'Đang mưa rất to tại chỗ bạn',
  why_road_avoid: 'Có đường gần bạn bị báo ngập sâu',
  why_alert_severe: 'Cảnh báo thiên tai mức cao trong vòng 150 km',
  why_here_low_wet: 'Bạn đang ở chỗ trũng và đang/sắp mưa to',
  why_rain_soon: 'Dự báo mưa to trong 12–24 giờ tới',
  why_river_rising: 'Lưu lượng sông dự báo tăng mạnh',
  why_alert_near: 'Có sự kiện lũ/bão đang diễn ra trong vòng 300 km',
  why_road_discouraged: 'Có đường gần bạn không nên đi',

  weather: 'Thời tiết tại chỗ bạn',
  weatherSource: 'Mô hình Open-Meteo',
  temp: (c: unknown) => `${c}°C`,
  rainNow: (mm: unknown) => `Mưa giờ qua: ${mm} mm`,
  clouds: (p: unknown) => `Mây: ${p}%`,
  gusts: (k: unknown) => `Gió giật: ${k} km/h`,
  humidity: (p: unknown) => `Độ ẩm: ${p}%`,
  next12: 'Mưa 12 giờ tới (mm/giờ)',
  next24: (mm: unknown) => `Tổng 24 giờ tới: ${mm} mm`,
  next3d: (a: unknown, b: unknown) => `Hôm nay ${a} mm · ngày mai ${b} mm`,

  radar: 'Ra-đa mưa trên bản đồ',
  radarSource: 'RainViewer, cập nhật mỗi 10 phút; khung cuối là dự báo ngắn',
  radarFrame: (t: unknown, f: unknown) => `${t}${f ? ' (dự báo)' : ''}`,

  river: 'Lũ sông gần bạn',
  riverSource: 'Mô hình GloFAS (Copernicus) qua Open-Meteo, ô lưới ~5 km',
  riverLine: (today: unknown, peak: unknown, date: unknown) => `Hôm nay ${today} m³/s · cao nhất ${peak} m³/s ngày ${date}`,
  riverRising: (x: unknown) => `Dự báo tăng ${x} lần so với hôm nay`,
  riverSteady: 'Không dự báo tăng mạnh',

  alerts: 'Cảnh báo thiên tai (GDACS)',
  alertsSource: 'Hệ thống cảnh báo thiên tai toàn cầu (LHQ/EU). Không thay thế NCHMF.',
  alertsNone: 'Không có sự kiện lũ hay bão đang diễn ra ở Việt Nam.',
  alertLine: (kind: unknown, level: unknown, km: unknown) => `${kind} · mức ${level} · cách ${km} km`,
  flood: 'Lũ',
  cyclone: 'Bão',

  official: 'Cảnh báo chính thức (NCHMF)',

  roads: 'Đường quanh bạn',
  roadsSource: 'OpenStreetMap + báo cáo người dân + địa hình (DEM 90 m)',
  roadsNone: 'Chưa tải được đường quanh bạn.',
  roadLine: (d: unknown, rel: unknown) => `${d} m${rel !== null && rel !== '' ? ` · ${rel}` : ''}`,
  lower: (m: unknown) => `thấp hơn xung quanh ${m} m`,
  higher: (m: unknown) => `cao hơn xung quanh ${m} m`,
  unnamed: 'Đường không tên',
  r_feed: 'chưa có tình trạng chính thức mới nhất',
  r_official: 'trong vùng cảnh báo chính thức',
  r_report_wheel: 'người dân báo ngập ngang bánh xe',
  r_report_ankle: 'người dân báo ngập mắt cá',
  r_report_water: 'người dân báo có nước',
  r_low_wet: 'chỗ trũng, đang/sắp mưa to',
  r_low: 'chỗ trũng',
  more: (n: unknown) => `và ${n} đường khác`,

  ground: 'Chỗ cao gần nhất',
  groundSource: 'Địa hình Copernicus DEM 90 m; chỉ là ước tính',
  groundLine: (rise: unknown, d: unknown, dir: unknown) => `Cao hơn chỗ bạn ~${rise} m · cách ${d} m · hướng ${dir}`,
  groundNone: 'Không thấy chỗ cao hơn rõ rệt trong 2 km. Nếu nước dâng, lên tầng cao của toà nhà kiên cố.',
  hereLow: (m: unknown) => `Chỗ bạn đứng thấp hơn đường xung quanh ~${m} m.`,
  directions: 'Chỉ đường',

  help: 'Nơi trợ giúp gần bạn',
  helpNone: 'Chưa tìm thấy bệnh viện hay trạm cứu hộ trong dữ liệu bản đồ.',
  k_hospital: 'Bệnh viện',
  k_clinic: 'Phòng khám',
  k_police: 'Công an',
  k_fire_station: 'Cứu hỏa, cứu nạn',
  k_shelter: 'Nơi trú',
  k_assembly_point: 'Điểm tập kết',
  k_school: 'Trường học (thường dùng làm điểm sơ tán)',

  call: 'Số khẩn cấp',
  c112: '112 Cứu nạn',
  c113: '113 Công an',
  c114: '114 Cứu hỏa',
  c115: '115 Cấp cứu',

  dirs: ['Bắc', 'Đông Bắc', 'Đông', 'Đông Nam', 'Nam', 'Tây Nam', 'Tây', 'Tây Bắc'],
  wmo: (code: unknown) => wmoVi(Number(code)),
};

const en: typeof vi = {
  title: 'Live situation',
  nationwide: 'Vietnam · live',
  vnTitle: 'Nationwide situation (34 provinces)',
  vnSource: 'Rain: Open-Meteo at each provincial centre · Warnings: NCHMF · Disasters: GDACS',
  vnLine: (now: unknown, today: unknown, tomorrow: unknown) => `Rain now ${now} mm/h · today ${today} mm · tomorrow ${tomorrow} mm`,
  vnWarnings: (n: unknown) => `${n} NCHMF warnings in force`,
  sev_warning: 'Official warning',
  sev_heavy: 'Heavy rain',
  sev_rain: 'Rain',
  sev_quiet: 'No significant rain',
  sev_unknown: 'No data yet',
  vnCount: (w: unknown, h: unknown) => `${w} provinces with an official warning · ${h} with heavy rain`,
  showAll: 'Show all',
  openLive: 'See the full live situation',
  updated: (t: unknown) => `Updated ${t}`,
  loading: 'Loading…',
  failed: 'Could not load, will retry',
  noLocation: 'Location permission is needed to read the situation where you are.',
  refresh: 'Refresh all',

  level_act: 'Act now',
  level_prepare: 'Prepare',
  level_watch: 'Watch',
  advice_act: [
    'Do not walk or ride through flood water, even if it looks shallow.',
    'Move to the nearest higher ground, or to an upper floor of a solid building.',
    'Take a charged phone, documents, water and medicine.',
    'Switch off power if water is about to enter. If trapped, call 112.',
  ],
  advice_prepare: [
    'Charge your phone and power bank.',
    'Put documents, medicine and valuables up high.',
    'Know your way to the nearest higher ground (below).',
    'Follow official warnings; avoid unnecessary trips.',
  ],
  advice_watch: [
    'No adverse signs from the sources below. This is not a clearance.',
    'Keep an eye on official warnings and the rain radar.',
  ],
  why_official: 'An official warning is in force',
  why_rain_now: 'Very heavy rain where you are now',
  why_road_avoid: 'A nearby road has a deep-water report',
  why_alert_severe: 'High-level disaster alert within 150 km',
  why_here_low_wet: 'You are on low ground with heavy rain now or soon',
  why_rain_soon: 'Heavy rain forecast in the next 12–24 hours',
  why_river_rising: 'River flow forecast to rise sharply',
  why_alert_near: 'An ongoing flood or storm within 300 km',
  why_road_discouraged: 'A nearby road is strongly discouraged',

  weather: 'Weather where you are',
  weatherSource: 'Open-Meteo model',
  temp: (c: unknown) => `${c}°C`,
  rainNow: (mm: unknown) => `Rain last hour: ${mm} mm`,
  clouds: (p: unknown) => `Clouds: ${p}%`,
  gusts: (k: unknown) => `Gusts: ${k} km/h`,
  humidity: (p: unknown) => `Humidity: ${p}%`,
  next12: 'Rain next 12 h (mm/h)',
  next24: (mm: unknown) => `Next 24 h total: ${mm} mm`,
  next3d: (a: unknown, b: unknown) => `Today ${a} mm · tomorrow ${b} mm`,

  radar: 'Rain radar on the map',
  radarSource: 'RainViewer, every 10 min; the last frames are a short forecast',
  radarFrame: (t: unknown, f: unknown) => `${t}${f ? ' (forecast)' : ''}`,

  river: 'River flood near you',
  riverSource: 'GloFAS model (Copernicus) via Open-Meteo, ~5 km grid',
  riverLine: (today: unknown, peak: unknown, date: unknown) => `Today ${today} m³/s · peak ${peak} m³/s on ${date}`,
  riverRising: (x: unknown) => `Forecast to rise ${x}× from today`,
  riverSteady: 'No sharp rise forecast',

  alerts: 'Disaster alerts (GDACS)',
  alertsSource: 'Global Disaster Alert and Coordination System (UN/EU). Does not replace NCHMF.',
  alertsNone: 'No ongoing flood or storm event in Vietnam.',
  alertLine: (kind: unknown, level: unknown, km: unknown) => `${kind} · ${level} level · ${km} km away`,
  flood: 'Flood',
  cyclone: 'Storm',

  official: 'Official warnings (NCHMF)',

  roads: 'Roads around you',
  roadsSource: 'OpenStreetMap + resident reports + terrain (90 m DEM)',
  roadsNone: 'Roads around you are not loaded yet.',
  roadLine: (d: unknown, rel: unknown) => `${d} m${rel !== null && rel !== '' ? ` · ${rel}` : ''}`,
  lower: (m: unknown) => `${m} m lower than surroundings`,
  higher: (m: unknown) => `${m} m higher than surroundings`,
  unnamed: 'Unnamed road',
  r_feed: 'no confirmed official status',
  r_official: 'inside an official warning',
  r_report_wheel: 'residents report wheel-deep water',
  r_report_ankle: 'residents report ankle-deep water',
  r_report_water: 'residents report water',
  r_low_wet: 'low-lying, heavy rain now or soon',
  r_low: 'low-lying',
  more: (n: unknown) => `and ${n} more roads`,

  ground: 'Nearest higher ground',
  groundSource: 'Copernicus DEM 90 m terrain; an estimate only',
  groundLine: (rise: unknown, d: unknown, dir: unknown) => `~${rise} m above you · ${d} m away · to the ${dir}`,
  groundNone: 'No clearly higher ground within 2 km. If water rises, go to an upper floor of a solid building.',
  hereLow: (m: unknown) => `Where you stand is ~${m} m lower than the roads around you.`,
  directions: 'Directions',

  help: 'Help near you',
  helpNone: 'No hospital or rescue station found in the map data yet.',
  k_hospital: 'Hospital',
  k_clinic: 'Clinic',
  k_police: 'Police',
  k_fire_station: 'Fire & rescue',
  k_shelter: 'Shelter',
  k_assembly_point: 'Assembly point',
  k_school: 'School (often used for evacuation)',

  call: 'Emergency numbers',
  c112: '112 Rescue',
  c113: '113 Police',
  c114: '114 Fire',
  c115: '115 Ambulance',

  dirs: ['north', 'north-east', 'east', 'south-east', 'south', 'south-west', 'west', 'north-west'],
  wmo: (code: unknown) => wmoEn(Number(code)),
};

function wmoVi(c: number): string {
  if (c === 0) return 'Trời quang';
  if (c <= 3) return 'Có mây';
  if (c <= 48) return 'Sương mù';
  if (c <= 57) return 'Mưa phùn';
  if (c <= 67) return 'Mưa';
  if (c <= 77) return 'Tuyết';
  if (c <= 82) return 'Mưa rào';
  return 'Dông';
}
function wmoEn(c: number): string {
  if (c === 0) return 'Clear sky';
  if (c <= 3) return 'Cloudy';
  if (c <= 48) return 'Fog';
  if (c <= 57) return 'Drizzle';
  if (c <= 67) return 'Rain';
  if (c <= 77) return 'Snow';
  if (c <= 82) return 'Showers';
  return 'Thunderstorm';
}

export const LIVE: Record<Lang, typeof vi> = { vi, en };
export type LiveCopy = typeof vi;
export type _Fn = Fn;
