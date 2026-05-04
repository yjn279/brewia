import { describe, expect, it } from 'vitest'
import {
  DEFAULT_RATINGS,
  DEFAULT_ROAST_INDEX,
  HISTORY_DATE_FORMAT_OPTIONS,
  STEP_TIME_INTERVAL,
  STEP_WATER_INTERVAL,
} from '@/lib/constants'
import { ROAST_LEVELS } from '@/lib/types'

describe('STEP_TIME_INTERVAL', () => {
  it('is 5', () => {
    expect(STEP_TIME_INTERVAL).toBe(5)
  })
})

describe('STEP_WATER_INTERVAL', () => {
  it('is 5', () => {
    expect(STEP_WATER_INTERVAL).toBe(5)
  })
})

describe('DEFAULT_ROAST_INDEX', () => {
  it('is 2', () => {
    expect(DEFAULT_ROAST_INDEX).toBe(2)
  })

  it('is a valid index into ROAST_LEVELS', () => {
    expect(DEFAULT_ROAST_INDEX).toBeGreaterThanOrEqual(0)
    expect(DEFAULT_ROAST_INDEX).toBeLessThan(ROAST_LEVELS.length)
    expect(ROAST_LEVELS[DEFAULT_ROAST_INDEX]).toBeDefined()
  })
})

describe('DEFAULT_RATINGS', () => {
  it('has aroma: 4, acidity: 3, sweetness: 4, body: 3, overall: 4', () => {
    expect(DEFAULT_RATINGS.aroma).toBe(4)
    expect(DEFAULT_RATINGS.acidity).toBe(3)
    expect(DEFAULT_RATINGS.sweetness).toBe(4)
    expect(DEFAULT_RATINGS.body).toBe(3)
    expect(DEFAULT_RATINGS.overall).toBe(4)
  })
})

describe('HISTORY_DATE_FORMAT_OPTIONS', () => {
  it('has weekday: short, month: short, day: numeric', () => {
    expect(HISTORY_DATE_FORMAT_OPTIONS.weekday).toBe('short')
    expect(HISTORY_DATE_FORMAT_OPTIONS.month).toBe('short')
    expect(HISTORY_DATE_FORMAT_OPTIONS.day).toBe('numeric')
  })
})
