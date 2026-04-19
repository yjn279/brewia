import { describe, expect, it } from 'vitest'
import { formatJpy } from '@/lib/format'

describe('formatJpy', () => {
  // F1: Formats a positive integer with thousands separator and yen sign
  it('F1: given a positive integer price, when formatJpy is called, then it returns the value formatted as Japanese yen with a thousands separator', () => {
    expect(formatJpy(1800)).toBe('¥1,800')
  })

  it('F1b: given a price of 1000, when formatJpy is called, then it returns "¥1,000"', () => {
    expect(formatJpy(1000)).toBe('¥1,000')
  })

  it('F1c: given a price below 1000 (e.g. 500), when formatJpy is called, then it returns "¥500" with no unnecessary comma', () => {
    expect(formatJpy(500)).toBe('¥500')
  })

  it('F1d: given a price above 10000 (e.g. 12000), when formatJpy is called, then it returns "¥12,000"', () => {
    expect(formatJpy(12000)).toBe('¥12,000')
  })

  // F2: Returns null when price is null
  it('F2: given a null price, when formatJpy is called, then it returns null', () => {
    expect(formatJpy(null)).toBeNull()
  })

  // F3: Zero is formatted as a valid price string, not null
  it('F3: given a price of 0, when formatJpy is called, then it returns "¥0"', () => {
    expect(formatJpy(0)).toBe('¥0')
  })
})
