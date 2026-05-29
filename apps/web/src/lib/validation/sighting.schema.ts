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
  // WP16: time integrity — how well do we trust the observation time?
  observedTimeConfidence: z.enum(['exact', 'approximate', 'unknown']).optional(),
  observedTimeSource: z.enum(['firsthand', 'social_post', 'secondhand']).optional(),
})

export type SightingCreateInput = z.infer<typeof sightingCreateSchema>
