export type CaseType = 'perdido' | 'encontrado' | 'avistado' | 'bienestar'
export type CaseStatus = 'ativo' | 'resolvido' | 'arquivado' | 'duplicado' | 'descartado'
export type CaseSensitivity = 'publico' | 'restringido' | 'privado'
export type DogSex = 'macho' | 'femea' | 'desconhecido'
export type DogSize = 'pequeno' | 'medio' | 'grande' | 'gigante'

export interface CaseImagePublic {
  id: string
  publicUrl: string
  isPrimary: boolean
  imageType: 'referencia' | 'avistamiento'
}

/** Safe for public API responses — no private fields */
export interface CasePublic {
  id: string
  slug: string
  type: CaseType
  status: CaseStatus
  dogName: string | null
  breed: string
  sex: DogSex
  neutered: boolean | null
  size: DogSize
  primaryColor: string
  secondaryColor: string | null
  distinctiveMarks: string[]
  ageEstimate: string | null
  hasChip: boolean | null
  chipLast3: string | null
  lastSeenAt: string
  lastSeenMunicipality: string
  lastSeenZoneApprox: string
  description: string
  reporterContactPublic: string | null
  createdAt: string
  resolvedAt: string | null
  caseImages?: CaseImagePublic[]
}

/** Full case — admin use only */
export interface CaseAdmin extends CasePublic {
  chipNumberEncrypted: string | null
  lastSeenCoordsApprox: { x: number; y: number } | null
  context: string | null
  suspectedTheft: boolean
  reporterName: string
  reporterEmail: string
  reporterPhone: string | null
  adminNotes: string | null
  createdBy: string | null
  sensitivity: CaseSensitivity
}

export interface CaseCreateInput {
  type: CaseType
  dogName?: string
  breed: string
  sex: DogSex
  neutered?: boolean
  size: DogSize
  primaryColor: string
  secondaryColor?: string
  distinctiveMarks?: string[]
  ageEstimate?: string
  hasChip?: boolean
  chipLast3?: string
  chipNumber?: string
  lastSeenAt: string
  lastSeenMunicipality: string
  lastSeenZoneApprox: string
  description: string
  context?: string
  reporterName: string
  reporterEmail: string
  reporterPhone?: string
  reporterContactPublic?: string
  privacyAccepted: boolean
  photoPermission: boolean
}
