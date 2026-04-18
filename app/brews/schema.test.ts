import { describe, expect, it } from 'vitest'
import { upsertBrewSchema } from '@/app/brews/schema'

const baseDto = {
  beanId: 'bean-1',
  beanWeight: 15,
  beanGrind: 24,
  waterWeight: 225,
  waterTemp: 92,
  steps: [],
  notes: '',
  flavorIds: [],
}

describe('upsertBrewSchema', () => {
  it('A1: given a complete brew DTO with all cup ratings 0, when parsing, then it succeeds and preserves the zeros', () => {
    const dto = {
      ...baseDto,
      aroma: 0,
      acidity: 0,
      sweetness: 0,
      body: 0,
      overall: 0,
    }

    const result = upsertBrewSchema.parse(dto)

    expect(result.aroma).toBe(0)
    expect(result.acidity).toBe(0)
    expect(result.sweetness).toBe(0)
    expect(result.body).toBe(0)
    expect(result.overall).toBe(0)
  })

  it('A2: given a DTO with overall: -1, when parsing, then it throws a ZodError (min 0 boundary)', () => {
    const dto = {
      ...baseDto,
      aroma: 0,
      acidity: 0,
      sweetness: 0,
      body: 0,
      overall: -1,
    }

    expect(() => upsertBrewSchema.parse(dto)).toThrow()
  })

  it('A3: given a DTO with overall: 6, when parsing, then it throws a ZodError (max 5 boundary)', () => {
    const dto = {
      ...baseDto,
      aroma: 0,
      acidity: 0,
      sweetness: 0,
      body: 0,
      overall: 6,
    }

    expect(() => upsertBrewSchema.parse(dto)).toThrow()
  })
})
