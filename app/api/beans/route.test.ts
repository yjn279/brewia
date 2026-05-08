// @vitest-environment node

import { beforeEach, describe, expect, it, vi } from 'vitest'

const { getAuthenticatedUserMock, getBeansMock, createBeanMock } = vi.hoisted(() => ({
  getAuthenticatedUserMock: vi.fn(),
  getBeansMock: vi.fn(),
  createBeanMock: vi.fn(),
}))

vi.mock('@/lib/auth/require-user', () => ({
  getAuthenticatedUser: getAuthenticatedUserMock,
}))

vi.mock('@/app/beans/service', () => ({
  beansService: {
    getBeans: getBeansMock,
    createBean: createBeanMock,
  },
}))

import { GET, POST } from '@/app/api/beans/route'

const validBeanBody = {
  name: 'Ethiopia Yirgacheffe',
  roaster: 'Glitch',
  country: 'Ethiopia',
  region: 'Yirgacheffe',
  farm: '',
  variety: 'Heirloom',
  process: 'Washed',
  roast: 'Light',
  notes: '',
}

function createRequest(method: string, url: string, body?: object) {
  return new Request(url, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  })
}

describe('GET /api/beans', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('BGET1: 認証なしのとき 401 を返す', async () => {
    getAuthenticatedUserMock.mockResolvedValue(null)

    const response = await GET()

    expect(response.status).toBe(401)
    expect(getBeansMock).not.toHaveBeenCalled()
  })

  it('BGET2: 認証済みのとき beansService.getBeans(userId) を呼び出し 200 を返す', async () => {
    getAuthenticatedUserMock.mockResolvedValue({
      id: 'user-1',
      email: 'a@example.com',
      name: 'Alice',
    })
    getBeansMock.mockResolvedValue([{ id: 'bean-1', name: 'Ethiopia' }])

    const response = await GET()

    expect(response.status).toBe(200)
    expect(getBeansMock).toHaveBeenCalledWith('user-1')
  })
})

describe('POST /api/beans', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('BPOST1: 認証なしのとき 401 を返す', async () => {
    getAuthenticatedUserMock.mockResolvedValue(null)

    const response = await POST(
      createRequest('POST', 'http://localhost/api/beans', validBeanBody)
    )

    expect(response.status).toBe(401)
    expect(createBeanMock).not.toHaveBeenCalled()
  })

  it('BPOST2: 認証済み + 有効なボディのとき beansService.createBean(userId, dto) を呼び出し 201 を返す', async () => {
    getAuthenticatedUserMock.mockResolvedValue({
      id: 'user-1',
      email: 'a@example.com',
      name: 'Alice',
    })
    createBeanMock.mockResolvedValue({ id: 'bean-new' })

    const response = await POST(
      createRequest('POST', 'http://localhost/api/beans', validBeanBody)
    )

    expect(response.status).toBe(201)
    expect(createBeanMock).toHaveBeenCalledWith(
      'user-1',
      expect.objectContaining({ name: 'Ethiopia Yirgacheffe' })
    )
  })

  it('BPOST3: 認証済み + 無効なボディのとき 400 を返す', async () => {
    getAuthenticatedUserMock.mockResolvedValue({
      id: 'user-1',
      email: 'a@example.com',
      name: 'Alice',
    })

    const response = await POST(
      createRequest('POST', 'http://localhost/api/beans', {})
    )

    expect(response.status).toBe(400)
  })
})
