import { NextResponse } from 'next/server'
import { flavorsService } from '@/app/api/flavors/servce'

export const dynamic = 'force-dynamic'

export async function GET() {
  const flavors = await flavorsService.getFlavors()
  return NextResponse.json(flavors)
}
