import 'server-only'

import { FlavorsRepository } from '@/lib/server/flavors/flavors.repository'

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
