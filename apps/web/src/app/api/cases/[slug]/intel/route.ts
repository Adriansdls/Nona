import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'
import { MUNICIPALITY_CENTROIDS } from '@/lib/geo/geocode'

// ─── Shared types (imported by CasePageClient) ────────────────────────────

export interface EvidenceRef {
  source: string
  url?: string | null
  detail: string
}

export interface IntelZone {
  title: string
  radius_km: number
  color: 'rose' | 'amber' | 'blue'
  instruction: string
  checkpoints: string[]
  evidence: EvidenceRef[]
}

export interface IntelHazard {
  label: string
  note: string
  severity: 'critical' | 'high' | 'medium'
  evidence: EvidenceRef
}

export interface MovementAnalysis {
  sightings_used: number
  direction: string
  speed_estimate: string | null
  pattern: string
  evidence: EvidenceRef[]
}

export interface SearchIntel {
  breed_category: string
  behavioral_phase: 'panic' | 'survival' | 'recovery'
  confidence: 'high' | 'medium' | 'low'
  brief: string
  brief_sources: EvidenceRef[]
  zones: IntelZone[]
  hazards: IntelHazard[]
  movement: MovementAnalysis | null
  warnings: string[]
}

export interface InsufficientData {
  reason: string
  what_was_tried: string[]
  what_was_missing: string[]
  partial_context: string | null
  breed_category: string | null
}

export type IntelResult = SearchIntel | InsufficientData

function isInsufficientData(r: IntelResult): r is InsufficientData {
  return 'what_was_tried' in r
}

// ─── Fallback (shown when service unavailable) ────────────────────────────

const FALLBACK: SearchIntel = {
  breed_category: 'unknown',
  behavioral_phase: 'panic',
  confidence: 'low',
  brief: '',
  brief_sources: [],
  zones: [
    {
      title: 'Zona quente',
      radius_km: 1,
      color: 'rose',
      instruction: 'Cães perdidos permanecem tipicamente próximos do ponto inicial nas primeiras horas.',
      checkpoints: ['Último ponto visto', 'Arredores imediatos'],
      evidence: [],
    },
    {
      title: 'Zona morna',
      radius_km: 3,
      color: 'amber',
      instruction: 'Expandir busca para parques, zonas de sombra e água.',
      checkpoints: ['Parques', 'Estações', 'Mercados'],
      evidence: [],
    },
  ],
  hazards: [],
  movement: null,
  warnings: [],
}

// ─── Case-aware fallback ──────────────────────────────────────────────────
// Shown when the Python intel service is unavailable. NOT generic boilerplate:
// it reads the case (breed/temperament, hours elapsed, theft, municipality) and
// writes copy specific to THIS dog in THESE circumstances.

function inferBreedCategory(breed: string): 'galgo' | 'podenco' | 'caça' | 'pequeno' | 'comum' {
  const b = breed.toLowerCase()
  if (/galg|greyhound|podengo p|whippet/.test(b)) return 'galgo'
  if (/podeng|podenco/.test(b)) return 'podenco'
  if (/perdigueiro|pointer|braco|caç|hound|beagle/.test(b)) return 'caça'
  if (/yorks|chihuahua|caniche|toy|anão|bichon|malt/.test(b)) return 'pequeno'
  return 'comum'
}

function buildFallbackIntel(args: {
  breed: string; dogName: string; municipality: string
  hoursElapsed: number; suspectedTheft: boolean
}): SearchIntel {
  const cat = inferBreedCategory(args.breed)
  const h = args.hoursElapsed
  const fearful = cat === 'galgo' || cat === 'podenco'
  const phase: 'panic' | 'survival' | 'recovery' =
    (fearful || h >= 24) ? (h >= 168 ? 'recovery' : 'survival') : 'panic'
  const dog = args.dogName
  const muni = args.municipality

  // Hot zone — radius + copy by breed temperament + elapsed time
  let hotRadius = 1, hotMsg: string
  if (suspectedThefty(args.suspectedTheft)) {
    hotRadius = 3
    hotMsg = `Há suspeita de furto — ${dog} pode ter sido transportado de carro. Verifique também estradas de saída e áreas de serviço, não só ${muni}.`
  } else if (cat === 'galgo') {
    hotRadius = 2
    hotMsg = `Galgos assustados entram em modo de fuga e percorrem grandes distâncias em linha — siga vales e bermas, sem o perseguir nem chamar (a aproximação afasta-o).`
  } else if (cat === 'podenco' || cat === 'caça') {
    hotRadius = 2
    hotMsg = `Cães de caça seguem rastos por corredores de mato. ${dog} provavelmente desceu por uma linha de água ou ravina próxima do ponto de fuga.`
  } else if (cat === 'pequeno') {
    hotRadius = 0.8
    hotMsg = `Cães pequenos escondem-se perto — sob carros, em quintais, valas e arbustos a poucos metros. Procure baixo e em silêncio à volta do ponto onde desapareceu.`
  } else {
    hotMsg = h < 6
      ? `Nas primeiras horas, ${dog} está quase de certeza a poucos minutos do ponto onde desapareceu. Concentre a busca aí.`
      : `${dog} tende a manter-se na zona conhecida. Refaça a busca à volta do ponto de fuga, sobretudo ao amanhecer e ao anoitecer.`
  }

  const warmMsg = fearful
    ? `Se não houver sinais na zona quente, alargue para corredores de mato, ribeiras e fontes de água — ${dog} evita ruas movimentadas e procura abrigo.`
    : `Alargue a parques, zonas de sombra e água em ${muni}, e avise comércio e paragens onde passa gente.`

  return {
    breed_category: cat,
    behavioral_phase: phase,
    confidence: 'low',
    brief: '',
    brief_sources: [],
    zones: [
      { title: 'Zona quente', radius_km: hotRadius, color: 'rose', instruction: hotMsg, checkpoints: ['Ponto de fuga', 'Bermas e valas', 'Quintais próximos'], evidence: [] },
      { title: 'Zona morna', radius_km: fearful ? 5 : 3, color: 'amber', instruction: warmMsg, checkpoints: fearful ? ['Ribeiras', 'Corredores de mato', 'Fontes de água'] : ['Parques', 'Paragens', 'Comércio'], evidence: [] },
    ],
    hazards: [],
    movement: null,
    warnings: fearful ? ['Não persiga nem chame este cão — a convergência de pessoas pode afastá-lo para longe ou para uma estrada.'] : [],
  }
}

