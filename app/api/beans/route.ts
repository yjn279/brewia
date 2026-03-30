import { NextResponse } from 'next/server'
import { z } from 'zod'
import { COUNTRIES, ROAST_LEVELS } from '@/lib/types'
import { createBean, getBeans } from '@/lib/db'

export const dynamic = 'force-dynamic'

const createBeanSchema = z.object({
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

function toNullable(value?: string): string | null {
  if (!value) {
    return null
  }

  return value.length > 0 ? value : null
}

export async function POST(request: Request) {
  const json = await request.json()
  const parsed = createBeanSchema.safeParse(json)

  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const bean = await createBean({
    name: parsed.data.name,
    roaster: parsed.data.roaster,
    country: parsed.data.country,
    region: toNullable(parsed.data.region),
    farm: toNullable(parsed.data.farm),
    variety: toNullable(parsed.data.variety),
    process: toNullable(parsed.data.process),
    roast: parsed.data.roast,
    notes: toNullable(parsed.data.notes),
  })

  return NextResponse.json({ id: bean.id }, { status: 201 })
}

export async function GET() {
  const beans = await getBeans()
  return NextResponse.json(beans)
}
