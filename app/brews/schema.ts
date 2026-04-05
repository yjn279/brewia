import { z } from 'zod'

export const upsertBrewSchema = z.object({
  beanId: z.string().trim().min(1),
  beanWeight: z.coerce.number().positive(),
  beanGrind: z.union([z.coerce.number().positive(), z.literal('')]).transform((value) => {
    return value === '' ? null : value
  }),
  waterWeight: z.coerce.number().positive(),
  waterTemp: z.union([z.coerce.number().min(0).max(100), z.literal('')]).transform((value) => {
    return value === '' ? null : value
  }),
  aroma: z.coerce.number().int().min(1).max(5),
  acidity: z.coerce.number().int().min(1).max(5),
  sweetness: z.coerce.number().int().min(1).max(5),
  body: z.coerce.number().int().min(1).max(5),
  overall: z.coerce.number().int().min(1).max(5),
  notes: z.string().trim().default(''),
  flavorIds: z.array(z.string().trim().min(1)).default([]),
})

export type UpsertBrewDto = z.infer<typeof upsertBrewSchema>
