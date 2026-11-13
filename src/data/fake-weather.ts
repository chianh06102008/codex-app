// Fake weather / flood-risk data.
//
// The Home screen gets its flood risk ONLY from `getFloodRisk` below.
// Right now it returns made-up numbers. Later, a teammate can replace the body
// of `getFloodRisk` with a real weather API call that returns the same shape,
// and no screen needs to change.

export type RiskLevel = 'low' | 'medium' | 'high';

// The shape of one flood-risk forecast. A real API should return this same shape.
export type FloodRisk = {
  district: string; // e.g. "Thanh Xuân"
  risk_level: RiskLevel; // flood risk for the next 3 hours
  rain_mm_next_3h: number; // expected rainfall in millimeters
  updated_at: string; // when the forecast was made (ISO date string)
};

// Made-up rainfall per district (mm in the next 3 hours).
// Low-lying districts get more rain so the demo shows all three colors.
const FAKE_RAIN_MM: Record<string, number> = {
  'Thanh Xuân': 45,
  'Hoàng Mai': 52,
  'Đống Đa': 38,
  'Hai Bà Trưng': 30,
  'Hà Đông': 41,
  'Cầu Giấy': 22,
  'Nam Từ Liêm': 18,
  'Bắc Từ Liêm': 12,
  'Ba Đình': 15,
  'Hoàn Kiếm': 20,
  'Tây Hồ': 8,
  'Long Biên': 10,
};

// Turn rainfall into a risk level. Over 40 mm in 3 hours often floods Hanoi streets.
function riskFromRain(rainMm: number): RiskLevel {
  if (rainMm >= 40) return 'high';
  if (rainMm >= 20) return 'medium';
  return 'low';
}

// Get the flood risk for a district for the next 3 hours.
export async function getFloodRisk(district: string): Promise<FloodRisk> {
  // Pretend we are waiting for a server, so the loading state is visible.
  await new Promise((resolve) => setTimeout(resolve, 600));

  const rain = FAKE_RAIN_MM[district] ?? 25;
  return {
    district,
    risk_level: riskFromRain(rain),
    rain_mm_next_3h: rain,
    updated_at: new Date().toISOString(),
  };
}
