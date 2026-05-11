import { z } from 'zod'

const brewStepSchema = z.object({
  time: z.coerce.number().min(0),
  water: z.coerce.number().min(0),
})

export const upsertPresetSchema = z.object({
  name: z.string().trim().min(1),
  description: z.string().trim().default(''),
  brewRatio: z
    .union([z.coerce.number().nonnegative(), z.literal('')])
    .transform((v) => (v === '' ? 0 : v)),
  steps: z.array(brewStepSchema).min(1),
})

export type UpsertPresetDto = z.infer<typeof upsertPresetSchema>
