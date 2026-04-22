import { NextResponse } from 'next/server'
import { flavorsService } from '@/app/flavors/service'
import { getAuthenticatedUser } from '@/lib/auth/require-user'

export const dynamic = 'force-dynamic'

export async function GET() {
  const user = await getAuthenticatedUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const flavors = await flavorsService.getFlavors()
  return NextResponse.json(flavors)
}
