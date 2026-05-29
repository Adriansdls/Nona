import { ImageResponse } from 'next/og'
import { createServiceClient } from '@/lib/supabase/service'

// WS-B: dynamic OG image so a shared case link renders a rich photo card in
// Facebook/WhatsApp (without this they show text-only — sharing is dead).
// next/og renders JSX → PNG, robust on Vercel serverless.

export const runtime = 'nodejs'
export const alt = 'Cão perdido — Nona'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

const INK = '#0b0c10'
const PAPER = '#faf9f6'
const ROSE = '#e11d48'

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  let dogName = 'Cão perdido'
  let municipality = 'Algarve'
  let type = 'perdido'
  let photoUrl: string | null = null

  try {
    const supabase = createServiceClient()
    const { data } = await supabase
      .from('cases')
      .select('dog_name, breed, type, last_seen_municipality, case_images(public_url, is_primary)')
      .eq('slug', slug)
      .eq('sensitivity', 'publico')
      .single()
    if (data) {
      dogName = (data.dog_name as string | null) ?? (data.breed as string) ?? dogName
      municipality = (data.last_seen_municipality as string) ?? municipality
      type = (data.type as string) ?? type
      const imgs = (data.case_images as Array<{ public_url: string | null; is_primary: boolean }>) ?? []
      photoUrl = (imgs.find(i => i.is_primary) ?? imgs[0])?.public_url ?? null
    }
  } catch {
    // fall through to branded fallback
  }

  const label = type === 'perdido' ? 'PERDIDO' : 'ENCONTRADO'

  return new ImageResponse(
    (
      <div style={{ width: '100%', height: '100%', display: 'flex', background: INK, position: 'relative' }}>
        {/* dog photo fills the frame */}
        {photoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={photoUrl} alt="" width={1200} height={630} style={{ width: '100%', height: '100%', objectFit: 'cover', position: 'absolute', inset: 0 }} />
        ) : (
          <div style={{ position: 'absolute', inset: 0, background: PAPER }} />
        )}
        {/* gradient + overlay text */}
        <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', padding: 64, background: 'linear-gradient(to top, rgba(11,12,16,0.92) 0%, rgba(11,12,16,0.45) 45%, rgba(11,12,16,0) 75%)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 18 }}>
            <div style={{ background: ROSE, color: '#fff', fontSize: 26, fontWeight: 800, letterSpacing: 2, padding: '8px 18px', borderRadius: 8, display: 'flex' }}>{label}</div>
            <div style={{ color: '#fff', fontSize: 30, opacity: 0.92, display: 'flex' }}>em {municipality}</div>
          </div>
          <div style={{ color: '#fff', fontSize: 88, fontWeight: 800, lineHeight: 1, display: 'flex' }}>{dogName}</div>
          <div style={{ color: '#fff', fontSize: 30, opacity: 0.9, marginTop: 18, display: 'flex' }}>Ajuda a trazê-lo de volta · nona</div>
        </div>
      </div>
    ),
    { ...size },
  )
}
