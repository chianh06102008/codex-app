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
          address: `${lat.toFixed(5)}, ${lon.toFixed(5)} · Hà Nội`,
          district: 'Hà Nội',
          lon,
          lat,
        } satisfies GeocodePlace,
      })
    }
  }

  if (!q) {
    return NextResponse.json({ results: CURATED_HANOI_PLACES })
  }

  const qLower = q.toLowerCase()
  const localMatches = CURATED_HANOI_PLACES.filter(
    (p) => p.label.toLowerCase().includes(qLower) || p.address.toLowerCase().includes(qLower),
  )

  const remoteMatches: GeocodePlace[] = []

  const [nomRes, photonRes] = await Promise.allSettled([
    fetch(
      `https://nominatim.openstreetmap.org/search?format=jsonv2&q=${encodeURIComponent(
        q.includes('Hà Nội') || q.includes('Việt Nam') ? q : `${q}, Hà Nội`,
      )}&countrycodes=vn&limit=5&addressdetails=1&accept-language=vi`,
      {
        headers: { 'User-Agent': 'FloodScoutVN/2.0 (disaster-routing)' },
        signal: AbortSignal.timeout(4500),
      },
    ),
    fetch(
      `https://photon.komoot.io/api/?q=${encodeURIComponent(q)}&lat=21.005&lon=105.815&limit=5`,
      { signal: AbortSignal.timeout(4500) },
    ),
  ])

  if (nomRes.status === 'fulfilled' && nomRes.value.ok) {
    try {
      const items = await nomRes.value.json()
      for (const it of Array.isArray(items) ? items : []) {
        const lon = Number(it.lon)
        const lat = Number(it.lat)
        if (Number.isNaN(lon) || Number.isNaN(lat)) continue
        const addr = it.address ?? {}
        const label = it.name || addr.road || String(it.display_name || '').split(',')[0] || q
        const district = addr.city_district || addr.county || addr.city || addr.state || 'Việt Nam'
        remoteMatches.push({
          id: `nom-${it.place_id}`,
          label: String(label),
          address: String(it.display_name || label),
          district: String(district),
          lon,
          lat,
        })
      }
    } catch {
      // Ignore
    }
  }

  if (photonRes.status === 'fulfilled' && photonRes.value.ok && remoteMatches.length < 4) {
    try {
      const pj = await photonRes.value.json()
      for (const f of Array.isArray(pj?.features) ? pj.features : []) {
        const coords = f?.geometry?.coordinates
        const props = f?.properties ?? {}
        if (!Array.isArray(coords) || props.countrycode !== 'VN') continue
        const label = props.name || props.street || q
        const parts = [props.housenumber, props.street, props.district, props.city || 'Hà Nội']
          .filter(Boolean)
          .join(', ')
        remoteMatches.push({
          id: `ph-${props.osm_id || Math.random()}`,
          label: String(label),
          address: parts || String(label),
          district: String(props.district || props.city || 'Việt Nam'),
          lon: Number(coords[0]),
          lat: Number(coords[1]),
        })
      }
    } catch {
      // Ignore
    }
  }

  const combined: GeocodePlace[] = [...localMatches]
  for (const cand of remoteMatches) {
    const dup = combined.some((ex) => Math.hypot(ex.lon - cand.lon, ex.lat - cand.lat) < 0.0005)
    if (!dup) combined.push(cand)
  }

  return NextResponse.json({ results: combined.slice(0, 7) })
}
