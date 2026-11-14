import type { CompiledAreaBulletin, LiveHazardSnapshot } from '@/types/floodscout'

export const officialPortal = 'https://nchmf.gov.vn/Kttv/'

export function readLocation(params: URLSearchParams) {
  if (!params.has('lat') || !params.has('lon')) return null
  const lat = Number(params.get('lat'))
  const lon = Number(params.get('lon'))
  if (!params.get('lat')?.trim() || !params.get('lon')?.trim()) return null
  if (!Number.isFinite(lat) || !Number.isFinite(lon) || lat < 8 || lat > 24 || lon < 102 || lon > 110) return null
  return { lat, lon }
}

function clean(value: string) {
  return value.replace(/<[^>]*>/g, ' ').replace(/&(?:nbsp|#160);/g, ' ')
    .replace(/&amp;/g, '&').replace(/\s+/g, ' ').trim().normalize('NFC')
}

function includesPlace(text: string, place: string) {
  const normalize = (value: string) => value.toLocaleLowerCase('vi')
    .replace(/[^\p{L}\p{N}]+/gu, ' ').trim()
  return ` ${normalize(text)} `.includes(` ${normalize(place)} `)
}

async function get(url: string) {
  const response = await fetch(url, {
    next: { revalidate: 120 },
    signal: AbortSignal.timeout(6500),
    headers: { 'User-Agent': 'FloodScoutVN/2.0' },
  })
  if (!response.ok) throw new Error('Source unavailable')
  return response
}

export async function fetchOfficialBulletin(
  location: { lat: number; lon: number },
  now: Date,
): Promise<{ bulletin: CompiledAreaBulletin | null; status: LiveHazardSnapshot['officialStatus'] }> {
  try {
    const [listing, reverse] = await Promise.all([
      get(officialPortal).then((response) => response.text()),
      get(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${location.lat}&lon=${location.lon}&accept-language=vi`)
        .then((response) => response.json()),
    ])
    const address = reverse?.address
    const province = address?.state || address?.city
    const locality = address?.quarter || address?.suburb || address?.village || address?.town || address?.city_district
    if (address?.country_code !== 'vn' || typeof province !== 'string') {
      return { bulletin: null, status: 'unavailable' }
    }
    const provinceName = province.replace(/^(?:Tỉnh|Thành phố)\s+/iu, '')
    const localityName = typeof locality === 'string' ? locality.replace(/^(?:Xã|Phường|Quận|Huyện)\s+/iu, '') : ''
    const candidates = [...listing.matchAll(/<a\b[^>]*\bhref\s*=\s*["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi)]
      .flatMap(([, href, markup]) => {
        const text = clean(markup)
        const timestamp = text.match(/\(\s*(\d{2})\/(\d{2})\/(\d{4})\s+(\d{2}):(\d{2})(?::(\d{2}))?\s*\)$/)
        if (!timestamp || !/cảnh báo.*(?:lũ|ngập|sạt lở|mưa lớn)/iu.test(text) || !includesPlace(text, provinceName)) return []
        let url: URL
        try { url = new URL(href.replace(/&amp;/g, '&'), officialPortal) } catch { return [] }
        if (url.protocol !== 'https:' || !['nchmf.gov.vn', 'www.nchmf.gov.vn'].includes(url.hostname)
          || !/-post\d+\.html$/i.test(url.pathname)) return []
        const [, day, month, year, hour, minute, second = '00'] = timestamp
        const issued = Date.parse(`${year}-${month}-${day}T${hour}:${minute}:${second}+07:00`)
        if (!Number.isFinite(issued) || issued > now.getTime() || now.getTime() - issued > 24 * 3600000) return []
        return [{ issued, url: url.href, title: text.slice(0, timestamp.index).trim() }]
      }).sort((a, b) => b.issued - a.issued).slice(0, 5)

    const articles = await Promise.all(candidates.map(async (candidate) => ({
      ...candidate, raw: await get(candidate.url).then((response) => response.text()),
    })))
    for (const article of articles) {
      const text = clean(article.raw)
      const start = text.indexOf(article.title)
      if (start < 0 || !localityName) continue
      const body = text.slice(start + article.title.length).split(/Chi tiết tin|Tin mới/u)[0]
      const window = body.match(/Trong\s+(\d{1,2})\s+giờ tới/iu)
      if (!window || !includesPlace(body, localityName)) continue
      const duration = Number(window[1])
      const expires = article.issued + duration * 3600000
      if (duration < 1 || duration > 24 || expires <= now.getTime()) continue
      const format = (date: number | Date) => new Intl.DateTimeFormat('vi-VN', {
        timeZone: 'Asia/Ho_Chi_Minh', dateStyle: 'short', timeStyle: 'short',
      }).format(date)
      return {
        status: 'active',
        bulletin: {
          sourceUrl: article.url,
          headlineVi: article.title,
          headlineEn: article.title,
          issuerVi: 'Trung tâm Dự báo Khí tượng Thủy văn Quốc gia',
          issuerEn: 'National Center for Hydro-Meteorological Forecasting',
          issuedAtFormatted: format(article.issued),
          validUntilFormatted: format(expires),
          fetchedAtFormatted: format(now),
          affectedAreasVi: `${localityName}, ${provinceName}`,
          affectedAreasEn: `${localityName}, ${provinceName}`,
          evacuationVi: '', evacuationEn: '', verbatimVi: '', verbatimEn: '', summaryVi: '', summaryEn: '',
        },
      }
    }
    return { bulletin: null, status: 'unmatched' }
  } catch {
    return { bulletin: null, status: 'unavailable' }
  }
}
