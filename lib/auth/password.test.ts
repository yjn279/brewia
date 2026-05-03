// @vitest-environment node

import { describe, expect, it } from 'vitest'
import { hashPassword, verifyPassword } from '@/lib/auth/password'

describe('hashPassword / verifyPassword', () => {
  it('verifyPassword returns true for a correct password', async () => {
    const hash = await hashPassword('correct-password-123')
    const result = await verifyPassword('correct-password-123', hash)
    expect(result).toBe(true)
  })

  it('verifyPassword returns false for a wrong password', async () => {
    const hash = await hashPassword('correct-password-123')
    const result = await verifyPassword('wrong-password-456', hash)
    expect(result).toBe(false)
  })

  it('hashPassword produces a non-empty string containing a colon separator', async () => {
    const hash = await hashPassword('test-password')
    expect(typeof hash).toBe('string')
    expect(hash.length).toBeGreaterThan(0)
    expect(hash).toContain(':')
  })

  it('two different calls to hashPassword produce different hashes (different salt)', async () => {
    const hash1 = await hashPassword('same-password')
    const hash2 = await hashPassword('same-password')
    expect(hash1).not.toBe(hash2)
  })
})
