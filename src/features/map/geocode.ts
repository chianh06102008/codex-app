// Place search with Photon (komoot), an OpenStreetMap geocoder. No key, no server.
// Fair use: only search on an explicit tap, never per keystroke.
import { GEOCODER_URL } from '@/config';
import type { LatLon } from '@/domain/types';
import { timeoutSignal } from '@/lib/timeout';
import { SLICE_POLYGON, SLICE_REGION, insideSlice } from './roads';

export type PlaceHit = { name: string; address: string; coordinate: LatLon };

type PhotonFeature = {
  geometry: { coordinates: [number, number] };
  properties: Record<string, string | undefined>;
};

export async function searchPlaces(query: string, lang: 'vi' | 'en'): Promise<PlaceHit[]> {
  const lats = SLICE_POLYGON.map((p) => p.latitude);
  const lons = SLICE_POLYGON.map((p) => p.longitude);
  const params = new URLSearchParams({
    q: query,
    lat: String(SLICE_REGION.latitude),
    lon: String(SLICE_REGION.longitude),
    bbox: [Math.min(...lons), Math.min(...lats), Math.max(...lons), Math.max(...lats)].join(','),
    limit: '8',
  });
  if (lang === 'en') params.set('lang', 'en'); // Photon has no Vietnamese UI language; default returns local names
  const res = await fetch(`${GEOCODER_URL}?${params}`, { signal: timeoutSignal(10_000) });
  if (!res.ok) throw new Error(`Photon ${res.status}`);
  const data: { features?: PhotonFeature[] } = await res.json();
  return (data.features ?? [])
    .map((f) => {
      const p = f.properties;
      const [longitude, latitude] = f.geometry.coordinates;
      const street = [p.housenumber, p.street].filter(Boolean).join(' ');
      return {
        name: p.name ?? street ?? query,
        address: [p.name ? street : '', p.district, p.city].filter(Boolean).join(', '),
        coordinate: { latitude, longitude },
      };
    })
    .filter((h) => insideSlice(h.coordinate));
}
