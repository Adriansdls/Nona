import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// WS-F: magic-link (and future OAuth) code exchange. The email link lands here
// with ?code=… → exchange for a session (cookies set by the SSR server client) →
// redirect to ?next (back to the case dashboard, which then links the case).
export async function GET(req: NextRequest) {
  const { searchParams, origin } = new URL(req.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') || '/pt'

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`)
    }
  }
  // bad/expired code → send home with a soft error flag
  return NextResponse.redirect(`${origin}${next}${next.includes('?') ? '&' : '?'}auth_error=1`)
}
