import { describe, expect, it } from 'vitest'
import { srgbToLab } from '@/lib/color/srgb-to-lab'

describe('srgbToLab', () => {
  it('S1-T1: given #BA8D5D (Light), when srgbToLab is called, then L* is approx 61.9', () => {
    const { L } = srgbToLab(0xba, 0x8d, 0x5d)
    expect(L).toBeCloseTo(61.9, 0)
  })

  it('S1-T2: given #3D2D27 (Italian), when srgbToLab is called, then L* is approx 20.1', () => {
    const { L } = srgbToLab(0x3d, 0x2d, 0x27)
    expect(L).toBeCloseTo(20.1, 1)
  })

  it('S1-T3: given #9E6C41 (Medium), when srgbToLab is called, then L* is between 49.5 and 50.5', () => {
    const { L } = srgbToLab(0x9e, 0x6c, 0x41)
    expect(L).toBeGreaterThanOrEqual(49.5)
    expect(L).toBeLessThanOrEqual(50.5)
  })

  it('S1-T4: given white (255,255,255), when srgbToLab is called, then L* is approx 100', () => {
    const { L } = srgbToLab(255, 255, 255)
    expect(L).toBeCloseTo(100, 1)
  })

  it('S1-T5: given black (0,0,0), when srgbToLab is called, then L* is approx 0', () => {
    const { L } = srgbToLab(0, 0, 0)
    expect(L).toBeCloseTo(0, 1)
  })

  it('S1-T6: given a neutral grey (128,128,128), when srgbToLab is called, then a* and b* are approx 0', () => {
    const { a, b } = srgbToLab(128, 128, 128)
    expect(a).toBeCloseTo(0, 1)
    expect(b).toBeCloseTo(0, 1)
  })

  it('S1-T7: given pure red (255,0,0), when srgbToLab is called, then a* > 0', () => {
    const { a } = srgbToLab(255, 0, 0)
    expect(a).toBeGreaterThan(0)
  })

  it('S1-T8: given any valid input, when srgbToLab is called, then returned object has numeric L, a, b properties', () => {
    const result = srgbToLab(100, 150, 200)
    expect(typeof result.L).toBe('number')
    expect(typeof result.a).toBe('number')
    expect(typeof result.b).toBe('number')
  })
})
