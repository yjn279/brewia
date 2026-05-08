import 'server-only'

import { BeansRepository } from '@/app/beans/repository'
import type { UpsertBeanDto } from '@/app/beans/schema'

const beansRepository = new BeansRepository()

export class BeansService {
  async getBeans(userId: string) {
    return beansRepository.findAll(userId)
  }

  async getBeanById(userId: string, id: string) {
    return beansRepository.findById(userId, id)
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
      priceJpy: dto.priceJpy,
      notes: dto.notes,
    })
  }

  async updateBean(userId: string, id: string, dto: UpsertBeanDto) {
    return beansRepository.update(userId, id, {
      name: dto.name,
      roaster: dto.roaster,
      country: dto.country,
      region: dto.region,
      farm: dto.farm,
      variety: dto.variety,
      process: dto.process,
      roast: dto.roast,
      priceJpy: dto.priceJpy,
      notes: dto.notes,
    })
  }

  async deleteBean(userId: string, id: string) {
    return beansRepository.delete(userId, id)
  }
}

export const beansService = new BeansService()
