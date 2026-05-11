import { supabase } from '@/lib/supabase'
import type { Bean } from '@/types/domain'
import type { UpsertBeanDto } from './schema'
import { v7 as uuidv7 } from 'uuid'

export async function listBeans(): Promise<Bean[]> {
  const { data, error } = await supabase
    .from('bean')
    .select('*')
    .order('updated', { ascending: false })

  if (error) throw error
  return (data ?? []) as Bean[]
}

export async function getBean(id: string): Promise<Bean | null> {
  const { data, error } = await supabase
    .from('bean')
    .select('*')
    .eq('id', id)
    .single()

  if (error) return null
  return data as Bean
}

export async function createBean(
  userId: string,
  input: UpsertBeanDto,
): Promise<Bean> {
  const now = new Date().toISOString()
  const { data, error } = await supabase
    .from('bean')
    .insert({
      id: uuidv7(),
      user_id: userId,
      name: input.name,
      roaster: input.roaster,
      country: input.country,
      region: input.region,
      farm: input.farm,
      variety: input.variety,
      process: input.process,
      roast: input.roast,
      price_jpy: input.priceJpy,
      notes: input.notes,
      created: now,
      updated: now,
    })
    .select()
    .single()

  if (error) throw error
  return data as Bean
}

export async function updateBean(
  id: string,
  input: UpsertBeanDto,
): Promise<Bean> {
  const { data, error } = await supabase
    .from('bean')
    .update({
      name: input.name,
      roaster: input.roaster,
      country: input.country,
      region: input.region,
      farm: input.farm,
      variety: input.variety,
      process: input.process,
      roast: input.roast,
      price_jpy: input.priceJpy,
      notes: input.notes,
      updated: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data as Bean
}

export async function deleteBean(id: string): Promise<void> {
  const { error } = await supabase.from('bean').delete().eq('id', id)
  if (error) throw error
}
