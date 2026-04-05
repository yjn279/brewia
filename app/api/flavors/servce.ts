import 'server-only'

import { FlavorsRepository } from '@/app/api/flavors/repository'

const flavorsRepository = new FlavorsRepository()

export class FlavorsService {
  async getFlavors() {
    return flavorsRepository.findAll()
  }

  async getFlavorsByBrewId(brewId: string) {
    return flavorsRepository.findByBrewId(brewId)
  }

  async getFlavorMapByBeanId(beanId: string) {
    return flavorsRepository.findMapByBeanId(beanId)
  }
}

export const flavorsService = new FlavorsService()
