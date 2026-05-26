export type SightingCredibility = 'pendente' | 'alta' | 'media' | 'baixa'

export interface SightingPublic {
  id: string
  seenAt: string
  municipality: string
  zoneApprox: string
  direction: string | null
  wasMoving: boolean | null
  seemedInjured: boolean | null
  description: string | null
  credibility: SightingCredibility
  isPublic: boolean
  createdAt: string
}

export interface SightingAdmin extends SightingPublic {
  caseId: string
  coordsApprox: { x: number; y: number } | null
  reporterContact: string | null
  reviewedBy: string | null
  reviewedAt: string | null
}

export interface SightingCreateInput {
  seenAt: string
  municipality: string
  zoneApprox: string
  direction?: string
  wasMoving?: boolean
  seemedInjured?: boolean
  description?: string
  reporterContact?: string
}
