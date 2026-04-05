import { NextResponse } from 'next/server'
import { beansService } from '@/app/api/beans/beans.service'
import { upsertBeanSchema } from '@/app/api/beans/beans.schema'

export const dynamic = 'force-dynamic'

interface BeanRouteProps {
  params: Promise<{ id: string }>
}

export async function GET(_: Request, { params }: BeanRouteProps) {
  const { id } = await params
  const bean = await beansService.getBeanById(id)

  if (!bean) {
    return NextResponse.json({ error: 'Bean not found' }, { status: 404 })
  }

  return NextResponse.json(bean)
}

export async function PUT(request: Request, { params }: BeanRouteProps) {
  const { id } = await params
  const json = await request.json()
  const parsed = upsertBeanSchema.safeParse(json)

  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const bean = await beansService.updateBean(id, parsed.data)

  if (!bean) {
    return NextResponse.json({ error: 'Bean not found' }, { status: 404 })
  }

  return NextResponse.json(bean)
}

export async function DELETE(_: Request, { params }: BeanRouteProps) {
  const { id } = await params
  const deleted = await beansService.deleteBean(id)

  if (!deleted) {
    return NextResponse.json({ error: 'Bean not found' }, { status: 404 })
  }

  return new Response(null, { status: 204 })
}
