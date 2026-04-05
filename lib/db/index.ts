import { beansService } from '@/lib/server/beans/beans.service'
import { brewsService } from '@/lib/server/brews/brews.service'
import { flavorsService } from '@/lib/server/flavors/flavors.service'

export { beansService, brewsService, flavorsService }

export const getBeans = () => beansService.getBeans()
export const getBeanById = (id: string) => beansService.getBeanById(id)
export const createBean = (input: Parameters<typeof beansService.createBean>[0]) => beansService.createBean(input)
export const updateBean = (id: string, input: Parameters<typeof beansService.updateBean>[1]) => beansService.updateBean(id, input)
export const deleteBean = (id: string) => beansService.deleteBean(id)

export const getBrews = () => brewsService.getBrews()
export const getBrewsByBeanId = (beanId: string) => brewsService.getBrewsByBeanId(beanId)
export const getBrewById = (id: string) => brewsService.getBrewById(id)
export const getBrewCountByBeanIdMap = () => brewsService.getBrewCountByBeanIdMap()
export const createBrew = (input: Parameters<typeof brewsService.createBrew>[0]) => brewsService.createBrew(input)
export const updateBrew = (id: string, input: Parameters<typeof brewsService.updateBrew>[1]) => brewsService.updateBrew(id, input)
export const deleteBrew = (id: string) => brewsService.deleteBrew(id)

export const getFlavors = () => flavorsService.getFlavors()
export const getFlavorsByBrewId = (brewId: string) => flavorsService.getFlavorsByBrewId(brewId)
export const getFlavorMapByBeanId = (beanId: string) => flavorsService.getFlavorMapByBeanId(beanId)
