import { NextResponse } from 'next/server'
import { brewPresetsService } from '@/app/brew-presets/service'
import { upsertBrewPresetSchema } from '@/app/brew-presets/schema'

export const dynamic = 'force-dynamic'

interface PresetRouteProps {
  params: Promise<{ id: string }>
}

export async function GET(_: Request, { params }: PresetRouteProps) {
  const { id } = await params
  const preset = await brewPresetsService.getBrewPresetById(id)

  if (!preset) {
    return NextResponse.json({ error: 'Preset not found' }, { status: 404 })
  }

  return NextResponse.json(preset)
}

export async function PUT(request: Request, { params }: PresetRouteProps) {
  const { id } = await params
  const json = await request.json()
  const parsed = upsertBrewPresetSchema.safeParse(json)

  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const preset = await brewPresetsService.updateBrewPreset(id, parsed.data)

  if (!preset) {
    return NextResponse.json({ error: 'Preset not found' }, { status: 404 })
  }

  return NextResponse.json(preset)
}

export async function DELETE(_: Request, { params }: PresetRouteProps) {
  const { id } = await params
  const deleted = await brewPresetsService.deleteBrewPreset(id)

  if (!deleted) {
    return NextResponse.json({ error: 'Preset not found' }, { status: 404 })
  }

  return new Response(null, { status: 204 })
}
