import type { CaseCreateInput } from '@salvacao/types'

const TYPE_SLUG: Record<string, string> = {
  perdido: 'perdido',
  encontrado: 'encontrado',
  avistado: 'avistado',
  bienestar: 'bemestar',
}

export function generateSlug(data: CaseCreateInput): string {
  const typeSlug = TYPE_SLUG[data.type] ?? data.type
  const breedSlug = slugify(data.breed)
  const munSlug = slugify(data.lastSeenMunicipality)
  const year = new Date(data.lastSeenAt).getFullYear()
  const rand = Math.random().toString(36).slice(2, 7)
  return `${typeSlug}-${breedSlug}-${munSlug}-${year}-${rand}`
}

function slugify(str: string): string {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 30)
}
