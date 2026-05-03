// @vitest-environment node

import { beforeEach, describe, expect, it, vi } from 'vitest'

const { loginMock } = vi.hoisted(() => ({
  loginMock: vi.fn(),
}))

vi.mock('@/app/auth/service', () => ({
  authService: {
    login: loginMock,
  },
}))

vi.mock('server-only', () => ({}))

// Prevent db initialization errors in test environment
vi.mock('@/lib/db/drizzle', () => ({
  db: {},
}))

vi.mock('@/lib/auth/session', () => ({
  buildSessionCookie: vi.fn((sessionId: string) => ({
    name: 'brewia_session',
    value: sessionId,
    options: {
      httpOnly: true,
      path: '/',
      sameSite: 'lax',
      secure: false,
      maxAge: 2592000,
    },
  })),
  getCurrentUser: vi.fn(),
  SESSION_COOKIE_NAME: 'brewia_session',
}))

import { POST } from '@/app/api/auth/login/route'

function makeRequest(body: object) {
  return new Request('http://localhost/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

describe('POST /api/auth/login', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns 200 and sets Set-Cookie on valid credentials', async () => {
    loginMock.mockResolvedValue({ sessionId: 'test-session-id' })

    const response = await POST(makeRequest({ email: 'user@example.com', password: 'password123' }))

    expect(response.status).toBe(200)
    const setCookie = response.headers.get('Set-Cookie')
    expect(setCookie).toBeTruthy()
    expect(setCookie).toContain('brewia_session')
  })

  it('returns 401 when credentials are invalid', async () => {
    loginMock.mockResolvedValue(null)

    const response = await POST(makeRequest({ email: 'user@example.com', password: 'wrongpassword' }))

    expect(response.status).toBe(401)
    const body = await response.json() as { error: string }
    expect(body.error).toBeTruthy()
  })

  it('returns 400 when request body is malformed', async () => {
    const response = await POST(makeRequest({ email: 'not-an-email', password: '' }))

    expect(response.status).toBe(400)
    expect(loginMock).not.toHaveBeenCalled()
  })

  it('returns 400 when email is missing', async () => {
    const response = await POST(makeRequest({ password: 'password123' }))

    expect(response.status).toBe(400)
    expect(loginMock).not.toHaveBeenCalled()
  })
})
