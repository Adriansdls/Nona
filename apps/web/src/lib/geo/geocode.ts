export const MUNICIPALITY_CENTROIDS: Record<string, { lat: number; lng: number }> = {
  'Faro': { lat: 37.0194, lng: -7.9304 },
  'Loulé': { lat: 37.1392, lng: -8.0243 },
  'Albufeira': { lat: 37.0896, lng: -8.2369 },
  'Portimão': { lat: 37.1362, lng: -8.5377 },
  'Lagos': { lat: 37.1019, lng: -8.6728 },
  'Silves': { lat: 37.1897, lng: -8.4384 },
  'Olhão': { lat: 37.0277, lng: -7.8413 },
  'Tavira': { lat: 37.1249, lng: -7.6505 },
  'Vila Real de Santo António': { lat: 37.1948, lng: -7.4133 },
  'Castro Marim': { lat: 37.2189, lng: -7.4432 },
  'Alcoutim': { lat: 37.4736, lng: -7.4705 },
  'São Brás de Alportel': { lat: 37.1562, lng: -7.8915 },
  'Monchique': { lat: 37.3183, lng: -8.5601 },
  'Aljezur': { lat: 37.3188, lng: -8.8003 },
  'Vila do Bispo': { lat: 37.0819, lng: -8.9127 },
  'Lagoa': { lat: 37.1382, lng: -8.4603 },
}

interface NominatimResult {
  lat: string
  lon: string
}

export async function geocodeZone(
  zone: string,
  municipality: string,
): Promise<{ lat: number; lng: number } | null> {
  try {
    const q = encodeURIComponent(`${zone}, ${municipality}, Algarve, Portugal`)
    const url = `https://nominatim.openstreetmap.org/search?q=${q}&format=json&limit=1&viewbox=-8.9,37.5,-7.2,36.9&bounded=1`
    const res = await fetch(url, {
      headers: { 'User-Agent': 'SalvaCao/1.0 (info@salvacao.pt)' },
      signal: AbortSignal.timeout(5_000),
    })
    if (!res.ok) throw new Error(`Nominatim ${res.status}`)
    const results = (await res.json()) as NominatimResult[]
    if (results.length > 0 && results[0]) {
      return { lat: parseFloat(results[0].lat), lng: parseFloat(results[0].lon) }
    }
  } catch {
    // fall through to centroid
  }

  return MUNICIPALITY_CENTROIDS[municipality] ?? null
}
