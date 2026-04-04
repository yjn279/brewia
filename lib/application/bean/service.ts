import type { Bean } from '@/lib/types'
import type { BeanRepository } from '@/lib/application/bean/repository'
import { toNullable } from '@/lib/shared/nullable'

export interface CreateBeanInput {
  name: string
  country: Bean['country']
  roast: Bean['roast']
  roaster: string
  region: string | null
  farm: string | null
  process: string | null
  variety: string | null
  notes: string | null
}

export class BeanService {
  constructor(private readonly repository: BeanRepository) {}

  async create(input: CreateBeanInput): Promise<Bean> {
    return this.repository.create({
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
