import { NextResponse } from 'next/server'
import { brewPresetsService } from '@/app/brew-presets/service'
import { upsertBrewPresetSchema } from '@/app/brew-presets/schema'
import { getAuthenticatedUser } from '@/lib/auth/require-user'

export const dynamic = 'force-dynamic'

interface PresetRouteProps {
  params: Promise<{ id: string }>
}

export async function GET(_: Request, { params }: PresetRouteProps) {
  const user = await getAuthenticatedUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params
  const preset = await brewPresetsService.getBrewPresetById(user.id, id)

  if (!preset) {
    return NextResponse.json({ error: 'Preset not found' }, { status: 404 })
  }

  return NextResponse.json(preset)
}

export async function PUT(request: Request, { params }: PresetRouteProps) {
  const user = await getAuthenticatedUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params
  const json = await request.json()
  const parsed = upsertBrewPresetSchema.safeParse(json)

  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const preset = await brewPresetsService.updateBrewPreset(user.id, id, parsed.data)

  if (!preset) {
    return NextResponse.json({ error: 'Preset not found' }, { status: 404 })
  }

  return NextResponse.json(preset)
}

export async function DELETE(_: Request, { params }: PresetRouteProps) {
  const user = await getAuthenticatedUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params
  const deleted = await brewPresetsService.deleteBrewPreset(user.id, id)

  if (!deleted) {
    return NextResponse.json({ error: 'Preset not found' }, { status: 404 })
  }

  return new Response(null, { status: 204 })
}
