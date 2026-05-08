import { z } from 'zod'

const brewStepSchema = z.object({
  time: z.coerce.number().min(0),
  water: z.coerce.number().min(0),
})

export const upsertBrewPresetSchema = z.object({
  name: z.string().trim().min(1),
  description: z.string().trim().default(''),
  defaultBeanWeight: z.union([z.coerce.number().nonnegative(), z.literal('')]).transform((v) => {
    return v === '' ? 0 : v
  }),
  defaultWaterTemp: z.union([z.coerce.number().min(0).max(100), z.literal('')]).transform((v) => {
    return v === '' ? 0 : v
  }),
  steps: z.array(brewStepSchema).min(1),
})

export type UpsertBrewPresetDto = z.infer<typeof upsertBrewPresetSchema>
