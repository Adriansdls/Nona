'use client'
import { APIProvider, Map, AdvancedMarker, Pin, Circle } from '@vis.gl/react-google-maps'

const API_KEY = process.env['NEXT_PUBLIC_GOOGLE_MAPS_API_KEY'] ?? ''

const ZONE_HEX: Record<'rose' | 'amber' | 'blue', string> = {
  rose: '#E04F4F',
  amber: '#F59E0B',
  blue: '#6366F1',
}

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
  zones?: Array<{ radius_km: number; color: 'rose' | 'amber' | 'blue' }>
}

export function SearchMap({
  height = 380,
  center,
  lastSeenLabel = 'Última vez visto',
  sightings = [],
  zones = [],
}: SearchMapProps) {
  if (!API_KEY) {
    return (
      <div style={{ width: '100%', height, background: '#F4F0E8', borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'monospace', fontSize: 12, color: '#999' }}>
        mapa indisponível
      </div>
    )
  }

  return (
    <APIProvider apiKey={API_KEY}>
      <Map
        style={{ width: '100%', height }}
        defaultCenter={center}
        defaultZoom={14}
        gestureHandling="cooperative"
        mapId="salvacao-search"
      >
        {/* Zone rings from intel */}
        {zones.map((z, i) => (
          <Circle
            key={i}
            center={center}
            radius={z.radius_km * 1000}
            strokeColor={ZONE_HEX[z.color]}
            strokeOpacity={0.75}
            strokeWeight={2}
            fillColor={ZONE_HEX[z.color]}
            fillOpacity={0.07}
          />
        ))}

        {/* Last-seen pin — rose */}
        <AdvancedMarker position={center} title={lastSeenLabel}>
          <Pin background={ZONE_HEX.rose} glyphColor="white" borderColor="white" />
        </AdvancedMarker>

        {/* Sighting pins — amber */}
        {sightings.map((s, i) => (
          <AdvancedMarker
            key={i}
            position={{ lat: s.lat, lng: s.lng }}
            title={s.sub ? `${s.label} · ${s.sub}` : s.label}
          >
            <Pin
              background={s.fresh ? ZONE_HEX.amber : '#D97706'}
              glyphColor="white"
              borderColor="white"
            />
          </AdvancedMarker>
        ))}
      </Map>
    </APIProvider>
  )
}
