import 'server-only'

import { BrewPresetsRepository } from '@/app/brew-presets/repository'
import type { UpsertBrewPresetDto } from '@/app/brew-presets/schema'

const brewPresetsRepository = new BrewPresetsRepository()

export class BrewPresetsService {
  async getBrewPresets(userId: string) {
    return brewPresetsRepository.findAll(userId)
  }

  async getBrewPresetById(userId: string, id: string) {
    return brewPresetsRepository.findById(userId, id)
  }

  async createBrewPreset(userId: string, dto: UpsertBrewPresetDto) {
    return brewPresetsRepository.create(userId, {
      name: dto.name,
      description: dto.description,
      brewRatio: dto.brewRatio,
      steps: dto.steps,
    })
  }

  async updateBrewPreset(userId: string, id: string, dto: UpsertBrewPresetDto) {
    return brewPresetsRepository.update(userId, id, {
      name: dto.name,
      description: dto.description,
      brewRatio: dto.brewRatio,
      steps: dto.steps,
    })
  }

  async deleteBrewPreset(userId: string, id: string) {
    return brewPresetsRepository.delete(userId, id)
  }
}

export const brewPresetsService = new BrewPresetsService()
