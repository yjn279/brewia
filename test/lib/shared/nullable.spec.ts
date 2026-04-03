import { describe, expect, it } from 'vitest'
import { toNullable } from '@/lib/shared/nullable'

describe('toNullable', () => {
  it('returns null when value is undefined', () => {
    expect(toNullable(undefined)).toBeNull()
  })

  it('returns null when value is empty string', () => {
    expect(toNullable('')).toBeNull()
  })

  it('returns same string when value is non-empty', () => {
    expect(toNullable('Ethiopia')).toBe('Ethiopia')
  })
})
