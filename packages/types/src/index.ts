export * from './cases'
export * from './sightings'
export * from './images'
export * from './users'
export * from './visual-matches'
export * from './posters'
export * from './api'

export const LOCALES = ['pt', 'en', 'es'] as const
export type Locale = (typeof LOCALES)[number]
export const DEFAULT_LOCALE: Locale = 'pt'

export const ALGARVE_MUNICIPALITIES = [
  'Albufeira', 'Alcoutim', 'Aljezur', 'Castro Marim', 'Faro',
  'Lagoa', 'Lagos', 'Loulé', 'Monchique', 'Olhão',
  'Portimão', 'São Brás de Alportel', 'Silves', 'Tavira',
  'Vila do Bispo', 'Vila Real de Santo António',
] as const

export type AlgarveMunicipality = (typeof ALGARVE_MUNICIPALITIES)[number]
