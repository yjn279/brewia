import type { Brew, BrewStep } from '@/lib/types'

export interface CreateBrewParams {
  beanId: string
  beanWeight: number
  beanGrind: number | null
  waterWeight: number
  waterTemp: number | null
  steps: BrewStep[]
  aroma: number
  acidity: number
  sweetness: number
  body: number
  overall: number
  notes: string | null
  flavorIds: string[]
}

export interface BrewRepository {
  create(input: CreateBrewParams): Promise<Brew>
}
