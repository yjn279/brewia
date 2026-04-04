import type { Brew, BrewStep } from '@/lib/types'
import type { BrewRepository } from '@/lib/application/brew/repository'
import { toNullable } from '@/lib/shared/nullable'

export interface CreateBrewInput {
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

export class BrewService {
  constructor(private readonly repository: BrewRepository) {}

  async create(input: CreateBrewInput): Promise<Brew> {
    return this.repository.create({
      ...input,
      notes: toNullable(input.notes),
      flavorIds: [...new Set(input.flavorIds)],
    })
  }
}
