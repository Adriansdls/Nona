export interface CaseImage {
  id: string
  caseId: string
  storagePathPublic: string | null
  storagePathOriginal: string | null
  publicUrl: string | null
  isPrimary: boolean
  imageType: 'referencia' | 'avistamiento'
  embedding: number[] | null
  qualityScore: number | null
  processedAt: string | null
  createdAt: string
}

export interface SightingImage {
  id: string
  sightingId: string
  storagePathPublic: string
  publicUrl: string
  embedding: number[] | null
}

export interface MLProcessResult {
  embedding: number[]
  bbox: { x: number; y: number; w: number; h: number }
  qualityScore: number
  publicPath: string
}
