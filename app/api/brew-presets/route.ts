import { NextResponse } from 'next/server'
import { brewPresetsService } from '@/app/brew-presets/service'
import { upsertBrewPresetSchema } from '@/app/brew-presets/schema'
import { getAuthenticatedUser } from '@/lib/auth/require-user'

export const dynamic = 'force-dynamic'

export async function GET() {
  const user = await getAuthenticatedUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const presets = await brewPresetsService.getBrewPresets(user.id)
  return NextResponse.json(presets)
}

export async function POST(request: Request) {
  const user = await getAuthenticatedUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const json = await request.json()
  const parsed = upsertBrewPresetSchema.safeParse(json)

  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const preset = await brewPresetsService.createBrewPreset(user.id, parsed.data)

  return NextResponse.json({ id: preset.id }, { status: 201 })
}
