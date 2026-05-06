// @vitest-environment node

import { beforeEach, describe, expect, it, vi } from 'vitest'

const { authMock, redirectMock } = vi.hoisted(() => ({
  authMock: vi.fn(),
  redirectMock: vi.fn(),
}))

vi.mock('@/lib/auth', () => ({
  auth: authMock,
}))

vi.mock('next/navigation', () => ({
  redirect: redirectMock,
}))

import { requireUser, getAuthenticatedUser } from '@/lib/auth/require-user'

describe('requireUser()', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('RU1: セッションに user.id が存在するとき AuthenticatedUser を返す', async () => {
    authMock.mockResolvedValue({
      user: { id: 'user-1', email: 'a@example.com', name: 'Alice' },
    })

    const user = await requireUser()

    expect(user.id).toBe('user-1')
    expect(user.email).toBe('a@example.com')
    expect(user.name).toBe('Alice')
    expect(redirectMock).not.toHaveBeenCalled()
  })

  it('RU2: セッションが null のとき redirect("/login") を呼び出す', async () => {
    authMock.mockResolvedValue(null)

    await requireUser()

    expect(redirectMock).toHaveBeenCalledWith('/login')
  })

  it('RU3: セッションに user.id がない（user オブジェクトは存在する）とき redirect("/login") を呼び出す', async () => {
    authMock.mockResolvedValue({ user: { email: 'a@example.com' } })

    await requireUser()

    expect(redirectMock).toHaveBeenCalledWith('/login')
  })

  it('RU4: user.name が null の場合は name: null を返す', async () => {
    authMock.mockResolvedValue({
      user: { id: 'user-1', email: 'a@example.com', name: null },
    })

    const user = await requireUser()

    expect(user.name).toBeNull()
  })
})

describe('getAuthenticatedUser()', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('GAU1: セッションに user.id が存在するとき AuthenticatedUser を返す', async () => {
    authMock.mockResolvedValue({
      user: { id: 'user-1', email: 'a@example.com', name: 'Alice' },
    })

    const user = await getAuthenticatedUser()

    expect(user).not.toBeNull()
    expect(user!.id).toBe('user-1')
  })

  it('GAU2: セッションが null のとき null を返す（redirect しない）', async () => {
    authMock.mockResolvedValue(null)

    const user = await getAuthenticatedUser()

    expect(user).toBeNull()
    expect(redirectMock).not.toHaveBeenCalled()
  })

  it('GAU3: セッションに user.id がないとき null を返す', async () => {
    authMock.mockResolvedValue({ user: { email: 'a@example.com' } })

    const user = await getAuthenticatedUser()

    expect(user).toBeNull()
  })
})