function suspectedThefty(v: unknown): boolean { return v === true }

// ─── Coord parser ─────────────────────────────────────────────────────────

function parsePoint(raw: string | null | undefined): { lat: number; lng: number } | null {
  if (!raw) return null
  const m = raw.match(/\(([^,]+),([^)]+)\)/)
  if (!m) return null
  // PostGIS stores as (lng,lat)
  return { lng: parseFloat(m[1]!), lat: parseFloat(m[2]!) }
}

// ─── Route ────────────────────────────────────────────────────────────────

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params
  const supabase = createServiceClient()

  const { data: caseRow } = await supabase
    .from('cases')
    .select('id, type, dog_name, breed, sex, size, primary_color, secondary_color, age_estimate, last_seen_at, last_seen_municipality, last_seen_zone_approx, last_seen_coords_approx, description, suspected_theft')
    .eq('slug', slug)
    .eq('sensitivity', 'publico')
    .single()

  if (!caseRow) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const { data: sightings } = await supabase
    .from('sightings')
    .select('seen_at, zone_approx, municipality, direction, description')
    .eq('case_id', caseRow.id)
    .eq('is_public', true)
    .order('seen_at', { ascending: false })
    .limit(10)

  const rawCoords = parsePoint(caseRow.last_seen_coords_approx as string | null)
  const coords =
    rawCoords ??
    MUNICIPALITY_CENTROIDS[caseRow.last_seen_municipality as string] ??
    { lat: 37.0194, lng: -7.9304 }
  const coordQuality = rawCoords ? 'geocoded' : 'centroid_fallback'

  const hoursElapsed = (Date.now() - new Date(caseRow.last_seen_at as string).getTime()) / 3600000

  const intelUrl = process.env['INTEL_SERVICE_URL']
  const internalToken = process.env['INTERNAL_API_TOKEN']

  if (intelUrl && internalToken) {
    try {
      const body = {
        case_id: caseRow.id,
        slug,
        breed: caseRow.breed,
        size: caseRow.size,
        type: caseRow.type,
        suspected_theft: (caseRow as Record<string, unknown>).suspected_theft ?? false,
        last_seen_at: caseRow.last_seen_at,
        lat: coords.lat,
        lng: coords.lng,
        municipality: caseRow.last_seen_municipality,
        zone_approx: caseRow.last_seen_zone_approx,
        description: caseRow.description,
        hours_elapsed: hoursElapsed,
        coord_quality: coordQuality,
        sightings: (sightings ?? []).map((s) => ({
          lat: coords.lat,
          lng: coords.lng,
          zone: s.zone_approx,
          seen_at: s.seen_at,
          direction: s.direction ?? null,
          description: s.description ?? null,
          hours_ago: (Date.now() - new Date(s.seen_at as string).getTime()) / 3600000,
          municipality: s.municipality,
        })),
      }

      const res = await fetch(`${intelUrl}/intel`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${internalToken}`,
        },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(35_000),
      })

      if (res.ok) {
        const payload = await res.json() as { data: IntelResult }
        return NextResponse.json(payload, {
          headers: { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=60' },
        })
      }
    } catch (e) {
      console.error('Intel service error:', e)
    }
  }

  return NextResponse.json({
    data: buildFallbackIntel({
      breed: (caseRow.breed as string) ?? '',
      dogName: (caseRow.dog_name as string | null) ?? 'o cão',
      municipality: (caseRow.last_seen_municipality as string) ?? 'Algarve',
      hoursElapsed,
      suspectedTheft: (caseRow as Record<string, unknown>).suspected_theft === true,
    }),
  })
}
