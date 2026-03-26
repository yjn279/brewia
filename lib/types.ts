export interface Bean {
  id: string
  name: string
  country: string
  region: string
  farm: string
  process: string
  variety: string
  roast: number // 1-5 scale
  roaster: string
  notes: string
  created: string
  updated: string
}

export interface BrewStep {
  time: number
  water: number
}

export interface Brew {
  id: string
  beanId: string
  beanWeight: number
  beanGrind: number
  waterWeight: number
  waterTemp: number
  steps: BrewStep[]
  aroma: number // 1-5 scale
  acidity: number
  sweetness: number
  body: number
  overall: number
  notes: string
  created: string
  updated: string
}

export interface Flavor {
  id: string
  name: string
  category: string
  subcategory: string
  created: string
  updated: string
}

export interface BrewFlavor {
  id: string
  brewId: string
  flavorId: string
  created: string
  updated: string
}

export interface BeanWithBrews extends Bean {
  brews: Brew[]
}

export interface BrewWithBean extends Brew {
  bean: Bean
  flavors: Flavor[]
}
