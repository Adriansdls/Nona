export type MatchStatus = 'pendente' | 'revisado' | 'confirmado' | 'descartado'

export interface VisualMatch {
  id: string
  caseAId: string
  caseBId: string
  similarityScore: number
  status: MatchStatus
  reviewedBy: string | null
  reviewedAt: string | null
  createdAt: string
}
