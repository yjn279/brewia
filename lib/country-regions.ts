import type { Country } from '@/lib/types'

export const REGIONS = ['Africa', 'Latin America', 'Asia & Pacific', 'Other'] as const

export type Region = (typeof REGIONS)[number]

/** Fixed display order of regions in the select */
export const REGION_ORDER: readonly Region[] = REGIONS

/** Maps every Country value to exactly one Region.
 *  Using Record<Country, Region> ensures tsc catches any missing key when
 *  Country gains new members.
 */
export const COUNTRY_REGIONS: Record<Country, Region> = {
  // Africa
  Burundi: 'Africa',
  Ethiopia: 'Africa',
  Kenya: 'Africa',
  Rwanda: 'Africa',
  Tanzania: 'Africa',
  Yemen: 'Africa', // industry convention: Yemen treated as African-style coffee

  // Latin America
  Brazil: 'Latin America',
  Colombia: 'Latin America',
  'Costa Rica': 'Latin America',
  'El Salvador': 'Latin America',
  Guatemala: 'Latin America',
  Honduras: 'Latin America',
  Jamaica: 'Latin America',
  Nicaragua: 'Latin America',
  Panama: 'Latin America',

  // Asia & Pacific
  Indonesia: 'Asia & Pacific',
  'Papua New Guinea': 'Asia & Pacific',
  Vietnam: 'Asia & Pacific',

  // Other
  Blended: 'Other',
}

/** Returns the countries that belong to the given region, sorted alphabetically. */
export function countriesByRegion(region: Region): Country[] {
  return (Object.entries(COUNTRY_REGIONS) as [Country, Region][])
    .filter(([, r]) => r === region)
    .map(([c]) => c)
    .sort((a, b) => a.localeCompare(b))
}
