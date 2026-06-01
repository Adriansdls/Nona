import { createServiceClient } from '@/lib/supabase/service'
import AvistamentoClient from './AvistamentoClient'

export default async function AvistamentoPage({ params }: { params: Promise<{ slug: string; locale: string }> }) {
  const { slug } = await params
  const db = createServiceClient()
  const { data } = await db.from('cases').select('dog_name, breed').eq('slug', slug).maybeSingle()
  const dogName = (data?.dog_name as string | null) ?? (data?.breed as string | null) ?? 'cão'
  return <AvistamentoClient dogName={dogName} />
}
