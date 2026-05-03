import { NextResponse } from 'next/server'
import { brewsService } from '@/app/brews/service'
import { upsertBrewSchema } from '@/app/brews/schema'
import { getCurrentUser } from '@/lib/auth/session'

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const json = await request.json()
  const parsed = upsertBrewSchema.safeParse(json)

  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const brew = await brewsService.createBrew(user.id, parsed.data)

  return NextResponse.json({ id: brew.id }, { status: 201 })
}

export async function GET(request: Request) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const beanId = searchParams.get('beanId')

  if (beanId) {
    const brews = await brewsService.getBrewsByBeanId(beanId, user.id)
    return NextResponse.json(brews)
  }

  const brews = await brewsService.getBrews(user.id)
  return NextResponse.json(brews)
}
