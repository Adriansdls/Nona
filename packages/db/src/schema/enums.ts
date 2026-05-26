import { pgEnum } from 'drizzle-orm/pg-core'

export const caseTypeEnum = pgEnum('case_type', ['perdido', 'encontrado', 'avistado', 'bienestar'])
export const caseStatusEnum = pgEnum('case_status', ['ativo', 'resolvido', 'arquivado', 'duplicado', 'descartado'])
export const caseSensitivityEnum = pgEnum('case_sensitivity', ['publico', 'restringido', 'privado'])
export const dogSexEnum = pgEnum('dog_sex', ['macho', 'femea', 'desconhecido'])
export const dogSizeEnum = pgEnum('dog_size', ['pequeno', 'medio', 'grande', 'gigante'])
export const imageTypeEnum = pgEnum('image_type', ['referencia', 'avistamiento'])
export const sightingCredibilityEnum = pgEnum('sighting_credibility', ['pendente', 'alta', 'media', 'baixa'])
export const matchStatusEnum = pgEnum('match_status', ['pendente', 'revisado', 'confirmado', 'descartado'])
export const posterTypeEnum = pgEnum('poster_type', ['a4', 'cuadrado_1080', 'horizontal_1200'])
export const posterLanguageEnum = pgEnum('poster_language', ['pt', 'en', 'es'])
export const userRoleEnum = pgEnum('user_role', ['admin', 'asociacion', 'clinica', 'voluntario'])
export const localeEnum = pgEnum('locale_preference', ['pt', 'en', 'es'])
