const GRAPH = 'https://graph.facebook.com/v19.0'
const APP_URL = process.env['NEXT_PUBLIC_APP_URL'] ?? 'http://localhost:3000'

export interface MetaPostParams {
  slug: string
  dogName: string | null
  type: 'perdido' | 'encontrado'
  municipality: string
  imageUrl: string | null
}

function buildCaption(params: MetaPostParams): string {
  const { dogName, type, municipality, slug } = params
  const name = dogName ?? 'Cão sem nome'
  const verb = type === 'perdido' ? 'perdido' : 'encontrado'
  const tag = municipality.toLowerCase().replace(/\s+/g, '').replace(/[^a-z]/g, '')
  const caseUrl = `${APP_URL}/pt/caso/${slug}`
  return (
    `🚨 Cão ${verb} em ${municipality}!\n\n` +
    `${name}\n\n` +
    `Ver caso e ajudar: ${caseUrl}\n\n` +
    `#salvacao #cao${verb} #algarve #${tag}`
  )
}

async function postToFacebook(caption: string, imageUrl: string | null): Promise<string | null> {
  const token = process.env['FACEBOOK_PAGE_ACCESS_TOKEN']
  const pageId = process.env['FACEBOOK_PAGE_ID']
  if (!token || !pageId) return null

  const endpoint = imageUrl
    ? `${GRAPH}/${pageId}/photos`
    : `${GRAPH}/${pageId}/feed`

  const body = imageUrl
    ? { url: imageUrl, caption, access_token: token }
    : { message: caption, access_token: token }

  const res = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(15_000),
  })
  if (!res.ok) {
    const err = await res.text()
    throw new Error(`FB post failed ${res.status}: ${err}`)
  }
  // Capture the post id (WS-E): /photos returns {id, post_id}, /feed returns {id}.
  // The boostable page-post id is post_id (photos) or id (feed).
  const data = (await res.json()) as { id?: string; post_id?: string }
  return data.post_id ?? data.id ?? null
}

async function postToInstagram(caption: string, imageUrl: string | null): Promise<void> {
  const token = process.env['FACEBOOK_PAGE_ACCESS_TOKEN']
  const igAccount = process.env['INSTAGRAM_BUSINESS_ACCOUNT_ID']
  if (!token || !igAccount || !imageUrl) return

  // Step 1: create media container
  const createRes = await fetch(`${GRAPH}/${igAccount}/media`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ image_url: imageUrl, caption, access_token: token }),
    signal: AbortSignal.timeout(15_000),
  })
  if (!createRes.ok) {
    const err = await createRes.text()
    throw new Error(`IG media create failed ${createRes.status}: ${err}`)
  }
  const { id: containerId } = (await createRes.json()) as { id: string }

  // Step 2: publish
  const publishRes = await fetch(`${GRAPH}/${igAccount}/media_publish`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ creation_id: containerId, access_token: token }),
    signal: AbortSignal.timeout(15_000),
  })
  if (!publishRes.ok) {
    const err = await publishRes.text()
    throw new Error(`IG publish failed ${publishRes.status}: ${err}`)
  }
}

export async function postCaseToMeta(params: MetaPostParams): Promise<{ fbPostId: string | null }> {
  const caption = buildCaption(params)
  const [fb] = await Promise.allSettled([
    postToFacebook(caption, params.imageUrl).catch((e) => { console.warn('FB post failed:', e); return null }),
    postToInstagram(caption, params.imageUrl).catch((e) => console.warn('IG post failed:', e)),
  ])
  const fbPostId = fb.status === 'fulfilled' ? (fb.value ?? null) : null
  return { fbPostId }
}
