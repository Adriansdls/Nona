import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'
import { caseCreateSchema } from '@/lib/validation/case.schema'
import { generateSlug } from '@/lib/slug'
import { sendCaseConfirmation } from '@/lib/email/send'
import { stripPrivateFields } from '@/lib/privacy'
import type { CaseCreateInput } from '@salvacao/types'

/** List cases — used by bot search and public case list. */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const type = searchParams.get('type')
  const municipality = searchParams.get('municipality')
  const status = searchParams.get('status') ?? 'ativo'
  const limit = Math.min(parseInt(searchParams.get('limit') ?? '10', 10), 50)

  const supabase = createServiceClient()
  let query = supabase
    .from('cases')
    .select(
      'id, slug, type, status, dog_name, breed, sex, size, primary_color, last_seen_municipality, created_at, reporter_contact_public, case_images(id, public_url, is_primary)',
    )
    .eq('status', status)
    .eq('sensitivity', 'publico')
    .order('created_at', { ascending: false })
    .limit(limit)

  if (type) query = query.eq('type', type)
  if (municipality) query = query.eq('last_seen_municipality', municipality)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const safe = (data ?? []).map((row) => stripPrivateFields(row as Record<string, unknown>))
  return NextResponse.json({ data: safe })
}

export async function POST(req: NextRequest) {
  const formData = await req.formData()
  const raw = Object.fromEntries(formData.entries())

  // Parse distinctiveMarks as array from comma-separated string
  if (typeof raw['distinctiveMarks'] === 'string') {
    raw['distinctiveMarks'] = raw['distinctiveMarks'].split(',').filter(Boolean).join(',')
  }

  const parsed = caseCreateSchema.safeParse(raw)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }
  const data = parsed.data

  const supabase = createServiceClient()
  const slug = generateSlug(data as unknown as CaseCreateInput)

  // Encrypt chip number if provided
  let chipNumberEncrypted: string | null = null
  if (data.chipNumber) {
    const { data: encrypted, error: encErr } = await supabase.rpc('encrypt_chip', {
      plain_text: data.chipNumber,
      encryption_key: process.env['APP_CHIP_ENCRYPTION_KEY'] ?? '',
    })
    if (!encErr) chipNumberEncrypted = encrypted as string
  }

  // Insert case
  const { data: caseRow, error: caseError } = await supabase
    .from('cases')
    .insert({
      slug,
      type: data.type,
      dog_name: data.dogName ?? null,
      breed: data.breed,
      sex: data.sex,
      neutered: data.neutered ?? null,
      size: data.size,
      primary_color: data.primaryColor,
      secondary_color: data.secondaryColor ?? null,
      distinctive_marks: data.distinctiveMarks
        ? data.distinctiveMarks.split(',').filter(Boolean)
        : [],
      age_estimate: data.ageEstimate ?? null,
      has_chip: data.hasChip ?? null,
      chip_last_3: data.chipLast3 ?? null,
      chip_number_encrypted: chipNumberEncrypted,
      last_seen_at: data.lastSeenAt,
      last_seen_municipality: data.lastSeenMunicipality,
      last_seen_zone_approx: data.lastSeenZoneApprox,
      description: data.description,
      context: data.context ?? null,
      reporter_name: data.reporterName,
      reporter_email: data.reporterEmail,
      reporter_phone: data.reporterPhone ?? null,
      reporter_contact_public: data.reporterContactPublic ?? null,
    })
    .select('id, slug')
    .single()

  if (caseError) {
    console.error('Case insert error:', caseError)
    return NextResponse.json({ error: 'Failed to create case' }, { status: 500 })
  }

  // Upload images and trigger ML processing
  const photos = formData.getAll('photos') as File[]
  for (let i = 0; i < photos.length; i++) {
    const file = photos[i]
    if (!file || file.size === 0) continue

    const ext = file.name.split('.').pop() ?? 'jpg'
    const storagePath = `original/${caseRow.id}/${i}-${Date.now()}.${ext}`

    const { error: uploadError } = await supabase.storage
      .from('case-images-original')
      .upload(storagePath, await file.arrayBuffer(), { contentType: file.type })

    if (uploadError) {
      console.error('Upload error:', uploadError)
      continue
    }

    const { data: imageRow } = await supabase
      .from('case_images')
      .insert({
        case_id: caseRow.id,
        storage_path_original: storagePath,
        is_primary: i === 0,
        image_type: 'referencia',
      })
      .select('id')
      .single()

    if (imageRow) {
      // Fire-and-forget — does not block the response
      void triggerMLProcessing(caseRow.id, imageRow.id, storagePath)
    }
  }

  // Send confirmation email
  try {
    await sendCaseConfirmation({
      to: data.reporterEmail,
      caseSlug: caseRow.slug,
      reporterName: data.reporterName,
    })
  } catch (e) {
    console.warn('Email send failed (non-fatal):', e)
  }

  return NextResponse.json({ data: { slug: caseRow.slug } }, { status: 201 })
}

async function triggerMLProcessing(caseId: string, imageId: string, storagePath: string) {
  const mlUrl = process.env['ML_SERVICE_URL']
  if (!mlUrl) return

  try {
    const res = await fetch(`${mlUrl}/process-image`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ storage_path: storagePath, case_image_id: imageId }),
      signal: AbortSignal.timeout(60_000),
    })
    if (!res.ok) {
      console.error('ML service error:', res.status)
      return
    }

    const result = (await res.json()) as {
      embedding: number[]
      bbox: Record<string, number>
      quality_score: number
      public_path: string
    }

    const supabase = createServiceClient()

    const publicUrl = supabase.storage
      .from('case-images-public')
      .getPublicUrl(result.public_path).data.publicUrl

    await supabase.from('case_images').update({
      storage_path_public: result.public_path,
      public_url: publicUrl,
      embedding: result.embedding,
      quality_score: result.quality_score,
      processed_at: new Date().toISOString(),
    }).eq('id', imageId)

    await runVisualMatchSearch(caseId, result.embedding)
  } catch (e) {
    console.error('ML processing failed (non-fatal):', e)
  }
}

async function runVisualMatchSearch(caseId: string, embedding: number[]) {
  const supabase = createServiceClient()
  const since = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString()
  const embeddingStr = `[${embedding.join(',')}]`

  const { data: candidates } = await supabase.rpc('search_similar_cases', {
    query_embedding: embeddingStr,
    exclude_case_id: caseId,
    since,
    limit_count: 20,
  })

  if (!candidates?.length) return

  const matches = (candidates as Array<{ case_id: string; score: number }>)
    .filter((c) => c.score > 0.6)
    .map((c) => ({
      case_a_id: caseId,
      case_b_id: c.case_id,
      similarity_score: c.score,
      status: 'pendente',
    }))

  if (matches.length > 0) {
    await supabase.from('visual_matches').insert(matches)
  }
}
