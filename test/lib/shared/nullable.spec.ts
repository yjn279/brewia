import { describe, expect, it } from 'vitest'
import { toNullable } from '@/lib/shared/nullable'

describe('toNullable', () => {
  it('throws when value is undefined', () => {
    expect(() => toNullable(undefined)).toThrow('undefined is not allowed')
  })

  it('returns null when value is empty string', () => {
    expect(toNullable('')).toBeNull()
  })

  it('returns null when value is null', () => {
    expect(toNullable(null)).toBeNull()
  })

  it('returns same string when value is non-empty', () => {
    expect(toNullable('Ethiopia')).toBe('Ethiopia')
  })
})
