import { supabase } from '@/lib/supabase'
import type { Flavor } from '@/types/domain'

export async function listFlavors(): Promise<Flavor[]> {
  const { data, error } = await supabase
    .from('flavor')
    .select('*')
    .order('category', { ascending: true })

  if (error) throw error
  return (data ?? []) as Flavor[]
}

export async function listBrewFlavors(brewId: string): Promise<string[]> {
  const { data, error } = await supabase
    .from('brew_flavor')
    .select('flavor_id')
    .eq('brew_id', brewId)

  if (error) return []
  return (data ?? []).map((r: { flavor_id: string }) => r.flavor_id)
}
