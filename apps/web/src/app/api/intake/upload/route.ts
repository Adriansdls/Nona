import { NextRequest, NextResponse } from 'next/server'
import { randomBytes } from 'crypto'
import { createServiceClient } from '@/lib/supabase/service'

// Web intake image upload → staging. Returns the storage path; the intake chat
// passes it back in the stream POST so create_case attaches it + triggers ML.
// Mirrors the bot's staging pattern (case-images-original/staging/...).

const STAGING_BUCKET = 'case-images-original'
const MAX_BYTES = 12 * 1024 * 1024 // 12MB

export async function POST(req: NextRequest) {
  const form = await req.formData()
  const file = form.get('photo')
  if (!(file instanceof File) || file.size === 0) {
    return NextResponse.json({ error: 'photo required' }, { status: 400 })
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: 'photo too large (max 12MB)' }, { status: 413 })
  }
  if (!file.type.startsWith('image/')) {
    return NextResponse.json({ error: 'must be an image' }, { status: 415 })
  }

  const ext = (file.name.split('.').pop() || 'jpg').toLowerCase().replace(/[^a-z0-9]/g, '') || 'jpg'
  const path = `staging/web/${randomBytes(12).toString('hex')}.${ext}`

  const supabase = createServiceClient()
  const { error } = await supabase.storage
    .from(STAGING_BUCKET)
    .upload(path, await file.arrayBuffer(), { contentType: file.type, upsert: true })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  return NextResponse.json({ path })
}
