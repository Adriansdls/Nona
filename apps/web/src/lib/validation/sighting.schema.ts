import { z } from 'zod'

export const sightingCreateSchema = z.object({
  seenAt: z.string().datetime({ offset: true }),
  municipality: z.string().min(1),
  zoneApprox: z.string().min(1).max(500),
  direction: z.string().max(200).optional(),
  wasMoving: z.coerce.boolean().optional(),
  seemedInjured: z.coerce.boolean().optional(),
  description: z.string().max(1000).optional(),
  reporterContact: z.string().max(200).optional(),
})

export type SightingCreateInput = z.infer<typeof sightingCreateSchema>
