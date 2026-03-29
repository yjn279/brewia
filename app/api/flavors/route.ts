import { NextResponse } from 'next/server'
import { getFlavors } from '@/lib/db'

export async function GET() {
  const flavors = await getFlavors()
  return NextResponse.json(flavors)
}
