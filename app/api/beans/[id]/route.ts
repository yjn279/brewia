import { NextResponse } from 'next/server'
import { getBeanById } from '@/lib/db'

export const dynamic = 'force-dynamic'

interface BeanRouteProps {
  params: Promise<{ id: string }>
}

export async function GET(_: Request, { params }: BeanRouteProps) {
  const { id } = await params
  const bean = await getBeanById(id)

  if (!bean) {
    return NextResponse.json({ error: 'Bean not found' }, { status: 404 })
  }

  return NextResponse.json(bean)
}
