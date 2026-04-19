import { z } from 'zod'
import { COUNTRIES, ROAST_LEVELS } from '@/lib/types'

export const upsertBeanSchema = z.object({
  name: z.string().trim().min(1),
  roaster: z.string().trim().min(1),
  country: z.enum(COUNTRIES),
  region: z.string().trim().default(''),
  farm: z.string().trim().default(''),
  variety: z.string().trim().default(''),
  process: z.string().trim().default(''),
  roast: z.enum(ROAST_LEVELS),
  notes: z.string().trim().default(''),
  price: z.number().int().min(0).nullable().optional(),
})

export type UpsertBeanDto = z.infer<typeof upsertBeanSchema>
