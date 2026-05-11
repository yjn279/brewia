export const PROCESSES = [
  'Washed',
  'Natural',
  'Honey',
  'Anaerobic',
  'Wet Hulled',
] as const

export type Process = (typeof PROCESSES)[number]

export const ROAST_LEVELS = [
  'Light',
  'Cinnamon',
  'Medium',
  'High',
  'City',
  'Full City',
  'French',
  'Italian',
] as const

export type RoastLevel = (typeof ROAST_LEVELS)[number]

export const COUNTRIES = [
  'Brazil',
  'Burundi',
  'Colombia',
  'Costa Rica',
  'El Salvador',
  'Ethiopia',
  'Guatemala',
  'Honduras',
  'Indonesia',
  'Jamaica',
  'Kenya',
  'Nicaragua',
  'Panama',
  'Papua New Guinea',
  'Rwanda',
  'Tanzania',
  'Vietnam',
  'Yemen',
  'Blended',
] as const

export type Country = (typeof COUNTRIES)[number]

export const COUNTRY_FLAGS: Record<Country, string> = {
  Brazil: '\u{1F1E7}\u{1F1F7}',
  Burundi: '\u{1F1E7}\u{1F1EE}',
  Colombia: '\u{1F1E8}\u{1F1F4}',
  'Costa Rica': '\u{1F1E8}\u{1F1F7}',
  'El Salvador': '\u{1F1F8}\u{1F1FB}',
  Ethiopia: '\u{1F1EA}\u{1F1F9}',
  Guatemala: '\u{1F1EC}\u{1F1F9}',
  Honduras: '\u{1F1ED}\u{1F1F3}',
  Indonesia: '\u{1F1EE}\u{1F1E9}',
  Jamaica: '\u{1F1EF}\u{1F1F2}',
  Kenya: '\u{1F1F0}\u{1F1EA}',
  Nicaragua: '\u{1F1F3}\u{1F1EE}',
  Panama: '\u{1F1F5}\u{1F1E6}',
  'Papua New Guinea': '\u{1F1F5}\u{1F1EC}',
  Rwanda: '\u{1F1F7}\u{1F1FC}',
  Tanzania: '\u{1F1F9}\u{1F1FF}',
  Vietnam: '\u{1F1FB}\u{1F1F3}',
  Yemen: '\u{1F1FE}\u{1F1EA}',
  Blended: '\u{1F3F3}\u{200D}\u{1F308}',
}

export interface Bean {
  id: string
  userId: string
  name: string
  country: Country
  region: string
  farm: string
  process: string
  variety: string
  roast: RoastLevel
  roaster: string
  priceJpy: number
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
  userId: string
  beanId: string
  beanWeight: number
  beanGrind: number
  waterWeight: number
  waterTemp: number
  steps: BrewStep[]
  aroma: number
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

export interface Preset {
  id: string
  userId: string
  name: string
  description: string
  brewRatio: number
  steps: BrewStep[]
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
