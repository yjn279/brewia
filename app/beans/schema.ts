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
  priceJpy: z.preprocess(
    (v) => (v === '' || v === undefined ? null : v),
    z.number().int().nonnegative().nullable().default(null),
  ),
  notes: z.string().trim().default(''),
})

export type UpsertBeanDto = z.infer<typeof upsertBeanSchema>
