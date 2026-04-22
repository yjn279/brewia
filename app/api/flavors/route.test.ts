// @vitest-environment node

import { beforeEach, describe, expect, it, vi } from 'vitest'

const { getAuthenticatedUserMock, getFlavorsServiceMock } = vi.hoisted(() => ({
  getAuthenticatedUserMock: vi.fn(),
  getFlavorsServiceMock: vi.fn(),
}))

vi.mock('@/lib/auth/require-user', () => ({
  getAuthenticatedUser: getAuthenticatedUserMock,
}))

vi.mock('@/app/flavors/service', () => ({
  flavorsService: {
    getFlavors: getFlavorsServiceMock,
  },
}))

import { GET } from '@/app/api/flavors/route'

describe('GET /api/flavors', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('FL1: 認証なしのとき 401 を返す', async () => {
    getAuthenticatedUserMock.mockResolvedValue(null)

    const response = await GET()

    expect(response.status).toBe(401)
    expect(getFlavorsServiceMock).not.toHaveBeenCalled()
  })

  it('FL2: 認証済みのとき getFlavors() を呼び出し 200 を返す（userId フィルタなし）', async () => {
    getAuthenticatedUserMock.mockResolvedValue({
      id: 'user-1',
      email: 'a@example.com',
      name: 'Alice',
    })
    getFlavorsServiceMock.mockResolvedValue([{ id: 'flavor-1', name: 'Citrus' }])

    const response = await GET()

    expect(response.status).toBe(200)
    // flavors は shared master なので userId を渡さない
    expect(getFlavorsServiceMock).toHaveBeenCalledWith()
  })
})
