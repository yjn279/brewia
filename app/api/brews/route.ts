import { NextResponse } from 'next/server'
import { brewsService } from '@/app/api/brews/brews.service'
import { upsertBrewSchema } from '@/app/api/brews/brews.schema'

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  const json = await request.json()
  const parsed = upsertBrewSchema.safeParse(json)

  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const brew = await brewsService.createBrew(parsed.data)

  return NextResponse.json({ id: brew.id }, { status: 201 })
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const beanId = searchParams.get('beanId')

  if (beanId) {
    const brews = await brewsService.getBrewsByBeanId(beanId)
    return NextResponse.json(brews)
  }

  const brews = await brewsService.getBrews()
  return NextResponse.json(brews)
}
