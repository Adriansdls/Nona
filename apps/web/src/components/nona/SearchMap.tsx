import { useEffect, useRef } from 'react'
import type L from 'leaflet'

export interface SearchMapProps {
  height?: number
  center: { lat: number; lng: number }
  lastSeenLabel?: string
  sightings?: Array<{
    lat: number
    lng: number
    label: string
    sub?: string
    fresh?: boolean
  }>
}

function pinHtml(color: string, pulse: boolean): string {
  const ring = pulse
    ? `<span style="position:absolute;inset:-8px;border-radius:50%;border:2px solid ${color};animation:nn-ping 2s cubic-bezier(0,0,.2,1) infinite"></span>`
    : ''
  return (
    `<div style="display:flex;flex-direction:column;align-items:center;gap:4px">` +
    `<div style="position:relative;margin-top:4px">${ring}` +
    `<svg width="24" height="28" viewBox="0 0 28 32">` +
    `<path d="M14 0 A 12 12 0 0 1 26 12 C 26 22 14 32 14 32 C 14 32 2 22 2 12 A 12 12 0 0 1 14 0 Z" fill="${color}" stroke="white" stroke-width="2"/>` +
    `<circle cx="14" cy="12" r="4" fill="white"/>` +
    `</svg></div></div>`
  )
}

export function SearchMap({
  height = 380,
  center,
  lastSeenLabel = 'Última vez visto',
  sightings = [],
}: SearchMapProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<L.Map | null>(null)

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return

    // Inject leaflet CSS once
    if (!document.getElementById('leaflet-css')) {
      const link = document.createElement('link')
      link.id = 'leaflet-css'
      link.rel = 'stylesheet'
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'
      document.head.appendChild(link)
    }

    // Dynamic import keeps leaflet off the server bundle
    import('leaflet').then((Leaflet) => {
      const L = Leaflet.default

      const map = L.map(containerRef.current!, {
        center: [center.lat, center.lng],
        zoom: 14,
        zoomControl: true,
        attributionControl: true,
      })

      L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 19,
      }).addTo(map)

      const originIcon = L.divIcon({
        className: '',
        html: pinHtml('#E04F4F', true),
        iconSize: [24, 36],
        iconAnchor: [12, 36],
        popupAnchor: [0, -38],
      })
      L.marker([center.lat, center.lng], { icon: originIcon })
        .addTo(map)
        .bindPopup(`<b>${lastSeenLabel}</b>`)

      sightings.forEach((s) => {
        const sightIcon = L.divIcon({
          className: '',
          html: pinHtml(s.fresh ? '#F59E0B' : '#D97706', s.fresh ?? false),
          iconSize: [24, 36],
          iconAnchor: [12, 36],
          popupAnchor: [0, -38],
        })
        L.marker([s.lat, s.lng], { icon: sightIcon })
          .addTo(map)
          .bindPopup(`<b>${s.label}</b>${s.sub ? `<br><small style="color:#666">${s.sub}</small>` : ''}`)
      })

      if (sightings.length > 0) {
        const bounds = L.latLngBounds([
          [center.lat, center.lng],
          ...sightings.map((s) => [s.lat, s.lng] as [number, number]),
        ])
        map.fitBounds(bounds, { padding: [48, 48] })
      }

      mapRef.current = map
    })

    return () => {
      mapRef.current?.remove()
      mapRef.current = null
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div
      ref={containerRef}
      style={{ width: '100%', height, background: '#F4F0E8' }}
    />
  )
}
