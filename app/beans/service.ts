import 'server-only'

import { BeansRepository } from '@/app/beans/repository'
import type { UpsertBeanDto } from '@/app/beans/schema'

const beansRepository = new BeansRepository()

export class BeansService {
  async getBeans(userId: string) {
    return beansRepository.findAll(userId)
  }

  async getBeanById(id: string, userId: string) {
    return beansRepository.findById(id, userId)
  }

  async createBean(userId: string, dto: UpsertBeanDto) {
    return beansRepository.create(userId, {
      name: dto.name,
      roaster: dto.roaster,
      country: dto.country,
      region: dto.region,
      farm: dto.farm,
      variety: dto.variety,
      process: dto.process,
      roast: dto.roast,
      priceJpy: dto.priceJpy ?? null,
      notes: dto.notes,
    })
  }

  async updateBean(id: string, userId: string, dto: UpsertBeanDto) {
    return beansRepository.update(id, userId, {
      name: dto.name,
      roaster: dto.roaster,
      country: dto.country,
      region: dto.region,
      farm: dto.farm,
      variety: dto.variety,
      process: dto.process,
      roast: dto.roast,
      priceJpy: dto.priceJpy ?? null,
      notes: dto.notes,
    })
  }

  async deleteBean(id: string, userId: string) {
    return beansRepository.delete(id, userId)
  }
}

export const beansService = new BeansService()
