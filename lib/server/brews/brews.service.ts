import 'server-only'

import { toNullableString } from '@/lib/server/common/null-string.util'
import { BrewsRepository } from '@/lib/server/brews/brews.repository'
import type { UpsertBrewDto } from '@/lib/server/brews/brews.schema'

const brewsRepository = new BrewsRepository()

export class BrewsService {
  async getBrews() {
    return brewsRepository.findAll()
  }

  async getBrewCountByBeanIdMap() {
    return brewsRepository.findCountByBeanIdMap()
  }

  async getBrewsByBeanId(beanId: string) {
    return brewsRepository.findByBeanId(beanId)
  }

  async getBrewById(id: string) {
    return brewsRepository.findById(id)
  }

  async createBrew(dto: UpsertBrewDto) {
    return brewsRepository.create({
      beanId: dto.beanId,
      beanWeight: dto.beanWeight,
      beanGrind: dto.beanGrind,
      waterWeight: dto.waterWeight,
      waterTemp: dto.waterTemp,
      steps: [],
      aroma: dto.aroma,
      acidity: dto.acidity,
      sweetness: dto.sweetness,
      body: dto.body,
      overall: dto.overall,
      notes: toNullableString(dto.notes),
      flavorIds: [...new Set(dto.flavorIds)],
    })
  }

  async updateBrew(id: string, dto: UpsertBrewDto) {
    return brewsRepository.update(id, {
      beanId: dto.beanId,
      beanWeight: dto.beanWeight,
      beanGrind: dto.beanGrind,
      waterWeight: dto.waterWeight,
      waterTemp: dto.waterTemp,
      steps: [],
      aroma: dto.aroma,
      acidity: dto.acidity,
      sweetness: dto.sweetness,
      body: dto.body,
      overall: dto.overall,
      notes: toNullableString(dto.notes),
      flavorIds: [...new Set(dto.flavorIds)],
    })
  }

  async deleteBrew(id: string) {
    return brewsRepository.delete(id)
  }
}

export const brewsService = new BrewsService()
