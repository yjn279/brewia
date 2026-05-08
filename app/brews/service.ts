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

  async getBrewsByBeanId(userId: string, beanId: string) {
    return brewsRepository.findByBeanId(userId, beanId)
  }

  async getBrewById(userId: string, id: string) {
    return brewsRepository.findById(userId, id)
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

  async updateBrew(userId: string, id: string, dto: UpsertBrewDto) {
    return brewsRepository.update(userId, id, {
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

  async deleteBrew(userId: string, id: string) {
    return brewsRepository.delete(userId, id)
  }
}

export const brewsService = new BrewsService()
