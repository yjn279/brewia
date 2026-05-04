import 'server-only'

import { BrewPresetsRepository } from '@/app/brew-presets/repository'
import type { UpsertBrewPresetDto } from '@/app/brew-presets/schema'

const brewPresetsRepository = new BrewPresetsRepository()

export class BrewPresetsService {
  async getBrewPresets() {
    return brewPresetsRepository.findAll()
  }

  async getBrewPresetById(id: string) {
    return brewPresetsRepository.findById(id)
  }

  async createBrewPreset(dto: UpsertBrewPresetDto) {
    return brewPresetsRepository.create({
      name: dto.name,
      description: dto.description,
      defaultBeanWeight: dto.defaultBeanWeight,
      defaultWaterTemp: dto.defaultWaterTemp,
      steps: dto.steps,
    })
  }

  async updateBrewPreset(id: string, dto: UpsertBrewPresetDto) {
    return brewPresetsRepository.update(id, {
      name: dto.name,
      description: dto.description,
      defaultBeanWeight: dto.defaultBeanWeight,
      defaultWaterTemp: dto.defaultWaterTemp,
      steps: dto.steps,
    })
  }

  async deleteBrewPreset(id: string) {
    return brewPresetsRepository.delete(id)
  }
}

export const brewPresetsService = new BrewPresetsService()
