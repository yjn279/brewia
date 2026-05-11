import { supabase } from '@/lib/supabase'
import type { Brew } from '@/types/domain'
import type { UpsertBrewDto } from './schema'
import { v7 as uuidv7 } from 'uuid'

export async function listBrews(): Promise<Brew[]> {
  const { data, error } = await supabase
    .from('brew')
    .select('*')
    .order('updated', { ascending: false })

  if (error) throw error
  return (data ?? []).map(rowToBrew)
}

export async function getBrew(id: string): Promise<Brew | null> {
  const { data, error } = await supabase
    .from('brew')
    .select('*')
    .eq('id', id)
    .single()

  if (error) return null
  return rowToBrew(data)
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function rowToBrew(row: any): Brew {
  return {
    id: row.id,
    userId: row.user_id,
    beanId: row.bean_id,
    beanWeight: row.bean_weight,
    beanGrind: row.bean_grind,
    waterWeight: row.water_weight,
    waterTemp: row.water_temp,
    steps: typeof row.steps === 'string' ? JSON.parse(row.steps) : row.steps ?? [],
    aroma: row.aroma,
    acidity: row.acidity,
    sweetness: row.sweetness,
    body: row.body,
    overall: row.overall,
    notes: row.notes ?? '',
    created: row.created,
    updated: row.updated,
  }
}

export async function createBrew(
  userId: string,
  input: UpsertBrewDto,
): Promise<Brew> {
  const now = new Date().toISOString()
  const brewId = uuidv7()

  const { data, error } = await supabase
    .from('brew')
    .insert({
      id: brewId,
      user_id: userId,
      bean_id: input.beanId,
      bean_weight: input.beanWeight,
      bean_grind: input.beanGrind,
      water_weight: input.waterWeight,
      water_temp: input.waterTemp,
      steps: JSON.stringify(input.steps),
      aroma: input.aroma,
      acidity: input.acidity,
      sweetness: input.sweetness,
      body: input.body,
      overall: input.overall,
      notes: input.notes,
      created: now,
      updated: now,
    })
    .select()
    .single()

  if (error) throw error

  // Handle flavor associations
  if (input.flavorIds.length > 0) {
    await supabase.from('brew_flavor').delete().eq('brew_id', brewId)
    const flavorRows = input.flavorIds.map((flavorId) => ({
      id: uuidv7(),
      brew_id: brewId,
      flavor_id: flavorId,
      created: now,
      updated: now,
    }))
    const { error: flavErr } = await supabase.from('brew_flavor').insert(flavorRows)
    if (flavErr) throw flavErr
  }

  return rowToBrew(data)
}

export async function updateBrew(
  id: string,
  input: UpsertBrewDto,
): Promise<Brew> {
  const now = new Date().toISOString()
  const { data, error } = await supabase
    .from('brew')
    .update({
      bean_id: input.beanId,
      bean_weight: input.beanWeight,
      bean_grind: input.beanGrind,
      water_weight: input.waterWeight,
      water_temp: input.waterTemp,
      steps: JSON.stringify(input.steps),
      aroma: input.aroma,
      acidity: input.acidity,
      sweetness: input.sweetness,
      body: input.body,
      overall: input.overall,
      notes: input.notes,
      updated: now,
    })
    .eq('id', id)
    .select()
    .single()

  if (error) throw error

  // Replace flavor associations
  await supabase.from('brew_flavor').delete().eq('brew_id', id)
  if (input.flavorIds.length > 0) {
    const flavorRows = input.flavorIds.map((flavorId) => ({
      id: uuidv7(),
      brew_id: id,
      flavor_id: flavorId,
      created: now,
      updated: now,
    }))
    const { error: flavErr } = await supabase.from('brew_flavor').insert(flavorRows)
    if (flavErr) throw flavErr
  }

  return rowToBrew(data)
}

export async function deleteBrew(id: string): Promise<void> {
  const { error } = await supabase.from('brew').delete().eq('id', id)
  if (error) throw error
}
