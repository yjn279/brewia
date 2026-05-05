import { describe, expect, it } from 'vitest'
import { COUNTRIES } from '@/lib/types'
import {
  COUNTRY_REGIONS,
  REGION_ORDER,
  REGIONS,
  countriesByRegion,
  type Region,
} from '@/lib/country-regions'

describe('COUNTRY_REGIONS', () => {
  it('covers every entry in COUNTRIES (no missing keys)', () => {
    for (const c of COUNTRIES) {
      expect(COUNTRY_REGIONS).toHaveProperty(c)
    }
  })

  it('has no extra keys beyond COUNTRIES', () => {
    const countrySet = new Set<string>(COUNTRIES)
    for (const key of Object.keys(COUNTRY_REGIONS)) {
      expect(countrySet.has(key)).toBe(true)
    }
  })

  it('assigns Blended to "Other"', () => {
    expect(COUNTRY_REGIONS['Blended']).toBe('Other')
  })

  it('assigns Yemen to "Africa" (industry convention)', () => {
    expect(COUNTRY_REGIONS['Yemen']).toBe('Africa')
  })
})

describe('REGION_ORDER', () => {
  it('contains exactly the 4 expected regions', () => {
    expect([...REGION_ORDER]).toEqual(['Africa', 'Latin America', 'Asia & Pacific', 'Other'])
  })

  it('matches REGIONS constant', () => {
    expect([...REGION_ORDER]).toEqual([...REGIONS])
  })
})

describe('countriesByRegion', () => {
  it.each(REGIONS)('returns non-empty array for region %s', (region) => {
    expect(countriesByRegion(region).length).toBeGreaterThan(0)
  })

  it.each(REGIONS)('returns alphabetically sorted list for region %s', (region) => {
    const list = countriesByRegion(region)
    const sorted = [...list].sort((a, b) => a.localeCompare(b))
    expect(list).toEqual(sorted)
  })

  it('Africa contains the expected countries', () => {
    const africa = countriesByRegion('Africa')
    const expected = [
      'Burundi', 'Ethiopia', 'Kenya', 'Rwanda', 'Tanzania', 'Yemen',
    ].sort((a, b) => a.localeCompare(b))
    expect(africa).toEqual(expected)
  })

  it('Latin America contains the expected countries', () => {
    const latam = countriesByRegion('Latin America')
    const expected = [
      'Brazil', 'Colombia', 'Costa Rica', 'El Salvador', 'Guatemala',
      'Honduras', 'Jamaica', 'Nicaragua', 'Panama',
    ].sort((a, b) => a.localeCompare(b))
    expect(latam).toEqual(expected)
  })

  it('Asia & Pacific contains the expected countries', () => {
    const asia = countriesByRegion('Asia & Pacific')
    const expected = [
      'Indonesia', 'Papua New Guinea', 'Vietnam',
    ].sort((a, b) => a.localeCompare(b))
    expect(asia).toEqual(expected)
  })

  it('Other contains only Blended', () => {
    expect(countriesByRegion('Other')).toEqual(['Blended'])
  })

  it('union of all regions equals COUNTRIES (no country is left out or duplicated)', () => {
    const all = REGION_ORDER.flatMap((r) => countriesByRegion(r))
    expect(all.sort()).toEqual([...COUNTRIES].sort())
  })

  it('REGION_ORDER display order is Africa → Latin America → Asia & Pacific → Other', () => {
    const regionLabels = REGION_ORDER as readonly Region[]
    expect(regionLabels[0]).toBe('Africa')
    expect(regionLabels[1]).toBe('Latin America')
    expect(regionLabels[2]).toBe('Asia & Pacific')
    expect(regionLabels[3]).toBe('Other')
  })
})
