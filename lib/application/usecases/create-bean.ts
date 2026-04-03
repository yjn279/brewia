import type { Bean } from '@/lib/types'
import type { BeanRepository } from '@/lib/ports/bean-repository'
import { toNullable } from '@/lib/shared/nullable'

export interface CreateBeanInput {
  name: string
  country: Bean['country']
  roast: Bean['roast']
  roaster: string
  region?: string
  farm?: string
  process?: string
  variety?: string
  notes?: string
}

export class CreateBeanUseCase {
  constructor(private readonly beanRepository: BeanRepository) {}

  async execute(input: CreateBeanInput): Promise<Bean> {
    return this.beanRepository.create({
      name: input.name,
      country: input.country,
      roast: input.roast,
      roaster: toNullable(input.roaster),
      region: toNullable(input.region),
      farm: toNullable(input.farm),
      process: toNullable(input.process),
      variety: toNullable(input.variety),
      notes: toNullable(input.notes),
    })
  }
}
