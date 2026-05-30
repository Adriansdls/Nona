import createIntlMiddleware from 'next-intl/middleware'
import { type NextRequest, NextResponse } from 'next/server'
import { routing } from './i18n/routing'
import { updateSession } from './lib/supabase/middleware'
import { createServerClient } from '@supabase/ssr'

const intlMiddleware = createIntlMiddleware(routing)

export async function middleware(request: NextRequest) {
  // 1. Refresh Supabase session
  await updateSession(request)

  const { pathname } = request.nextUrl

  // 2. Protect /admin routes
  if (pathname.match(/\/admin/)) {
    const supabase = createServerClient(
      process.env['NEXT_PUBLIC_SUPABASE_URL']!,
      process.env['NEXT_PUBLIC_SUPABASE_ANON_KEY']!,
      {
        cookies: {
          getAll: () => request.cookies.getAll(),
          setAll: () => {},
        },
      },
    )
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      const loginUrl = new URL('/login', request.url)
      loginUrl.searchParams.set('redirect', pathname)
      return NextResponse.redirect(loginUrl)
    }
  }

  // 3. Apply i18n locale routing
  return intlMiddleware(request)
}

export const config = {
  matcher: [
    // exclude /auth (OAuth/magic-link callback) and /login (admin sign-in) —
    // both are non-localized routes that must not be rewritten/prefixed by intl
    '/((?!api|auth|login|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js)$).*)',
  ],
}
