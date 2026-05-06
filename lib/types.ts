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
  Brazil: '🇧🇷',
  Burundi: '🇧🇮',
  Colombia: '🇨🇴',
  'Costa Rica': '🇨🇷',
  'El Salvador': '🇸🇻',
  Ethiopia: '🇪🇹',
  Guatemala: '🇬🇹',
  Honduras: '🇭🇳',
  Indonesia: '🇮🇩',
  Jamaica: '🇯🇲',
  Kenya: '🇰🇪',
  Nicaragua: '🇳🇮',
  Panama: '🇵🇦',
  'Papua New Guinea': '🇵🇬',
  Rwanda: '🇷🇼',
  Tanzania: '🇹🇿',
  Vietnam: '🇻🇳',
  Yemen: '🇾🇪',
  Blended: '🏳️‍🌈',
}

export interface Bean {
  id: string
  userId: string | null
  name: string
  country: Country
  region: string | null
  farm: string | null
  process: string | null
  variety: string | null
  roast: RoastLevel
  roaster: string | null
  priceJpy: number | null
  notes: string | null
  created: string
  updated: string
}

export interface BrewStep {
  time: number
  water: number
}

export interface Brew {
  id: string
  userId: string | null
  beanId: string
  beanWeight: number
  beanGrind: number | null
  waterWeight: number
  waterTemp: number | null
  steps: BrewStep[]
  aroma: number // 1-5 scale
  acidity: number
  sweetness: number
  body: number
  overall: number
  notes: string | null
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
