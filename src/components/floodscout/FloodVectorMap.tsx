'use client'

import * as maplibregl from 'maplibre-gl'
import React, { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react'
import { ASSETS } from '@/lib/assets'
import { getFloodScoutVectorStyle, getRasterFallbackStyle } from '@/lib/mapStyle'
import type {
  EnabledDisasterSources,
  FloodReportDTO,
  GeocodePlace,
  HazardSegmentDTO,
  Language,
  LiveHazardSnapshot,
  MapCameraPreset,
} from '@/types/floodscout'

maplibregl.setWorkerUrl('/maplibre-gl-worker.mjs')

export type VectorMapVariant = 'home' | 'home-degraded' | 'route-found' | 'route-blocked'

export interface FloodVectorMapHandle {
  zoomIn: () => void
  zoomOut: () => void
  locateUser: () => void
  flyToPreset: (preset: MapCameraPreset) => void
  flyToCoords: (coords: [number, number], zoom?: number) => void
}

interface FloodVectorMapProps {
  variant: VectorMapVariant
  lang: Language
  dataSaver?: boolean
  showCrowdLayer?: boolean
  originPlace?: GeocodePlace
  destinationPlace?: GeocodePlace
  safeRouteCoords?: Array<[number, number]> | null
  avoidedDirectCoords?: Array<[number, number]> | null
  segments: HazardSegmentDTO[]
  reports: FloodReportDTO[]
  hazards?: LiveHazardSnapshot | null
  enabledSources: EnabledDisasterSources
  activeRadarFrameIndex?: number
  onSelectSegment?: (segment: HazardSegmentDTO) => void
  onTapDestination?: () => void
}

const RED_RIVER_GAUGE: [number, number] = [105.8545, 21.0445]
const DEFAULT_YOU: [number, number] = [105.8065, 20.9985]

export const FloodVectorMap = forwardRef<FloodVectorMapHandle, FloodVectorMapProps>(
  function FloodVectorMap(
    {
      variant,
      lang,
      dataSaver = false,
      showCrowdLayer = true,
      originPlace,
      destinationPlace,
      safeRouteCoords,
      avoidedDirectCoords,
      segments,
      reports,
      hazards,
      enabledSources,
      activeRadarFrameIndex,
      onSelectSegment,
      onTapDestination,
    },
    ref,
  ) {
    const containerRef = useRef<HTMLDivElement | null>(null)
    const mapRef = useRef<maplibregl.Map | null>(null)
    const markersRef = useRef<maplibregl.Marker[]>([])
    const [styleCounter, setStyleCounter] = useState(0)

    const youCoords: [number, number] = originPlace
      ? [originPlace.lon, originPlace.lat]
      : DEFAULT_YOU

    useImperativeHandle(ref, () => ({
      zoomIn: () => {
        mapRef.current?.zoomIn({ duration: 240 })
      },
      zoomOut: () => {
        mapRef.current?.zoomOut({ duration: 240 })
      },
      locateUser: () => {
        mapRef.current?.flyTo({
          center: youCoords,
          zoom: 14.9,
          duration: 650,
        })
      },
      flyToPreset: (preset: MapCameraPreset) => {
        if (!mapRef.current) return
        if (preset === 'pilot') {
          mapRef.current.flyTo({ center: [105.8058, 20.998], zoom: 14.5, duration: 750 })
        } else if (preset === 'red-river') {
          mapRef.current.flyTo({ center: RED_RIVER_GAUGE, zoom: 12.1, duration: 850 })
        } else if (preset === 'soc-son') {
          mapRef.current.flyTo({ center: [105.8255, 21.274], zoom: 13.8, duration: 850 })
        } else if (preset === 'hoa-binh') {
          mapRef.current.flyTo({ center: [105.311, 20.79], zoom: 14.1, duration: 900 })
        } else {
          mapRef.current.flyTo({ center: [106.8, 17.2], zoom: 5.3, duration: 950 })
        }
      },
      flyToCoords: (coords: [number, number], zoom = 14.8) => {
        mapRef.current?.flyTo({ center: coords, zoom, duration: 800 })
      },
    }))

    useEffect(() => {
      const el = containerRef.current
      if (!el) return
      let cancelled = false
      let resizeObs: ResizeObserver | null = null
      let switchedFallback = false

      ;(async () => {
        try {
          const style = await getFloodScoutVectorStyle(dataSaver)
          if (cancelled || !containerRef.current) return

          const map = new maplibregl.Map({
            container: containerRef.current,
            style,
            center: [105.8058, 20.998],
            zoom: 14.5,
            attributionControl: false,
            pitchWithRotate: false,
            dragRotate: false,
          })

          map.addControl(new maplibregl.AttributionControl({ compact: true }), 'bottom-right')
          mapRef.current = map

          if (typeof ResizeObserver !== 'undefined') {
            resizeObs = new ResizeObserver(() => map.resize())
            resizeObs.observe(containerRef.current)
          }

          map.on('load', () => {
            map.resize()
            if (!cancelled) setStyleCounter((c) => c + 1)
          })

          map.on('styledata', () => {
            if (!cancelled && map.isStyleLoaded()) {
              setStyleCounter((c) => c + 1)
            }
          })

          map.on('error', (ev: any) => {
            const msg = String(ev?.error?.message || '').toLowerCase()
            if (
              !switchedFallback &&
              (ev?.sourceId === 'openmaptiles' || msg.includes('openfreemap'))
            ) {
              switchedFallback = true
              map.setStyle(getRasterFallbackStyle())
            }
          })
        } catch {
          // Map initialization handled safely
        }
      })()

      return () => {
        cancelled = true
        resizeObs?.disconnect()
        for (const m of markersRef.current) m.remove()
        markersRef.current = []
        mapRef.current?.remove()
        mapRef.current = null
      }
    }, [dataSaver])

    // Sync real OSM street flood polylines, flash-flood/landslide corridors, RainViewer radar, and routes
    useEffect(() => {
      const map = mapRef.current
      if (!map || styleCounter === 0) return

      // 1. RainViewer radar layer (maxzoom: 7)
      const frames = hazards?.radarFrames ?? []
      const chosenFrame =
        frames.length > 0
          ? frames[
              activeRadarFrameIndex !== undefined
                ? Math.min(frames.length - 1, Math.max(0, activeRadarFrameIndex))
                : frames.length - 1
            ]
          : null

      if (map.getLayer('rainviewer-radar-layer')) map.removeLayer('rainviewer-radar-layer')
      if (map.getSource('rainviewer-radar-src')) map.removeSource('rainviewer-radar-src')

      if (enabledSources.rainViewer && chosenFrame && !dataSaver) {
        map.addSource('rainviewer-radar-src', {
          type: 'raster',
          tiles: [chosenFrame.tileUrlTemplate],
          tileSize: 256,
          maxzoom: 7,
          attribution: 'RainViewer',
        })
        map.addLayer({
          id: 'rainviewer-radar-layer',
          type: 'raster',
          source: 'rainviewer-radar-src',
          paint: {
            'raster-opacity': 0.45,
            'raster-fade-duration': 200,
          },
        })
      }

      const upsertGeoJson = (id: string, features: any[]) => {
        const fc = { type: 'FeatureCollection' as const, features }
        const existing = map.getSource(id) as maplibregl.GeoJSONSource | undefined
        if (existing) {
          existing.setData(fc as any)
        } else {
          map.addSource(id, { type: 'geojson', data: fc as any })
        }
      }

      // 2. Official / Seeded Road Corridors (Avoid Red, Caution Amber, Landslide Purple-Red, Degraded Grey)
      const avoidRoadFeatures = segments
        .filter(
          (s) => s.coordinates.length >= 2 && (s.effectiveRiskStatus || s.riskStatus) === 'avoid',
        )
        .map((s) => ({
          type: 'Feature',
          properties: {
            segmentId: s.id,
            name: s.name,
            hazardType: s.hazardType,
          },
          geometry: { type: 'LineString', coordinates: s.coordinates },
        }))

      const cautionRoadFeatures = segments
        .filter(
          (s) => s.coordinates.length >= 2 && (s.effectiveRiskStatus || s.riskStatus) === 'caution',
        )
        .map((s) => ({
          type: 'Feature',
          properties: {
            segmentId: s.id,
            name: s.name,
            hazardType: s.hazardType,
          },
          geometry: { type: 'LineString', coordinates: s.coordinates },
        }))

      const degradedFeatures =
        variant === 'home-degraded'
          ? segments
              .filter((s) => s.coordinates.length >= 2)
              .map((s) => ({
                type: 'Feature',
                properties: {},
                geometry: { type: 'LineString', coordinates: s.coordinates },
              }))
          : []

      // 3. Street-aligned Blue Crowd Flood Lines (from both active crowd reports AND flooded street segments)
      const activeReports = reports.filter((r) => r.moderationStatus !== 'expired')
      const freshBlueFeatures: any[] = []
      const ageingBlueFeatures: any[] = []

      if (showCrowdLayer) {
        for (const s of segments) {
          if (s.coordinates.length < 2) continue
          if (s.hazardType === 'urban-flood' || s.hazardType === 'flash-flood') {
            if (s.freshness === 'ageing') {
              ageingBlueFeatures.push({
                type: 'Feature',
                properties: { segmentId: s.id, name: s.name },
                geometry: { type: 'LineString', coordinates: s.coordinates },
              })
            } else {
              freshBlueFeatures.push({
                type: 'Feature',
                properties: { segmentId: s.id, name: s.name },
                geometry: { type: 'LineString', coordinates: s.coordinates },
              })
            }
          }
        }

        for (const rep of activeReports) {
          if (rep.snappedGeometry.length < 2) continue
          const targetArr =
            rep.moderationStatus === 'decaying' ? ageingBlueFeatures : freshBlueFeatures
          targetArr.push({
            type: 'Feature',
            properties: {
              segmentId: rep.segmentId || '',
              name: rep.segmentName,
            },
            geometry: { type: 'LineString', coordinates: rep.snappedGeometry },
          })
        }
      }

      upsertGeoJson('fs-degraded-src', degradedFeatures)
      if (!map.getLayer('fs-degraded-layer')) {
        map.addLayer({
          id: 'fs-degraded-layer',
          type: 'line',
          source: 'fs-degraded-src',
          layout: { 'line-cap': 'round', 'line-join': 'round' },
          paint: {
            'line-color': '#6B7280',
            'line-width': 6,
            'line-dasharray': [2, 2],
          },
        })
      }

      upsertGeoJson('fs-caution-src', cautionRoadFeatures)
      if (!map.getLayer('fs-caution-layer')) {
        map.addLayer({
          id: 'fs-caution-layer',
          type: 'line',
          source: 'fs-caution-src',
          layout: { 'line-cap': 'round', 'line-join': 'round' },
          paint: {
            'line-color': '#D97706',
            'line-width': 7,
          },
        })
      }

      upsertGeoJson('fs-avoid-src', avoidRoadFeatures)
      if (!map.getLayer('fs-avoid-layer')) {
        map.addLayer({
          id: 'fs-avoid-layer',
          type: 'line',
          source: 'fs-avoid-src',
          layout: { 'line-cap': 'round', 'line-join': 'round' },
          paint: {
            'line-color': [
              'case',
              ['==', ['get', 'hazardType'], 'landslide'],
              '#991B1B',
              '#B91C1C',
            ],
            'line-width': 8,
          },
        })
      }

      upsertGeoJson('fs-crowd-ageing-src', ageingBlueFeatures)
      if (!map.getLayer('fs-crowd-ageing-band')) {
        map.addLayer({
          id: 'fs-crowd-ageing-band',
          type: 'line',
          source: 'fs-crowd-ageing-src',
          layout: { 'line-cap': 'round', 'line-join': 'round' },
          paint: {
            'line-color': '#86B6F2',
            'line-width': 16,
            'line-opacity': 0.65,
          },
        })
        map.addLayer({
          id: 'fs-crowd-ageing-dash',
          type: 'line',
          source: 'fs-crowd-ageing-src',
          layout: { 'line-cap': 'round', 'line-join': 'round' },
          paint: {
            'line-color': '#2563EB',
            'line-width': 2.5,
            'line-dasharray': [2.5, 2.5],
          },
        })
      }

      upsertGeoJson('fs-crowd-fresh-src', freshBlueFeatures)
      if (!map.getLayer('fs-crowd-fresh-band')) {
        map.addLayer({
          id: 'fs-crowd-fresh-band',
          type: 'line',
          source: 'fs-crowd-fresh-src',
          layout: { 'line-cap': 'round', 'line-join': 'round' },
          paint: {
            // 18px wide blue band drawn at 58% above red/amber road lines so street curve + floor both read clearly
            'line-color': '#2563EB',
            'line-width': 18,
            'line-opacity': 0.58,
          },
        })

        const handleLineClick = (ev: any) => {
          const sid = ev.features?.[0]?.properties?.segmentId
          const nm = ev.features?.[0]?.properties?.name
          const found = segments.find((s) => s.id === sid || s.name === nm) || segments[0]
          if (found) onSelectSegment?.(found)
        }
        map.on('click', 'fs-crowd-fresh-band', handleLineClick)
        map.on('click', 'fs-crowd-ageing-band', handleLineClick)
        map.on('click', 'fs-avoid-layer', handleLineClick)
        map.on('click', 'fs-caution-layer', handleLineClick)
      }

      // 4. Avoided Direct Route (dashed red reference) + Safest Route (crisp dark polyline)
      const avoidedFeatures =
        (variant === 'route-found' || variant === 'route-blocked') &&
        avoidedDirectCoords &&
        avoidedDirectCoords.length >= 2
          ? [
              {
                type: 'Feature',
                properties: {},
                geometry: { type: 'LineString', coordinates: avoidedDirectCoords },
              },
            ]
          : []
      upsertGeoJson('fs-avoided-route-src', avoidedFeatures)
      if (!map.getLayer('fs-avoided-route-line')) {
        map.addLayer({
          id: 'fs-avoided-route-line',
          type: 'line',
          source: 'fs-avoided-route-src',
          layout: { 'line-cap': 'round', 'line-join': 'round' },
          paint: {
            'line-color': '#B91C1C',
            'line-width': 4,
            'line-dasharray': [2, 2],
            'line-opacity': 0.65,
          },
        })
      }

      const safeFeatures =
        variant === 'route-found' && safeRouteCoords && safeRouteCoords.length >= 2
          ? [
              {
                type: 'Feature',
                properties: {},
                geometry: { type: 'LineString', coordinates: safeRouteCoords },
              },
            ]
          : []
      upsertGeoJson('fs-safe-route-src', safeFeatures)
      if (!map.getLayer('fs-safe-route-casing')) {
        map.addLayer({
          id: 'fs-safe-route-casing',
          type: 'line',
          source: 'fs-safe-route-src',
          layout: { 'line-cap': 'round', 'line-join': 'round' },
          paint: { 'line-color': '#ffffff', 'line-width': 10 },
        })
        map.addLayer({
          id: 'fs-safe-route-line',
          type: 'line',
          source: 'fs-safe-route-src',
          layout: { 'line-cap': 'round', 'line-join': 'round' },
          paint: { 'line-color': '#191B14', 'line-width': 6 },
        })
      }

      if (variant === 'route-found' && safeRouteCoords && safeRouteCoords.length >= 2) {
        const b = safeRouteCoords.reduce(
          (acc, c) => acc.extend(c),
          new maplibregl.LngLatBounds(safeRouteCoords[0], safeRouteCoords[0]),
        )
        map.fitBounds(b, {
          padding: { top: 235, bottom: 440, left: 48, right: 48 },
          maxZoom: 15.1,
          duration: 500,
        })
      } else if (variant === 'route-blocked' && destinationPlace) {
        const b = new maplibregl.LngLatBounds(youCoords, youCoords).extend([
          destinationPlace.lon,
          destinationPlace.lat,
        ])
        map.fitBounds(b, {
          padding: { top: 245, bottom: 455, left: 56, right: 56 },
          maxZoom: 15.0,
          duration: 500,
        })
      }

      // 5. External Disaster Points (Open-Meteo Flood Gauge, GDACS, EONET, USGS)
      const disasterPoints: any[] = []
      if (enabledSources.openMeteoFlood && hazards?.flood) {
        disasterPoints.push({
          type: 'Feature',
          properties: {
            title:
              lang === 'vi'
                ? `Sông Hồng · ${hazards.flood.latestM3s} m³/s`
                : `Red River · ${hazards.flood.latestM3s} m³/s`,
            detail:
              lang === 'vi'
                ? `Open-Meteo Flood · Đỉnh 7 ngày: ${hazards.flood.peak7dM3s} m³/s (~5 km)`
                : `Open-Meteo Flood · 7d peak: ${hazards.flood.peak7dM3s} m³/s`,
            color: '#0284c7',
          },
          geometry: { type: 'Point', coordinates: RED_RIVER_GAUGE },
        })
      }
      if (enabledSources.gdacs && hazards?.gdacsAlerts) {
        for (const al of hazards.gdacsAlerts) {
          disasterPoints.push({
            type: 'Feature',
            properties: {
              title: `GDACS ${al.eventType}: ${al.name}`,
              detail: `${al.country} · Mức ${al.alertLevel} · ${al.fromDate}`,
              color:
                al.alertLevel === 'Red'
                  ? '#b91c1c'
                  : al.alertLevel === 'Orange'
                    ? '#c2410c'
                    : '#15803d',
            },
            geometry: { type: 'Point', coordinates: al.coordinates },
          })
        }
      }
      if (enabledSources.nasaEonet && hazards?.eonetEvents) {
        for (const ev of hazards.eonetEvents) {
          disasterPoints.push({
            type: 'Feature',
            properties: {
              title: ev.title,
              detail: `NASA EONET · ${ev.subtitle}`,
              color: '#7c3aed',
            },
            geometry: { type: 'Point', coordinates: ev.coordinates },
          })
        }
      }
      if (enabledSources.usgsQuakes && hazards?.usgsQuakes) {
        for (const q of hazards.usgsQuakes) {
          disasterPoints.push({
            type: 'Feature',
            properties: {
              title: `${q.magnitudeOrCategory} · ${q.title}`,
              detail: q.subtitle,
              color: '#d97706',
            },
            geometry: { type: 'Point', coordinates: q.coordinates },
          })
        }
      }

      upsertGeoJson('fs-disasters-src', disasterPoints)
      if (!map.getLayer('fs-disasters-halo')) {
        map.addLayer({
          id: 'fs-disasters-halo',
          type: 'circle',
          source: 'fs-disasters-src',
          paint: {
            'circle-radius': 13,
            'circle-color': ['get', 'color'],
            'circle-opacity': 0.22,
          },
        })
        map.addLayer({
          id: 'fs-disasters-dot',
          type: 'circle',
          source: 'fs-disasters-src',
          paint: {
            'circle-radius': 7,
            'circle-color': ['get', 'color'],
            'circle-stroke-color': '#ffffff',
            'circle-stroke-width': 2,
          },
        })
        map.on('click', 'fs-disasters-dot', (ev: any) => {
          const feat = ev.features?.[0]
          if (!feat || feat.geometry.type !== 'Point') return
          const coords = feat.geometry.coordinates.slice() as [number, number]
          const title = String(feat.properties?.title || '')
          const detail = String(feat.properties?.detail || '')
          new maplibregl.Popup({ closeButton: false, offset: 12 })
            .setLngLat(coords)
            .setHTML(
              `<div style="max-width:220px"><div style="font-family:'Plus Jakarta Sans:Bold',sans-serif;font-weight:700;font-size:14px;color:#191b14;margin-bottom:2px">${title}</div><div style="font-family:'Plus Jakarta Sans:Regular',sans-serif;font-size:12px;color:#5d6157;line-height:17px">${detail}</div></div>`,
            )
            .addTo(map)
        })
      }

      // 6. Crisp Interactive DOM Markers (Origin/You, Destination Pin, Clickable Flood/Landslide Road Pills)
      for (const m of markersRef.current) m.remove()
      markersRef.current = []

      const youEl = document.createElement('div')
      youEl.className = 'flex flex-col items-center pointer-events-none'
      const youDot = document.createElement('div')
      youDot.style.width = '48px'
      youDot.style.height = '48px'
      youDot.style.backgroundImage = `url(${ASSETS.mapYou})`
      youDot.style.backgroundSize = '48px 48px'
      youDot.style.backgroundRepeat = 'no-repeat'
      youEl.appendChild(youDot)
      if (variant === 'home' || variant === 'home-degraded') {
        const youLbl = document.createElement('span')
        youLbl.className =
          "font-['Plus_Jakarta_Sans:SemiBold'] font-semibold text-[13px] leading-[18px] text-[#2563eb] bg-white/85 px-[6px] rounded-full mt-[1px]"
        youLbl.textContent = originPlace
          ? originPlace.label.split('·')[0].trim()
          : lang === 'vi'
            ? 'Bạn'
            : 'You'
        youEl.appendChild(youLbl)
      }
      markersRef.current.push(
        new maplibregl.Marker({ element: youEl, anchor: 'center' }).setLngLat(youCoords).addTo(map),
      )

      const destTarget = destinationPlace || {
        label: 'Biblio',
        lon: 105.8042,
        lat: 21.0016,
      }
      const pinEl = document.createElement('button')
      pinEl.type = 'button'
      pinEl.className = 'flex flex-col items-center bg-transparent border-0 cursor-pointer'
      const pinIcon = document.createElement('div')
      pinIcon.style.width = '36px'
      pinIcon.style.height = '36px'
      pinIcon.style.backgroundImage = `url(${ASSETS.iconPin})`
      pinIcon.style.backgroundSize = '36px 36px'
      pinIcon.style.backgroundRepeat = 'no-repeat'
      const pinText = document.createElement('span')
      pinText.className =
        "font-['Plus_Jakarta_Sans:SemiBold'] font-semibold text-[13px] leading-[19px] text-[#191b14] bg-white/90 px-[7px] rounded-full shadow-sm max-w-[150px] truncate"
      pinText.textContent = destTarget.label.split('·')[0].trim()
      pinEl.appendChild(pinIcon)
      pinEl.appendChild(pinText)
      pinEl.addEventListener('click', (e) => {
        e.stopPropagation()
        onTapDestination?.()
      })
      markersRef.current.push(
        new maplibregl.Marker({ element: pinEl, anchor: 'bottom' })
          .setLngLat([destTarget.lon, destTarget.lat])
          .addTo(map),
      )

      // Interactive Segment Pills on Home Map (Urban Flood, Underpass Flash Flood, Landslide)
      if (showCrowdLayer && (variant === 'home' || variant === 'home-degraded')) {
        for (const seg of segments) {
          const badge = document.createElement('button')
          badge.type = 'button'
          const isLandslide = seg.hazardType === 'landslide'
          const isFlash = seg.hazardType === 'flash-flood'
          badge.className =
            "bg-white rounded-full px-[11px] py-[5px] shadow-[0_6px_16px_rgba(26,28,20,0.16)] border border-[#dfe1d8] font-['Plus_Jakarta_Sans:SemiBold'] font-semibold text-[12px] leading-[18px] text-[#191b14] whitespace-nowrap cursor-pointer flex items-center gap-[6px]"

          const dot = document.createElement('span')
          dot.className = 'inline-block size-[8px] rounded-full shrink-0'
          dot.style.backgroundColor = isLandslide
            ? '#991b1b'
            : isFlash
              ? '#c2410c'
              : seg.riskStatus === 'avoid'
                ? '#2563eb'
                : '#d97706'
          badge.appendChild(dot)

          const labelSpan = document.createElement('span')
          const shortName = seg.name.split('(')[0].trim()
          if (isLandslide) {
            labelSpan.textContent =
              lang === 'vi' ? `Sạt lở · ${shortName}` : `Landslide · ${shortName}`
          } else if (isFlash) {
            labelSpan.textContent =
              lang === 'vi' ? `Lũ quét · ${shortName}` : `Flash flood · ${shortName}`
          } else {
            const depthLbl =
              seg.waterDepth === 'wheel'
                ? lang === 'vi'
                  ? 'Ngang bánh xe'
                  : 'Wheel-deep'
                : lang === 'vi'
                  ? 'Ngang mắt cá'
                  : 'Ankle-deep'
            labelSpan.textContent = `${depthLbl} · ${shortName}`
          }
          badge.appendChild(labelSpan)

          badge.addEventListener('click', (e) => {
            e.stopPropagation()
            onSelectSegment?.(seg)
          })
          markersRef.current.push(
            new maplibregl.Marker({ element: badge, anchor: 'bottom', offset: [0, -10] })
              .setLngLat([seg.centerLon, seg.centerLat])
              .addTo(map),
          )
        }
      }
    }, [
      styleCounter,
      variant,
      lang,
      dataSaver,
      showCrowdLayer,
      originPlace,
      destinationPlace,
      safeRouteCoords,
      avoidedDirectCoords,
      segments,
      reports,
      hazards,
      enabledSources,
      activeRadarFrameIndex,
      onSelectSegment,
      onTapDestination,
      youCoords,
    ])

    return (
      <div className="absolute inset-0 bg-[#ecede6] overflow-hidden">
        <div ref={containerRef} className="absolute inset-0 h-full w-full" />
      </div>
    )
  },
)
