import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'

/**
 * Public, SANITIZED live activity for a case page. Powers the "O que está a
 * acontecer" feed. NEVER exposes raw agent internals, contacts, or owner data:
 * internal tool names are mapped to safe community vocabulary, and only public
 * sightings + a whitelist of agent actions are surfaced.
 */

export interface ActivityEvent {
  t: string                  // relative label, e.g. "há 12s"
  kind: 'sighting' | 'share' | 'tool' | 'visit'
  label: string
  detail?: string
  fresh?: boolean
}

export interface ActivityResponse {
  events: ActivityEvent[]
  counts: { sightings: number; observers: number; zone: string | null }
}

function rel(iso: string): string {
  const s = Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 1000))
  if (s < 60) return `há ${s}s`
  const m = Math.floor(s / 60)
  if (m < 60) return `há ${m} min`
  const h = Math.floor(m / 60)
  if (h < 24) return `há ${h}h`
  return `há ${Math.floor(h / 24)}d`
}

// Map an internal agent (tool, action) to a safe, public-facing event — or null
// to hide it entirely. We never leak contact discovery, raw tool names, or notes.
function sanitizeAgentEvent(tool: string | null, action: string | null, outcome: string | null): Pick<ActivityEvent, 'kind' | 'label' | 'detail'> | null {
  const t = (tool ?? '').toLowerCase()
  const a = (action ?? '').toLowerCase()
  if (t === 'post_to_channel' || a.includes('channel') || a.includes('broadcast'))
    return { kind: 'share', label: 'Rede da comunidade avisada', detail: 'grupos locais' }
  if (t === 'request_volunteer_alert' || a.includes('volunteer'))
    return { kind: 'tool', label: 'Observadores próximos alertados' }
  if (t === 'notify_canil' || t === 'notify_vet' || a.includes('canil') || a.includes('vet'))
    return { kind: 'tool', label: 'Canis e veterinários avisados' }
  if (t === 'run_visual_match' || a.includes('visual') || a.includes('match'))
    return { kind: 'tool', label: 'Nova verificação visual', detail: 'a cruzar fotos de cães encontrados' }
  if (t === 'expand_shelter_radius' || a.includes('radius') || a.includes('expand'))
    return { kind: 'tool', label: 'Raio de busca alargado' }
  if (a.includes('case_created') || a === 'case_assessment_updated' || t === 'update_case_assessment')
    return null // internal bookkeeping — not public-interesting
  return null
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const db = createServiceClient()

  const { data: caseRow } = await db
    .from('cases')
    .select('id, last_seen_zone_approx, created_at')
    .eq('slug', slug)
    .eq('sensitivity', 'publico')
    .maybeSingle()

  if (!caseRow) {
    return NextResponse.json({ events: [], counts: { sightings: 0, observers: 0, zone: null } } satisfies ActivityResponse)
  }

  const [sightingsRes, agentRes, sightCountRes] = await Promise.all([
    db.from('sightings').select('zone_approx, description, seen_at, created_at')
      .eq('case_id', caseRow.id).eq('is_public', true)
      .order('created_at', { ascending: false }).limit(8),
    db.from('case_agent_events').select('tool, action, outcome, created_at')
      .eq('case_id', caseRow.id)
      .order('created_at', { ascending: false }).limit(25),
    db.from('sightings').select('id', { count: 'exact', head: true })
      .eq('case_id', caseRow.id).eq('is_public', true),
  ])

  const events: ActivityEvent[] = []

  for (const s of sightingsRes.data ?? []) {
    events.push({
      t: rel(s.created_at ?? s.seen_at),
      kind: 'sighting',
      label: 'Avistamento confirmado',
      detail: `${s.zone_approx}${s.description ? ' · ' + String(s.description).slice(0, 60) : ''}`,
      fresh: Date.now() - new Date(s.created_at ?? s.seen_at).getTime() < 3600000,
    })
  }

  for (const e of agentRes.data ?? []) {
    const safe = sanitizeAgentEvent(e.tool, e.action, e.outcome)
    if (safe) events.push({ t: rel(e.created_at), ...safe })
  }

  // Sightings first (most relevant), then agent events; capped.
  const trimmed = events.slice(0, 12)

  // "Caso criado" anchor at the bottom.
  trimmed.push({ t: rel(caseRow.created_at), kind: 'tool', label: 'Caso aberto', detail: 'a Nona começou a trabalhar' })

  return NextResponse.json({
    events: trimmed,
    counts: {
      sightings: sightCountRes.count ?? 0,
      observers: 0, // populated once the observer registry is wired to cases
      zone: caseRow.last_seen_zone_approx ?? null,
    },
  } satisfies ActivityResponse)
}
