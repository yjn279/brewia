import { NextResponse } from 'next/server'
import { brewsService } from '@/lib/server/brews/brews.service'
import { upsertBrewSchema } from '@/lib/server/brews/brews.schema'

export const dynamic = 'force-dynamic'

interface BrewRouteProps {
  params: Promise<{ id: string }>
}

export async function GET(_: Request, { params }: BrewRouteProps) {
  const { id } = await params
  const brew = await brewsService.getBrewById(id)

  if (!brew) {
    return NextResponse.json({ error: 'Brew not found' }, { status: 404 })
  }

  return NextResponse.json(brew)
}

export async function PUT(request: Request, { params }: BrewRouteProps) {
  const { id } = await params
  const json = await request.json()
  const parsed = upsertBrewSchema.safeParse(json)

  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const brew = await brewsService.updateBrew(id, parsed.data)

  if (!brew) {
    return NextResponse.json({ error: 'Brew not found' }, { status: 404 })
  }

  return NextResponse.json(brew)
}

export async function DELETE(_: Request, { params }: BrewRouteProps) {
  const { id } = await params
  const deleted = await brewsService.deleteBrew(id)

  if (!deleted) {
    return NextResponse.json({ error: 'Brew not found' }, { status: 404 })
  }

  return new Response(null, { status: 204 })
}
