import { describe, expect, it } from 'vitest'
import { upsertBeanSchema } from '@/app/beans/schema'

const validBase = {
  name: 'Kenya AA',
  roaster: 'Glitch Coffee',
  country: 'Kenya' as const,
  roast: 'Light' as const,
}

describe('upsertBeanSchema — price field', () => {
  it('accepts a positive integer', () => {
    const result = upsertBeanSchema.safeParse({ ...validBase, price: 1800 })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.price).toBe(1800)
    }
  })

  it('accepts 0', () => {
    const result = upsertBeanSchema.safeParse({ ...validBase, price: 0 })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.price).toBe(0)
    }
  })

  it('accepts null', () => {
    const result = upsertBeanSchema.safeParse({ ...validBase, price: null })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.price).toBeNull()
    }
  })

  it('accepts undefined (optional) and parses to undefined', () => {
    const result = upsertBeanSchema.safeParse({ ...validBase })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.price).toBeUndefined()
    }
  })

  it('rejects a negative integer', () => {
    const result = upsertBeanSchema.safeParse({ ...validBase, price: -1 })
    expect(result.success).toBe(false)
  })

  it('rejects a non-integer (e.g. 1800.5)', () => {
    const result = upsertBeanSchema.safeParse({ ...validBase, price: 1800.5 })
    expect(result.success).toBe(false)
  })

  it('rejects a string', () => {
    const result = upsertBeanSchema.safeParse({ ...validBase, price: '1800' })
    expect(result.success).toBe(false)
  })
})
