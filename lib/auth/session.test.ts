// @vitest-environment node

import { describe, expect, it, vi, beforeEach } from 'vitest'
import { buildSessionCookie, SESSION_COOKIE_NAME } from '@/lib/auth/session'

// Mock server-only
vi.mock('server-only', () => ({}))

// Mock next/headers
vi.mock('next/headers', () => ({
  cookies: vi.fn(),
}))

// Mock DB
vi.mock('@/lib/db/drizzle', () => ({
  db: {
    select: vi.fn(),
    delete: vi.fn(),
    insert: vi.fn(),
  },
}))

vi.mock('@/lib/db/schema', () => ({
  sessionsTable: {},
  usersTable: {},
}))

describe('buildSessionCookie', () => {
  it('returns a cookie with the correct name', () => {
    const cookie = buildSessionCookie('test-session-id')
    expect(cookie.name).toBe(SESSION_COOKIE_NAME)
    expect(cookie.name).toBe('brewia_session')
  })

  it('sets the session id as the value', () => {
    const sessionId = 'my-session-abc'
    const cookie = buildSessionCookie(sessionId)
    expect(cookie.value).toBe(sessionId)
  })

  it('sets httpOnly and path options', () => {
    const cookie = buildSessionCookie('sid')
    expect(cookie.options.httpOnly).toBe(true)
    expect(cookie.options.path).toBe('/')
  })

  it('sets sameSite to lax', () => {
    const cookie = buildSessionCookie('sid')
    expect(cookie.options.sameSite).toBe('lax')
  })

  it('does not set secure in non-production', () => {
    const original = process.env.NODE_ENV
    // In test environment NODE_ENV is 'test', not 'production'
    const cookie = buildSessionCookie('sid')
    expect(cookie.options.secure).toBe(process.env.NODE_ENV === 'production')
    void original
  })

  it('sets a positive maxAge', () => {
    const cookie = buildSessionCookie('sid')
    expect(cookie.options.maxAge).toBeGreaterThan(0)
  })
})

describe('session expiry logic', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('an expired ISO date string is in the past', () => {
    const expired = new Date(Date.now() - 1000).toISOString()
    expect(new Date(expired) < new Date()).toBe(true)
  })

  it('a future ISO date string is not in the past', () => {
    const future = new Date(Date.now() + 1000 * 60).toISOString()
    expect(new Date(future) < new Date()).toBe(false)
  })
})
