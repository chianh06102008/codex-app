// Hanoi's inner districts with the rough GPS point of their center.
// We use these to turn the phone's GPS position into a district name,
// and to show a list when the user picks their district by hand.

export type District = {
  name: string;
  latitude: number;
  longitude: number;
};

export const DISTRICTS: District[] = [
  { name: 'Ba Đình', latitude: 21.0341, longitude: 105.8142 },
  { name: 'Hoàn Kiếm', latitude: 21.0287, longitude: 105.8524 },
  { name: 'Đống Đa', latitude: 21.0136, longitude: 105.8261 },
  { name: 'Hai Bà Trưng', latitude: 21.0059, longitude: 105.8577 },
  { name: 'Thanh Xuân', latitude: 20.9937, longitude: 105.8106 },
  { name: 'Cầu Giấy', latitude: 21.0362, longitude: 105.7906 },
  { name: 'Hoàng Mai', latitude: 20.9741, longitude: 105.8635 },
  { name: 'Tây Hồ', latitude: 21.0702, longitude: 105.8188 },
  { name: 'Long Biên', latitude: 21.0472, longitude: 105.8881 },
  { name: 'Nam Từ Liêm', latitude: 21.0128, longitude: 105.7652 },
  { name: 'Bắc Từ Liêm', latitude: 21.0711, longitude: 105.7681 },
  { name: 'Hà Đông', latitude: 20.9714, longitude: 105.7788 },
];

// If the user is farther than this from every district center, they are not in Hanoi.
const MAX_DISTANCE_KM = 25;

// Distance in km between two GPS points (the "haversine" formula).
function distanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// Find the closest district to a GPS point. Returns null if the user is outside Hanoi.
export function findNearestDistrict(latitude: number, longitude: number): District | null {
  let nearest: District | null = null;
  let nearestKm = Infinity;
  for (const district of DISTRICTS) {
    const km = distanceKm(latitude, longitude, district.latitude, district.longitude);
    if (km < nearestKm) {
      nearest = district;
      nearestKm = km;
    }
  }
  return nearestKm <= MAX_DISTANCE_KM ? nearest : null;
}
