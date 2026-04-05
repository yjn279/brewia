import { z } from 'zod'
import { COUNTRIES, ROAST_LEVELS } from '@/lib/types'

export const upsertBeanSchema = z.object({
  name: z.string().trim().min(1),
  roaster: z.string().trim().min(1),
  country: z.enum(COUNTRIES),
  region: z.string().trim().optional(),
  farm: z.string().trim().optional(),
  variety: z.string().trim().optional(),
  process: z.string().trim().optional(),
  roast: z.enum(ROAST_LEVELS),
  notes: z.string().trim().optional(),
})

export type UpsertBeanDto = z.infer<typeof upsertBeanSchema>
