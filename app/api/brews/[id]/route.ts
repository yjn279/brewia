import { NextResponse } from 'next/server'
import { getBrewById } from '@/lib/db'

interface BrewRouteProps {
  params: Promise<{ id: string }>
}

export async function GET(_: Request, { params }: BrewRouteProps) {
  const { id } = await params
  const brew = await getBrewById(id)

  if (!brew) {
    return NextResponse.json({ error: 'Brew not found' }, { status: 404 })
  }

  return NextResponse.json(brew)
}
