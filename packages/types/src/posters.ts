export type PosterType = 'a4' | 'cuadrado_1080' | 'horizontal_1200'
export type PosterLanguage = 'pt' | 'en' | 'es'

export interface Poster {
  id: string
  caseId: string
  storagePath: string
  publicUrl: string
  posterType: PosterType
  language: PosterLanguage
  createdAt: string
}
