import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'
import { createClient as createServerAuthClient } from '@/lib/supabase/server'

// WS-F: link a token-based case to the now-authenticated owner. Caller must hold
// the owner_token (in the URL) AND have a session — then cases.owner_user_id is
// set so the case appears under their account ("os cães que procuras") and the
// magic-link can never be lost. Idempotent. Token magic-link keeps working too.
export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params

  // 1) must be authenticated (session from the SSR cookies)
  const authClient = await createServerAuthClient()
  const { data: { user } } = await authClient.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'not authenticated' }, { status: 401 })
  }

  // 2) must hold the token → owns this case
  const supabase = createServiceClient()
  const { data: caseRow } = await supabase
    .from('cases')
    .select('id, dog_name, owner_user_id')
    .eq('owner_token', token)
    .single()
  if (!caseRow) {
    return NextResponse.json({ error: 'case not found' }, { status: 404 })
  }

  // 3) idempotent link
  if (caseRow.owner_user_id && caseRow.owner_user_id !== user.id) {
    return NextResponse.json({ error: 'already linked to another account' }, { status: 409 })
  }
  if (!caseRow.owner_user_id) {
    await supabase.from('cases').update({ owner_user_id: user.id }).eq('id', caseRow.id as string)
  }

  return NextResponse.json({ ok: true, dogName: caseRow.dog_name ?? null })
}
