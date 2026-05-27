import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'
import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic()

export interface IntelZone {
  title: string
  radius: string
  color: 'rose' | 'amber' | 'blue'
  instruction: string
  checkpoints: string[]
}

export interface IntelHazard {
  label: string
  note: string
  severity: 'critical' | 'high' | 'medium'
}

export interface SearchIntel {
  brief: string
  zones: IntelZone[]
  hazards: IntelHazard[]
  movement: string | null
}

const FALLBACK: SearchIntel = {
  brief: 'Cão perdido activo. Iniciar busca sistemática em círculos a partir do último ponto conhecido.',
  zones: [
    {
      title: 'Zona quente',
      radius: '0 – 1 km',
      color: 'rose',
      instruction: 'Cães perdidos permanecem tipicamente próximos do ponto inicial nas primeiras horas. Busca activa com voz baixa e familiar.',
      checkpoints: ['Último ponto visto', 'Arredores imediatos'],
    },
    {
      title: 'Zona morna',
      radius: '1 – 3 km',
      color: 'amber',
      instruction: 'Expandir busca para parques, zonas de sombra e água.',
      checkpoints: ['Parques', 'Estações', 'Mercados'],
    },
  ],
  hazards: [
    { label: 'Estradas principais', note: 'trânsito intenso', severity: 'high' },
    { label: 'Linha do comboio', note: 'verificar mapa', severity: 'high' },
  ],
  movement: null,
}

function buildPrompt(params: {
  dogName: string | null
  breed: string
  sex: string
  size: string
  primaryColor: string
  secondaryColor: string | null
  ageEstimate: string | null
  type: string
  lastSeenAt: string
  lastSeenMunicipality: string
  lastSeenZoneApprox: string
  hoursElapsed: number
  description: string
  sightings: Array<{ seenAt: string; zoneApprox: string; municipality: string; direction: string | null; description: string | null; hoursAgo: number }>
}): string {
  const name = params.dogName ?? params.breed
  const typePt = params.type === 'perdido' ? 'perdido' : 'encontrado'
  const hoursStr = params.hoursElapsed < 1 ? 'menos de 1 hora' : `${Math.round(params.hoursElapsed)} horas`

  const sightingsBlock = params.sightings.length > 0
    ? `\nAVISTAMENTOS CONFIRMADOS (${params.sightings.length}):\n` + params.sightings.map((s, i) =>
        `${i + 1}. há ${s.hoursAgo < 1 ? 'menos de 1h' : `${Math.round(s.hoursAgo)}h`} — ${s.zoneApprox}, ${s.municipality}${s.direction ? ` (direção: ${s.direction})` : ''}${s.description ? ` — "${s.description}"` : ''}`
      ).join('\n')
    : '\nSem avistamentos confirmados ainda.'

  return `És um coordenador especialista em busca de cães desaparecidos no Algarve, Portugal. Tens profundo conhecimento do terreno algarvio: poços abandonados em quintas, EN125, IC1/A22, linha ferroviária do Sul, ribeiras, eucaliptais, serras, urbanizações turísticas, pomares de laranjeiras e amendoeiras.

CASO:
- Cão ${typePt}: ${name}
- Raça: ${params.breed} | Tamanho: ${params.size} | Sexo: ${params.sex}
- Cor: ${params.primaryColor}${params.secondaryColor ? ` + ${params.secondaryColor}` : ''}${params.ageEstimate ? ` | Idade estimada: ${params.ageEstimate}` : ''}
- Município: ${params.lastSeenMunicipality}
- Zona: ${params.lastSeenZoneApprox}
- Há quanto tempo: ${hoursStr}
- Contexto: ${params.description || 'sem informação adicional'}
${sightingsBlock}

Conhecimento comportamental chave por raça/tamanho:
- Cães pequenos (< 10kg): tendem a esconder-se, raramente se afastam > 1,5km nas primeiras 24h
- Cães grandes: podem correr até 5km+; a maioria regressa a zonas com cheiros familiares
- Podencos/galgo: velocidade alta, podem cobrir 10+ km, procurar zonas abertas
- Terriers: instinto de terra, podem entrar em buracos/poços
- Comportamento sob stress: fuga > 2km em linha reta frequente na primeira hora; depois circular
- Água e sombra são magnetos especialmente no Verão algarvio

Responde APENAS com JSON válido (sem texto extra, sem markdown, sem blocos de código), seguindo EXACTAMENTE este schema:

{
  "brief": "2-3 frases em português: avaliação da situação + acção mais urgente agora",
  "zones": [
    {
      "title": "Zona quente",
      "radius": "0 – 1 km",
      "color": "rose",
      "instruction": "instrução concreta e específica para esta zona baseada no terreno e raça",
      "checkpoints": ["local específico 1", "local específico 2", "local específico 3"]
    },
    {
      "title": "Zona morna",
      "radius": "1 – 3 km",
      "color": "amber",
      "instruction": "instrução concreta para zona mais ampla",
      "checkpoints": ["local específico 1", "local específico 2"]
    }
  ],
  "hazards": [
    { "label": "nome do risco", "note": "detalhe curto", "severity": "critical|high|medium" }
  ],
  "movement": "análise de padrão de movimento baseada em avistamentos (null se sem avistamentos)"
}

Checkpoints devem ser ESPECÍFICOS para ${params.lastSeenMunicipality}/${params.lastSeenZoneApprox} — ruas reais, pontos de referência, zonas conhecidas. Hazards devem reflectir riscos REAIS do Algarve (poços em quintas agrícolas, estradas nacionais, caminho-de-ferro, ribeiras). Sé específico e útil — vidas dependem disso.`
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params
  const supabase = createServiceClient()

  const { data: caseRow } = await supabase
    .from('cases')
    .select('id, type, dog_name, breed, sex, size, primary_color, secondary_color, age_estimate, last_seen_at, last_seen_municipality, last_seen_zone_approx, description')
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

  const hoursElapsed = (Date.now() - new Date(caseRow.last_seen_at as string).getTime()) / 3600000

  const sightingsForPrompt = (sightings ?? []).map((s) => ({
    seenAt: s.seen_at as string,
    zoneApprox: s.zone_approx as string,
    municipality: s.municipality as string,
    direction: s.direction as string | null,
    description: s.description as string | null,
    hoursAgo: (Date.now() - new Date(s.seen_at as string).getTime()) / 3600000,
  }))

  const prompt = buildPrompt({
    dogName: caseRow.dog_name as string | null,
    breed: caseRow.breed as string,
    sex: caseRow.sex as string,
    size: caseRow.size as string,
    primaryColor: caseRow.primary_color as string,
    secondaryColor: caseRow.secondary_color as string | null,
    ageEstimate: caseRow.age_estimate as string | null,
    type: caseRow.type as string,
    lastSeenAt: caseRow.last_seen_at as string,
    lastSeenMunicipality: caseRow.last_seen_municipality as string,
    lastSeenZoneApprox: caseRow.last_seen_zone_approx as string,
    hoursElapsed,
    description: caseRow.description as string,
    sightings: sightingsForPrompt,
  })

  try {
    const message = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1024,
      messages: [{ role: 'user', content: prompt }],
    })

    const raw = message.content[0]?.type === 'text' ? message.content[0].text.trim() : ''
    const intel = JSON.parse(raw) as SearchIntel

    return NextResponse.json({ data: intel }, {
      headers: { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=60' },
    })
  } catch (e) {
    console.error('Intel generation failed:', e)
    return NextResponse.json({ data: FALLBACK })
  }
}
