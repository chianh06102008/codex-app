import { NextResponse } from 'next/server'
import type { GeocodePlace } from '@/types/floodscout'

const CURATED_HANOI_PLACES: GeocodePlace[] = [
  {
    id: 'place-you-default',
    label: 'Royal City · 72A Đường Nguyễn Trãi',
    address: '72A Đường Nguyễn Trãi, Phường Thượng Đình, Quận Thanh Xuân, Hà Nội',
    district: 'Quận Thanh Xuân, Hà Nội',
    lon: 105.8148,
    lat: 21.0025,
  },
  {
    id: 'place-biblio',
    label: 'Biblio · 79 Phố Ngụy Như Kon Tum',
    address: '79 Phố Ngụy Như Kon Tum, Phường Nhân Chính, Quận Thanh Xuân, Hà Nội',
    district: 'Quận Thanh Xuân, Hà Nội',
    lon: 105.8042,
    lat: 21.0016,
  },
  {
    id: 'place-dh-ha-noi',
    label: 'Trường Đại học Hà Nội · Km9 Nguyễn Trãi',
    address: 'Km9 Đường Nguyễn Trãi, Quận Nam Từ Liêm, Hà Nội',
    district: 'Quận Nam Từ Liêm, Hà Nội',
    lon: 105.7953,
    lat: 20.9893,
  },
  {
    id: 'place-ho-hoan-kiem',
    label: 'Hồ Hoàn Kiếm · Đinh Tiên Hoàng',
    address: 'Phố Đinh Tiên Hoàng, Quận Hoàn Kiếm, Hà Nội',
    district: 'Quận Hoàn Kiếm, Hà Nội',
    lon: 105.8525,
    lat: 21.0285,
  },
  {
    id: 'place-hapulico',
    label: 'Hapulico Complex · 1 Nguyễn Huy Tưởng',
    address: '1 Đường Nguyễn Huy Tưởng, Phường Thanh Xuân Trung, Quận Thanh Xuân, Hà Nội',
    district: 'Quận Thanh Xuân, Hà Nội',
    lon: 105.8065,
    lat: 20.9994,
  },
  {
    id: 'place-keangnam',
    label: 'Keangnam Landmark 72 · Phạm Hùng',
    address: 'Đường Phạm Hùng, Phường Mễ Trì, Quận Nam Từ Liêm, Hà Nội',
    district: 'Quận Nam Từ Liêm, Hà Nội',
    lon: 105.7841,
    lat: 21.0168,
  },
]

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const q = (searchParams.get('q') || '').trim()
  const latParam = searchParams.get('lat')
  const lonParam = searchParams.get('lon')

  if (latParam && lonParam) {
    const lat = Number(latParam)
    const lon = Number(lonParam)
    if (!Number.isNaN(lat) && !Number.isNaN(lon)) {
      try {
        const nomUrl = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lon}&accept-language=vi`
        const r = await fetch(nomUrl, {
          headers: { 'User-Agent': 'FloodScoutVN/2.0 (disaster-routing)' },
          signal: AbortSignal.timeout(4500),
        })
        if (r.ok) {
          const j = await r.json()
          const addr = j?.address ?? {}
          const road = addr.road || addr.pedestrian || addr.suburb || j?.name || 'Điểm trên bản đồ'
          const house = addr.house_number ? `${addr.house_number} ` : ''
          const ward = addr.quarter || addr.suburb || addr.village || ''
          const district = addr.city_district || addr.county || addr.town || addr.city || 'Hà Nội'
          const city = addr.city || addr.state || 'Hà Nội'
          const formattedAddress = [
            `${house}${road}`,
            ward,
            district !== city ? district : null,
            city,
          ]
            .filter(Boolean)
            .join(', ')

          const place: GeocodePlace = {
            id: `rev-${lon.toFixed(5)}-${lat.toFixed(5)}`,
            label: `${house}${road}`,
            address:
              formattedAddress || String(j?.display_name || `${lat.toFixed(5)}, ${lon.toFixed(5)}`),
            district: `${district}, ${city}`,
            lon,
            lat,
          }
          return NextResponse.json({ place })
        }
      } catch {
        // Fallback below
      }
      return NextResponse.json({
        place: {
          id: `rev-${lon.toFixed(5)}-${lat.toFixed(5)}`,
          label: `Vị trí (${lat.toFixed(4)}, ${lon.toFixed(4)})`,
          address: `${lat.toFixed(5)}, ${lon.toFixed(5)}`,
          district: '',
          lon,
          lat,
        } satisfies GeocodePlace,
      })
    }
  }

  if (!q) {
    return NextResponse.json({ results: CURATED_HANOI_PLACES })
  }

  const normalize = (text: string) => text.toLowerCase().normalize('NFD')
    .replace(/\p{M}/gu, '').replace(/đ/g, 'd').trim()
  const qLower = normalize(q)
  const localMatches = CURATED_HANOI_PLACES.filter(
    (p) => normalize(p.label).includes(qLower) || normalize(p.address).includes(qLower),
  )

  if (localMatches.length > 0 || q.length < 2) {
    return NextResponse.json({ results: localMatches })
  }

  const text = q.slice(0, 180)
  const countryBox = '102,8,110,24'
  const photonBase = process.env.APP_PHOTON_BASE_URL || 'https://photon.komoot.io'
  const photon = new URL('/api/', photonBase)
  photon.search = new URLSearchParams({ q: text, bbox: countryBox, limit: '12' }).toString()
  const locality = new URL('https://geocoding-api.open-meteo.com/v1/search')
  locality.search = new URLSearchParams({ name: text, countryCode: 'VN', count: '7' }).toString()

  async function search(url: URL, timeout: number) {
    try {
      const response = await fetch(url, { signal: AbortSignal.timeout(timeout), next: { revalidate: 3600 } })
      return response.ok ? await response.json() : null
    } catch {
      return null
    }
  }

  const [streetData, localityData] = await Promise.all([search(photon, 3000), search(locality, 2500)])
  const streets: GeocodePlace[] = []
  for (const feature of Array.isArray(streetData?.features) ? streetData.features : []) {
    const props = feature?.properties
    const coords = feature?.geometry?.coordinates
    if (props?.countrycode !== 'VN' || !Array.isArray(coords)) continue
    const [lon, lat] = coords
    if (!Number.isFinite(lon) || !Number.isFinite(lat)) continue
    const label = props.name || props.street
    if (!label) continue
    const address = [props.housenumber, props.street, props.district, props.city || props.state]
      .filter(Boolean).join(', ')
    streets.push({
      id: `ph-${props.osm_type ?? 'place'}-${props.osm_id ?? `${lon}-${lat}`}`,
      label,
      address: address || label,
      district: props.district || props.city || props.state || '',
      lon,
      lat,
    })
  }

  const matches = [...streets]
  for (const place of Array.isArray(localityData?.results) ? localityData.results : []) {
    const { name, longitude: lon, latitude: lat } = place
    if (place.country_code !== 'VN' || typeof name !== 'string'
      || !Number.isFinite(lon) || !Number.isFinite(lat)) continue
    if (matches.some((item) => Math.hypot(item.lon - lon, item.lat - lat) < 0.0005)) continue
    matches.push({
      id: `locality-${place.id ?? `${lon}-${lat}`}`,
      label: name,
      address: [...new Set([name, place.admin2, place.admin1, place.country].filter(Boolean))].join(', '),
      district: place.admin2 || place.admin1 || '',
      lon,
      lat,
    })
  }

  return NextResponse.json({
    results: matches.slice(0, 7),
    unavailable: !streetData && matches.length === 0,
  })
}
