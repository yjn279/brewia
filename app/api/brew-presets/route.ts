import { NextResponse } from 'next/server'
import { brewPresetsService } from '@/app/brew-presets/service'
import { upsertBrewPresetSchema } from '@/app/brew-presets/schema'

export const dynamic = 'force-dynamic'

export async function GET() {
  const presets = await brewPresetsService.getBrewPresets()
  return NextResponse.json(presets)
}

export async function POST(request: Request) {
  const json = await request.json()
  const parsed = upsertBrewPresetSchema.safeParse(json)

  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const preset = await brewPresetsService.createBrewPreset(parsed.data)

  return NextResponse.json({ id: preset.id }, { status: 201 })
}
