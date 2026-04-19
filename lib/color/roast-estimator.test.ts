import { describe, expect, it } from 'vitest'
import { estimateRoastLevel } from '@/lib/color/roast-estimator'
import { ROAST_LEVELS } from '@/lib/types'

describe('estimateRoastLevel', () => {
  it.each([
    [62, 'Light'],
    [56, 'Cinnamon'],
    [50, 'Medium'],
    [44, 'High'],
    [38, 'City'],
    [32, 'Full City'],
    [26, 'French'],
    [20, 'Italian'],
  ] as const)(
    'S2-T%# given L*=%d (center), when estimateRoastLevel is called, then returns "%s"',
    (lStar, expected) => {
      expect(estimateRoastLevel(lStar)).toBe(expected)
    }
  )

  it('S2-T9: given L*=65 (upper boundary), when estimateRoastLevel is called, then returns "Light"', () => {
    expect(estimateRoastLevel(65)).toBe('Light')
  })

  it('S2-T10: given L*=17 (lower boundary), when estimateRoastLevel is called, then returns "Italian"', () => {
    expect(estimateRoastLevel(17)).toBe('Italian')
  })

  it('S2-T11: given L*=65.01 (just above upper boundary), when estimateRoastLevel is called, then returns null', () => {
    expect(estimateRoastLevel(65.01)).toBeNull()
  })

  it('S2-T12: given L*=16.99 (just below lower boundary), when estimateRoastLevel is called, then returns null', () => {
    expect(estimateRoastLevel(16.99)).toBeNull()
  })

  it('S2-T13: given L*=59 (midpoint Light-Cinnamon), when estimateRoastLevel is called, then returns "Light"', () => {
    expect(estimateRoastLevel(59)).toBe('Light')
  })

  it('S2-T14: given L*=58.9 (just past midpoint toward Cinnamon), when estimateRoastLevel is called, then returns "Cinnamon"', () => {
    expect(estimateRoastLevel(58.9)).toBe('Cinnamon')
  })

  it('S2-T15: given L*=61.9 (measured from #BA8D5D), when estimateRoastLevel is called, then returns "Light"', () => {
    expect(estimateRoastLevel(61.9)).toBe('Light')
  })

  it('S2-T16: given L*=20.11 (measured from #3D2D27), when estimateRoastLevel is called, then returns "Italian"', () => {
    expect(estimateRoastLevel(20.11)).toBe('Italian')
  })

  it('S2-T17: given L*=23 (midpoint French-Italian), when estimateRoastLevel is called, then returns "French"', () => {
    expect(estimateRoastLevel(23)).toBe('French')
  })

  it('S2-T18: given L*=45 (valid range), when estimateRoastLevel is called, then result is a member of ROAST_LEVELS', () => {
    const result = estimateRoastLevel(45)
    expect(result).not.toBeNull()
    expect(ROAST_LEVELS).toContain(result!)
  })
})
