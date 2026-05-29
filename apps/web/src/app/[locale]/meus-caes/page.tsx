import Link from 'next/link'
import { createClient as createServerAuthClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { N } from '@/components/nona/tokens'
import { Logo } from '@/components/nona/Logo'

// WS-F: "Os cães que procuras" — warm, photo-forward listing of the cases linked
// to the signed-in owner. Logged-out → a gentle prompt to open a case's dashboard
// (where they connect). Reads via service-role filtered by the session user id
// (no RLS change needed in v1).
export default async function MeusCaesPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  const auth = await createServerAuthClient()
  const { data: { user } } = await auth.auth.getUser()

  let cases: Array<{ slug: string; dog_name: string | null; breed: string; status: string; last_seen_municipality: string; owner_token: string; img: string | null }> = []
  if (user) {
    const svc = createServiceClient()
    const { data } = await svc
      .from('cases')
      .select('slug, dog_name, breed, status, last_seen_municipality, owner_token, case_images(public_url, is_primary)')
      .eq('owner_user_id', user.id)
      .order('created_at', { ascending: false })
    cases = (data ?? []).map((c) => {
      const imgs = (c.case_images as Array<{ public_url: string | null; is_primary: boolean }>) ?? []
      return {
        slug: c.slug as string, dog_name: c.dog_name as string | null, breed: c.breed as string,
        status: c.status as string, last_seen_municipality: c.last_seen_municipality as string,
        owner_token: c.owner_token as string,
        img: (imgs.find(i => i.is_primary) ?? imgs[0])?.public_url ?? null,
      }
    })
  }

  return (
    <div style={{ minHeight: '100dvh', background: N.paper, fontFamily: N.sans }}>
      <header style={{ borderBottom: `1px solid ${N.rule}`, padding: '16px 24px', display: 'flex', alignItems: 'center', gap: 12 }}>
        <Logo size={16} />
        <span style={{ fontFamily: N.mono, fontSize: 11, color: N.ink3, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
          os cães que procuras
        </span>
      </header>
      <main style={{ maxWidth: 720, margin: '0 auto', padding: '32px 24px 80px' }}>
        {!user ? (
          <div style={{ padding: '32px 24px', textAlign: 'center', color: N.ink2, background: N.white, border: `1px solid ${N.rule}`, borderRadius: 14 }}>
            <p style={{ margin: '0 0 8px', fontFamily: N.display, fontSize: 22, fontWeight: 400, color: N.ink }}>Ainda não entraste.</p>
            <p style={{ margin: 0, fontSize: 14, lineHeight: 1.55 }}>Abre a página da tua busca e guarda-a na tua conta para a veres aqui.</p>
          </div>
        ) : cases.length === 0 ? (
          <div style={{ padding: '32px 24px', textAlign: 'center', color: N.ink2, background: N.white, border: `1px solid ${N.rule}`, borderRadius: 14 }}>
            <p style={{ margin: 0, fontSize: 14 }}>Ainda não tens buscas guardadas nesta conta.</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gap: 14 }}>
            {cases.map((c) => (
              <Link key={c.slug} href={`/${locale}/meu-caso/${c.owner_token}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                <div style={{ display: 'flex', gap: 16, alignItems: 'center', padding: 14, background: N.white, border: `1px solid ${N.rule}`, borderRadius: 14 }}>
                  <div style={{ width: 72, height: 72, borderRadius: 12, overflow: 'hidden', background: N.surface, flexShrink: 0 }}>
                    {c.img && <img src={c.img} alt={c.dog_name ?? ''} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontFamily: N.display, fontSize: 24, fontWeight: 400, letterSpacing: '-0.02em', color: N.ink }}>{c.dog_name ?? c.breed}</div>
                    <div style={{ fontSize: 13, color: N.ink3, fontFamily: N.mono }}>{c.last_seen_municipality}</div>
                    <div style={{ marginTop: 4, display: 'inline-block', fontSize: 11, fontFamily: N.mono, fontWeight: 600, padding: '2px 8px', borderRadius: 999, background: c.status === 'resolvido' ? N.emeraldBg : N.amberBg, color: c.status === 'resolvido' ? N.emeraldDeep : N.amber }}>
                      {c.status === 'resolvido' ? 'reunido 🎉' : 'à procura'}
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
