import 'server-only'

import { toNullableString } from '@/app/api/common/null-string.util'
import { BeansRepository } from '@/app/api/beans/beans.repository'
import type { UpsertBeanDto } from '@/app/api/beans/beans.schema'

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
      region: toNullableString(dto.region),
      farm: toNullableString(dto.farm),
      variety: toNullableString(dto.variety),
      process: toNullableString(dto.process),
      roast: dto.roast,
      notes: toNullableString(dto.notes),
    })
  }

  async updateBean(id: string, dto: UpsertBeanDto) {
    return beansRepository.update(id, {
      name: dto.name,
      roaster: dto.roaster,
      country: dto.country,
      region: toNullableString(dto.region),
      farm: toNullableString(dto.farm),
      variety: toNullableString(dto.variety),
      process: toNullableString(dto.process),
      roast: dto.roast,
      notes: toNullableString(dto.notes),
    })
  }

  async deleteBean(id: string) {
    return beansRepository.delete(id)
  }
}

export const beansService = new BeansService()
