import 'server-only'

import { BrewsRepository } from '@/app/brews/repository'
import type { UpsertBrewDto } from '@/app/brews/schema'

const brewsRepository = new BrewsRepository()

export class BrewsService {
  async getBrews(userId: string) {
    return brewsRepository.findAll(userId)
  }

  async getBrewCountByBeanIdMap(userId: string) {
    return brewsRepository.findCountByBeanIdMap(userId)
  }

  async getBrewsByBeanId(beanId: string, userId: string) {
    return brewsRepository.findByBeanId(beanId, userId)
  }

  async getBrewById(id: string, userId: string) {
    return brewsRepository.findById(id, userId)
  }

  async createBrew(userId: string, dto: UpsertBrewDto) {
    return brewsRepository.create(userId, {
      beanId: dto.beanId,
      beanWeight: dto.beanWeight,
      beanGrind: dto.beanGrind,
      waterWeight: dto.waterWeight,
      waterTemp: dto.waterTemp,
      steps: dto.steps,
      aroma: dto.aroma,
      acidity: dto.acidity,
      sweetness: dto.sweetness,
      body: dto.body,
      overall: dto.overall,
      notes: dto.notes,
      flavorIds: [...new Set(dto.flavorIds)],
    })
  }

  async updateBrew(id: string, userId: string, dto: UpsertBrewDto) {
    return brewsRepository.update(id, userId, {
      beanId: dto.beanId,
      beanWeight: dto.beanWeight,
      beanGrind: dto.beanGrind,
      waterWeight: dto.waterWeight,
      waterTemp: dto.waterTemp,
      steps: dto.steps,
      aroma: dto.aroma,
      acidity: dto.acidity,
      sweetness: dto.sweetness,
      body: dto.body,
      overall: dto.overall,
      notes: dto.notes,
      flavorIds: [...new Set(dto.flavorIds)],
    })
  }

  async deleteBrew(id: string, userId: string) {
    return brewsRepository.delete(id, userId)
  }
}

export const brewsService = new BrewsService()
