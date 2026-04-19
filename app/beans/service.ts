import 'server-only'

import { BeansRepository } from '@/app/beans/repository'
import type { UpsertBeanDto } from '@/app/beans/schema'

const beansRepository = new BeansRepository()

export class BeansService {
  async getBeans() {
    return beansRepository.findAll()
  }

  async getBeanById(id: string) {
    return beansRepository.findById(id)
  }

  async createBean(dto: UpsertBeanDto) {
    return beansRepository.create({
      name: dto.name,
      roaster: dto.roaster,
      country: dto.country,
      region: dto.region,
      farm: dto.farm,
      variety: dto.variety,
      process: dto.process,
      roast: dto.roast,
      notes: dto.notes,
      price: dto.price ?? null,
    })
  }

  async updateBean(id: string, dto: UpsertBeanDto) {
    return beansRepository.update(id, {
      name: dto.name,
      roaster: dto.roaster,
      country: dto.country,
      region: dto.region,
      farm: dto.farm,
      variety: dto.variety,
      process: dto.process,
      roast: dto.roast,
      notes: dto.notes,
      price: dto.price ?? null,
    })
  }

  async deleteBean(id: string) {
    return beansRepository.delete(id)
  }
}

export const beansService = new BeansService()
