import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { createServiceClient } from '@/lib/supabase/service'
import { cookies } from 'next/headers'

async function requireAdmin() {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env['NEXT_PUBLIC_SUPABASE_URL']!,
    process.env['NEXT_PUBLIC_SUPABASE_ANON_KEY']!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: () => {},
      },
    },
  )
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const service = createServiceClient()
  const { data: profile } = await service
    .from('user_profiles')
    .select('role, verified')
    .eq('id', user.id)
    .single()

  if (!profile?.verified) return null
  return { user, role: profile.role }
}

export async function GET(req: NextRequest) {
  const auth = await requireAdmin()
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const url = req.nextUrl
  const page = parseInt(url.searchParams.get('page') ?? '1')
  const pageSize = parseInt(url.searchParams.get('pageSize') ?? '25')
  const type = url.searchParams.get('type')
  const status = url.searchParams.get('status')
  const municipality = url.searchParams.get('municipality')
  const search = url.searchParams.get('search')

  const supabase = createServiceClient()
  let query = supabase
    .from('cases')
    .select('*, case_images(id, public_url, is_primary)', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range((page - 1) * pageSize, page * pageSize - 1)

  if (type) query = query.eq('type', type)
  if (status) query = query.eq('status', status)
  if (municipality) query = query.eq('last_seen_municipality', municipality)
  if (search) {
    query = query.or(
      `dog_name.ilike.%${search}%,breed.ilike.%${search}%,last_seen_municipality.ilike.%${search}%`,
    )
  }

  const { data, error, count } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({
    data,
    total: count ?? 0,
    page,
    pageSize,
    error: null,
  })
}
