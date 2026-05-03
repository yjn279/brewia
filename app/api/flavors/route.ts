import { NextResponse } from 'next/server'
import { flavorsService } from '@/app/flavors/service'
import { requireUser } from '@/lib/auth/get-current-user'

export const dynamic = 'force-dynamic'

export async function GET() {
  const [, err] = await requireUser()
  if (err) return err

  const flavors = await flavorsService.getFlavors()
  return NextResponse.json(flavors)
}
