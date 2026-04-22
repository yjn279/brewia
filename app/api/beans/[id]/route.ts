import { NextResponse } from 'next/server'
import { beansService } from '@/app/beans/service'
import { upsertBeanSchema } from '@/app/beans/schema'
import { getAuthenticatedUser } from '@/lib/auth/require-user'

export const dynamic = 'force-dynamic'

interface BeanRouteProps {
  params: Promise<{ id: string }>
}

export async function GET(_: Request, { params }: BeanRouteProps) {
  const user = await getAuthenticatedUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params
  const bean = await beansService.getBeanById(user.id, id)

  if (!bean) {
    return NextResponse.json({ error: 'Bean not found' }, { status: 404 })
  }

  return NextResponse.json(bean)
}

export async function PUT(request: Request, { params }: BeanRouteProps) {
  const user = await getAuthenticatedUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params
  const json = await request.json()
  const parsed = upsertBeanSchema.safeParse(json)

  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const bean = await beansService.updateBean(user.id, id, parsed.data)

  if (!bean) {
    return NextResponse.json({ error: 'Bean not found' }, { status: 404 })
  }

  return NextResponse.json(bean)
}

export async function DELETE(_: Request, { params }: BeanRouteProps) {
  const user = await getAuthenticatedUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params
  const deleted = await beansService.deleteBean(user.id, id)

  if (!deleted) {
    return NextResponse.json({ error: 'Bean not found' }, { status: 404 })
  }

  return new Response(null, { status: 204 })
}
