import type { Brew, BrewStep } from '@/lib/types'
import type { BrewRepository } from '@/lib/ports/brew-repository'
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
  notes?: string
  flavorIds: string[]
}

export class CreateBrewUseCase {
  constructor(private readonly brewRepository: BrewRepository) {}

  async execute(input: CreateBrewInput): Promise<Brew> {
    return this.brewRepository.create({
      ...input,
      notes: toNullable(input.notes),
      flavorIds: [...new Set(input.flavorIds)],
    })
  }
}
