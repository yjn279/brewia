import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createBrew } from '@/lib/db'

const createBrewSchema = z.object({
  beanId: z.string().trim().min(1),
  beanWeight: z.coerce.number().positive(),
  beanGrind: z.coerce.number().positive().nullable(),
  waterWeight: z.coerce.number().positive(),
  waterTemp: z.coerce.number().min(0).max(100).nullable(),
  aroma: z.coerce.number().int().min(1).max(5),
  acidity: z.coerce.number().int().min(1).max(5),
  sweetness: z.coerce.number().int().min(1).max(5),
  body: z.coerce.number().int().min(1).max(5),
  overall: z.coerce.number().int().min(1).max(5),
  notes: z.string().trim().optional(),
  flavorIds: z.array(z.string().trim().min(1)).default([]),
})

function toNullable(value?: string): string | null {
  if (!value) {
    return null
  }

  return value.length > 0 ? value : null
}

export async function POST(request: Request) {
  const json = await request.json()
  const parsed = createBrewSchema.safeParse(json)

  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const brew = await createBrew({
    beanId: parsed.data.beanId,
    beanWeight: parsed.data.beanWeight,
    beanGrind: parsed.data.beanGrind,
    waterWeight: parsed.data.waterWeight,
    waterTemp: parsed.data.waterTemp,
    steps: [],
    aroma: parsed.data.aroma,
    acidity: parsed.data.acidity,
    sweetness: parsed.data.sweetness,
    body: parsed.data.body,
    overall: parsed.data.overall,
    notes: toNullable(parsed.data.notes),
    flavorIds: [...new Set(parsed.data.flavorIds)],
  })

  return NextResponse.json({ id: brew.id }, { status: 201 })
}
