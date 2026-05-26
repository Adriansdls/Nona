export type UserRole = 'admin' | 'asociacion' | 'clinica' | 'voluntario'
export type LocalePreference = 'pt' | 'en' | 'es'

export interface UserProfile {
  id: string
  role: UserRole
  organizationName: string | null
  municipality: string | null
  verified: boolean
  localePreference: LocalePreference
  createdAt: string
}
