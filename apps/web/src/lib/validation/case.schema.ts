import { z } from 'zod'

export const caseCreateSchema = z.object({
  type: z.enum(['perdido', 'encontrado', 'avistado', 'bienestar']),
  dogName: z.string().max(100).optional(),
  breed: z.string().min(1).max(100),
  sex: z.enum(['macho', 'femea', 'desconhecido']),
  neutered: z.coerce.boolean().optional(),
  size: z.enum(['pequeno', 'medio', 'grande', 'gigante']),
  primaryColor: z.string().min(1).max(50),
  secondaryColor: z.string().max(50).optional(),
  distinctiveMarks: z.string().optional(),
  ageEstimate: z.string().max(100).optional(),
  hasChip: z.coerce.boolean().optional(),
  chipLast3: z.string().max(3).regex(/^\d{0,3}$/).optional(),
  chipNumber: z.string().max(15).optional(),
  lastSeenAt: z.string().datetime({ offset: true }),
  lastSeenMunicipality: z.string().min(1),
  lastSeenZoneApprox: z.string().min(1).max(500),
  description: z.string().min(1).max(2000),
  context: z.string().max(1000).optional(),
  reporterName: z.string().min(1).max(150),
  reporterEmail: z.string().email().max(200),
  reporterPhone: z.string().max(30).optional(),
  reporterContactPublic: z.string().max(300).optional(),
  privacyAccepted: z.coerce.boolean().refine((v) => v === true, {
    message: 'Privacy policy must be accepted',
  }),
  photoPermission: z.coerce.boolean().refine((v) => v === true, {
    message: 'Photo permission must be granted',
  }),
})

export type CaseCreateInput = z.infer<typeof caseCreateSchema>
