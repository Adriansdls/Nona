/**
 * Internal endpoint for bot-created cases.
 * Accepts JSON with staged photo paths (already in Supabase storage).
 * Protected by X-Internal-Token header.
 */
import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'
import { generateSlug } from '@/lib/slug'
import { sendCaseConfirmation } from '@/lib/email/send'

function checkInternalToken(req: NextRequest): boolean {
  const token = req.headers.get('x-internal-token')
  return !!token && token === process.env['INTERNAL_API_TOKEN']
}

export async function POST(req: NextRequest) {
  if (!checkInternalToken(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = (await req.json()) as Record<string, unknown>

  // Validate required fields
  const required = [
    'type', 'breed', 'sex', 'size', 'primaryColor',
    'lastSeenAt', 'lastSeenMunicipality', 'lastSeenZoneApprox',
    'reporterName', 'reporterEmail',
  ]
  const missing = required.filter((f) => !body[f])
  if (missing.length > 0) {
    return NextResponse.json({ error: `Missing fields: ${missing.join(', ')}` }, { status: 400 })
  }

  const supabase = createServiceClient()

  // Build slug
  const slugInput = {
    type: body['type'] as string,
    dogName: (body['dogName'] as string | undefined) ?? undefined,
    breed: body['breed'] as string,
    lastSeenMunicipality: body['lastSeenMunicipality'] as string,
  }
  const slug = generateSlug(slugInput as Parameters<typeof generateSlug>[0])

  // Encrypt chip number if provided
  let chipNumberEncrypted: string | null = null
  if (body['chipNumber']) {
    const { data: encrypted } = await supabase.rpc('encrypt_chip', {
      plain_text: body['chipNumber'],
      encryption_key: process.env['APP_CHIP_ENCRYPTION_KEY'] ?? '',
    })
    if (encrypted) chipNumberEncrypted = encrypted as string
  }

  // Insert case
  const { data: caseRow, error: caseError } = await supabase
    .from('cases')
    .insert({
      slug,
      type: body['type'],
      dog_name: body['dogName'] ?? null,
      breed: body['breed'],
      sex: body['sex'],
      neutered: body['neutered'] ?? null,
      size: body['size'],
      primary_color: body['primaryColor'],
      secondary_color: body['secondaryColor'] ?? null,
      distinctive_marks: Array.isArray(body['distinctiveMarks']) ? body['distinctiveMarks'] : [],
      age_estimate: body['ageEstimate'] ?? null,
      has_chip: body['hasChip'] ?? null,
      chip_last_3: body['chipLast3'] ?? null,
      chip_number_encrypted: chipNumberEncrypted,
      last_seen_at: body['lastSeenAt'],
      last_seen_municipality: body['lastSeenMunicipality'],
      last_seen_zone_approx: body['lastSeenZoneApprox'],
      description: body['description'] ?? 'Reportado via Telegram.',
      context: body['context'] ?? null,
      suspected_theft: body['suspectedTheft'] ?? false,
      reporter_name: body['reporterName'],
      reporter_email: body['reporterEmail'],
      reporter_phone: body['reporterPhone'] ?? null,
      reporter_contact_public: body['reporterContactPublic'] ?? null,
    })
    .select('id, slug')
    .single()

  if (caseError || !caseRow) {
    console.error('Bot case insert error:', caseError)
    return NextResponse.json({ error: 'Failed to create case' }, { status: 500 })
  }

  // Move staged photos to permanent paths and insert case_images rows
  const stagedPhotos = (body['stagedPhotos'] as string[] | undefined) ?? []
  for (let i = 0; i < stagedPhotos.length; i++) {
    const stagingPath = stagedPhotos[i]
    if (!stagingPath) continue

    const ext = stagingPath.split('.').pop() ?? 'jpg'
    const destPath = `original/${caseRow.id}/${i}-${Date.now()}.${ext}`

    const { error: moveError } = await supabase.storage
      .from('case-images-original')
      .move(stagingPath, destPath)

    if (moveError) {
      console.error('Photo move error:', moveError)
      continue
    }

    const { data: imageRow } = await supabase
      .from('case_images')
      .insert({
        case_id: caseRow.id,
        storage_path_original: destPath,
        is_primary: i === 0,
        image_type: 'referencia',
      })
      .select('id')
      .single()

    if (imageRow) {
      void triggerMLProcessing(caseRow.id, imageRow.id, destPath)
    }
  }

  // Send confirmation email
  try {
    await sendCaseConfirmation({
      to: body['reporterEmail'] as string,
      caseSlug: caseRow.slug,
      reporterName: body['reporterName'] as string,
    })
  } catch (e) {
    console.warn('Email send failed (non-fatal):', e)
  }

  return NextResponse.json({ data: { slug: caseRow.slug, id: caseRow.id } }, { status: 201 })
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
    if (!res.ok) return

    const result = (await res.json()) as {
      embedding: number[]
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

    // Visual match search
    const since = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString()
    const { data: candidates } = await supabase.rpc('search_similar_cases', {
      query_embedding: `[${result.embedding.join(',')}]`,
      exclude_case_id: caseId,
      since,
      limit_count: 20,
    })
    if (candidates?.length) {
      const matches = (candidates as Array<{ case_id: string; score: number }>)
        .filter((c) => c.score > 0.6)
        .map((c) => ({ case_a_id: caseId, case_b_id: c.case_id, similarity_score: c.score, status: 'pendente' }))
      if (matches.length > 0) await supabase.from('visual_matches').insert(matches)
    }
  } catch (e) {
    console.error('ML processing failed:', e)
  }
}
