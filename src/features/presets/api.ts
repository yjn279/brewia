import { supabase } from '@/lib/supabase'
import type { Preset } from '@/types/domain'
import type { UpsertPresetDto } from './schema'
import { v7 as uuidv7 } from 'uuid'

export async function listPresets(): Promise<Preset[]> {
  const { data, error } = await supabase
    .from('preset')
    .select('*')
    .order('updated', { ascending: false })

  if (error) throw error
  return (data ?? []).map(rowToPreset)
}

export async function getPreset(id: string): Promise<Preset | null> {
  const { data, error } = await supabase
    .from('preset')
    .select('*')
    .eq('id', id)
    .single()

  if (error) return null
  return rowToPreset(data)
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function rowToPreset(row: any): Preset {
  return {
    id: row.id,
    userId: row.user_id,
    name: row.name,
    description: row.description ?? '',
    brewRatio: row.brew_ratio,
    steps: typeof row.steps === 'string' ? JSON.parse(row.steps) : row.steps ?? [],
    created: row.created,
    updated: row.updated,
  }
}

export async function createPreset(
  userId: string,
  input: UpsertPresetDto,
): Promise<Preset> {
  const now = new Date().toISOString()
  const { data, error } = await supabase
    .from('preset')
    .insert({
      id: uuidv7(),
      user_id: userId,
      name: input.name,
      description: input.description,
      brew_ratio: input.brewRatio,
      steps: JSON.stringify(input.steps),
      created: now,
      updated: now,
    })
    .select()
    .single()

  if (error) throw error
  return rowToPreset(data)
}

export async function updatePreset(
  id: string,
  input: UpsertPresetDto,
): Promise<Preset> {
  const { data, error } = await supabase
    .from('preset')
    .update({
      name: input.name,
      description: input.description,
      brew_ratio: input.brewRatio,
      steps: JSON.stringify(input.steps),
      updated: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return rowToPreset(data)
}

export async function deletePreset(id: string): Promise<void> {
  const { error } = await supabase.from('preset').delete().eq('id', id)
  if (error) throw error
}
