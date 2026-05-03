import { NextResponse } from 'next/server'
import { brewsService } from '@/app/brews/service'
import { upsertBrewSchema } from '@/app/brews/schema'
import { requireUser } from '@/lib/auth/get-current-user'

export const dynamic = 'force-dynamic'

interface BrewRouteProps {
  params: Promise<{ id: string }>
}

export async function GET(_: Request, { params }: BrewRouteProps) {
  const [user, err] = await requireUser()
  if (err) return err

  const { id } = await params
  const brew = await brewsService.getBrewById(id, user.id)

  if (!brew) {
    return NextResponse.json({ error: 'Brew not found' }, { status: 404 })
  }

  return NextResponse.json(brew)
}

export async function PUT(request: Request, { params }: BrewRouteProps) {
  const [user, err] = await requireUser()
  if (err) return err

  const { id } = await params
  const json = await request.json()
  const parsed = upsertBrewSchema.safeParse(json)

  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const brew = await brewsService.updateBrew(id, user.id, parsed.data)

  if (!brew) {
    return NextResponse.json({ error: 'Brew not found' }, { status: 404 })
  }

  return NextResponse.json(brew)
}

export async function DELETE(_: Request, { params }: BrewRouteProps) {
  const [user, err] = await requireUser()
  if (err) return err

  const { id } = await params
  const deleted = await brewsService.deleteBrew(id, user.id)

  if (!deleted) {
    return NextResponse.json({ error: 'Brew not found' }, { status: 404 })
  }

  return new Response(null, { status: 204 })
}
