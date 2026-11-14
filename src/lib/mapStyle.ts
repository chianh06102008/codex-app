import type { StyleSpecification } from 'maplibre-gl'

let cachedVectorStyle: StyleSpecification | null = null

export function getRasterFallbackStyle(): StyleSpecification {
  return {
    version: 8,
    sources: {
      'osm-tiles': {
        type: 'raster',
        tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
        tileSize: 256,
        attribution: '© OpenStreetMap contributors',
      },
    },
    layers: [
      {
        id: 'bg',
        type: 'background',
        paint: { 'background-color': '#ecede6' },
      },
      {
        id: 'osm-raster',
        type: 'raster',
        source: 'osm-tiles',
        paint: {
          'raster-saturation': -0.68,
          'raster-contrast': -0.08,
          'raster-brightness-min': 0.12,
          'raster-opacity': 0.92,
        },
      },
    ],
  }
}

export async function getFloodScoutVectorStyle(dataSaver = false): Promise<StyleSpecification> {
  if (dataSaver) {
    return getRasterFallbackStyle()
  }
  if (cachedVectorStyle) {
    return JSON.parse(JSON.stringify(cachedVectorStyle)) as StyleSpecification
  }

  try {
    const res = await fetch('https://tiles.openfreemap.org/styles/positron', {
      signal: AbortSignal.timeout(5000),
    })
    if (!res.ok) throw new Error(`Style HTTP ${res.status}`)
    const style = (await res.json()) as StyleSpecification

    for (const layer of style.layers) {
      const id = layer.id
      if (layer.type === 'background') {
        layer.paint = { ...layer.paint, 'background-color': '#ecede6' }
      } else if (layer.type === 'fill') {
        if (id.includes('water')) {
          layer.paint = { ...layer.paint, 'fill-color': '#cfe2f3' }
        } else if (id.includes('park') || id.includes('wood')) {
          layer.paint = { ...layer.paint, 'fill-color': '#dfe5d5', 'fill-opacity': 0.85 }
        } else if (id.includes('building')) {
          layer.paint = {
            ...layer.paint,
            'fill-color': '#e2e4da',
            'fill-outline-color': '#d6d9ce',
            'fill-opacity': 0.9,
          }
        } else if (id.includes('residential') || id.includes('landuse')) {
          layer.paint = { ...layer.paint, 'fill-color': '#e5e7de', 'fill-opacity': 0.7 }
        }
      } else if (layer.type === 'line') {
        if (id.includes('waterway')) {
          layer.paint = { ...layer.paint, 'line-color': '#b9d5ee' }
        } else if (id.includes('casing')) {
          layer.paint = { ...layer.paint, 'line-color': '#d8dbd0' }
        } else if (id.includes('highway') || id.includes('road') || id.includes('tunnel')) {
          layer.paint = { ...layer.paint, 'line-color': '#ffffff' }
        } else if (id.includes('boundary')) {
          layer.paint = { ...layer.paint, 'line-color': '#b7bcb0' }
        }
      } else if (layer.type === 'symbol') {
        layer.paint = {
          ...layer.paint,
          'text-color': id.includes('water') ? '#3b6e9c' : '#52564c',
          'text-halo-color': 'rgba(243, 244, 239, 0.95)',
          'text-halo-width': 1.6,
        }
      }
    }

    cachedVectorStyle = style
    return JSON.parse(JSON.stringify(style)) as StyleSpecification
  } catch {
    return getRasterFallbackStyle()
  }
}
