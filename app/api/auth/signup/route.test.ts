// @vitest-environment node

import { beforeEach, describe, expect, it, vi } from 'vitest'

const { dbSelectMock, dbInsertMock, createSessionMock, setSessionCookieMock } = vi.hoisted(() => ({
  dbSelectMock: vi.fn(),
  dbInsertMock: vi.fn(),
  createSessionMock: vi.fn(),
  setSessionCookieMock: vi.fn(),
}))

vi.mock('@/lib/db/drizzle', () => ({
  db: {
    select: dbSelectMock,
    insert: dbInsertMock,
  },
}))

vi.mock('@/lib/auth/session', () => ({
  createSession: createSessionMock,
}))

vi.mock('@/lib/auth/cookie', () => ({
  setSessionCookie: setSessionCookieMock,
}))

vi.mock('@/lib/auth/password', () => ({
  hashPassword: () => Promise.resolve('hashed:password'),
}))

vi.mock('server-only', () => ({}))

import { POST } from '@/app/api/auth/signup/route'

function makeRequest(body: object) {
  return new Request('http://localhost/api/auth/signup', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

describe('POST /api/auth/signup', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    setSessionCookieMock.mockResolvedValue(undefined)
    createSessionMock.mockResolvedValue({ id: 'session-id', expiresAt: new Date() })
  })

  it('returns 400 when email is invalid', async () => {
    const res = await POST(makeRequest({ email: 'not-an-email', password: 'password123' }))
    expect(res.status).toBe(400)
  })

  it('returns 400 when password is too short', async () => {
    const res = await POST(makeRequest({ email: 'test@example.com', password: 'short' }))
    expect(res.status).toBe(400)
  })

  it('returns 409 when email already exists', async () => {
    // Simulate existing user found
    dbSelectMock.mockReturnValue({
      from: () => ({
        where: () => ({
          limit: () => Promise.resolve([{ id: 'existing-user' }]),
        }),
      }),
    })

    const res = await POST(makeRequest({ email: 'existing@example.com', password: 'password123' }))
    expect(res.status).toBe(409)
  })

  it('returns 201 and calls createSession on successful signup', async () => {
    // No existing user
    dbSelectMock.mockReturnValue({
      from: () => ({
        where: () => ({
          limit: () => Promise.resolve([]),
        }),
      }),
    })
    // Insert new user
    dbInsertMock.mockReturnValue({
      values: () => ({
        returning: () => Promise.resolve([{ id: 'new-user', email: 'new@example.com' }]),
      }),
    })

    const res = await POST(makeRequest({ email: 'new@example.com', password: 'password123' }))
    expect(res.status).toBe(201)
    expect(createSessionMock).toHaveBeenCalledWith('new-user')
    expect(setSessionCookieMock).toHaveBeenCalledWith('session-id')
  })
})
