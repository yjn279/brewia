// @vitest-environment node

import { beforeEach, describe, expect, it, vi } from 'vitest'

const { getAuthenticatedUserMock, getBeanByIdMock, updateBeanMock, deleteBeanMock } = vi.hoisted(
  () => ({
    getAuthenticatedUserMock: vi.fn(),
    getBeanByIdMock: vi.fn(),
    updateBeanMock: vi.fn(),
    deleteBeanMock: vi.fn(),
  })
)

vi.mock('@/lib/auth/require-user', () => ({
  getAuthenticatedUser: getAuthenticatedUserMock,
}))

vi.mock('@/app/beans/service', () => ({
  beansService: {
    getBeanById: getBeanByIdMock,
    updateBean: updateBeanMock,
    deleteBean: deleteBeanMock,
  },
}))

import { GET, PUT, DELETE } from '@/app/api/beans/[id]/route'

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

const mockBean = {
  id: 'bean-1',
  name: 'Ethiopia Yirgacheffe',
  roaster: 'Glitch',
  country: 'Ethiopia',
  region: 'Yirgacheffe',
  farm: null,
  variety: 'Heirloom',
  process: 'Washed',
  roast: 'Light',
  notes: null,
  userId: 'user-1',
  created: '2026-01-01T00:00:00.000Z',
  updated: '2026-01-01T00:00:00.000Z',
}

function createRequest(method: string, url: string, body?: object) {
  return new Request(url, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  })
}

describe('GET /api/beans/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('BID_GET1: 認証なしのとき 401 を返す', async () => {
    getAuthenticatedUserMock.mockResolvedValue(null)

    const response = await GET(
      createRequest('GET', 'http://localhost/api/beans/bean-1'),
      { params: Promise.resolve({ id: 'bean-1' }) }
    )

    expect(response.status).toBe(401)
    expect(getBeanByIdMock).not.toHaveBeenCalled()
  })

  it('BID_GET2: 認証済み + 存在する自分の id のとき 200 を返す', async () => {
    getAuthenticatedUserMock.mockResolvedValue({
      id: 'user-1',
      email: 'a@example.com',
      name: 'Alice',
    })
    getBeanByIdMock.mockResolvedValue(mockBean)

    const response = await GET(
      createRequest('GET', 'http://localhost/api/beans/bean-1'),
      { params: Promise.resolve({ id: 'bean-1' }) }
    )

    expect(response.status).toBe(200)
    expect(getBeanByIdMock).toHaveBeenCalledWith('user-1', 'bean-1')
  })

  it('B404_GET1: 認証済みだが他ユーザーの bean id を指定したとき 404 を返す', async () => {
    getAuthenticatedUserMock.mockResolvedValue({
      id: 'user-A',
      email: 'a@example.com',
      name: 'Alice',
    })
    getBeanByIdMock.mockResolvedValue(undefined)

    const response = await GET(
      createRequest('GET', 'http://localhost/api/beans/bean-B1'),
      { params: Promise.resolve({ id: 'bean-B1' }) }
    )

    expect(response.status).toBe(404)
    expect(getBeanByIdMock).toHaveBeenCalledWith('user-A', 'bean-B1')
  })
})

describe('PUT /api/beans/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('BID_PUT1: 認証なしのとき 401 を返す', async () => {
    getAuthenticatedUserMock.mockResolvedValue(null)

    const response = await PUT(
      createRequest('PUT', 'http://localhost/api/beans/bean-1', validBeanBody),
      { params: Promise.resolve({ id: 'bean-1' }) }
    )

    expect(response.status).toBe(401)
    expect(updateBeanMock).not.toHaveBeenCalled()
  })

  it('BID_PUT2: 認証済み + 有効なボディのとき updateBeanMock が (userId, id, dto) で呼ばれ 200 を返す', async () => {
    getAuthenticatedUserMock.mockResolvedValue({
      id: 'user-1',
      email: 'a@example.com',
      name: 'Alice',
    })
    updateBeanMock.mockResolvedValue(mockBean)

    const response = await PUT(
      createRequest('PUT', 'http://localhost/api/beans/bean-1', validBeanBody),
      { params: Promise.resolve({ id: 'bean-1' }) }
    )

    expect(response.status).toBe(200)
    expect(updateBeanMock).toHaveBeenCalledWith(
      'user-1',
      'bean-1',
      expect.objectContaining({ name: 'Ethiopia Yirgacheffe' })
    )
  })

  it('B404_PUT1: 認証済みだが他ユーザーの bean id を指定したとき 404 を返す', async () => {
    getAuthenticatedUserMock.mockResolvedValue({
      id: 'user-A',
      email: 'a@example.com',
      name: 'Alice',
    })
    updateBeanMock.mockResolvedValue(undefined)

    const response = await PUT(
      createRequest('PUT', 'http://localhost/api/beans/bean-B1', validBeanBody),
      { params: Promise.resolve({ id: 'bean-B1' }) }
    )

    expect(response.status).toBe(404)
  })
})

describe('DELETE /api/beans/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('BID_DEL1: 認証なしのとき 401 を返す', async () => {
    getAuthenticatedUserMock.mockResolvedValue(null)

    const response = await DELETE(
      createRequest('DELETE', 'http://localhost/api/beans/bean-1'),
      { params: Promise.resolve({ id: 'bean-1' }) }
    )

    expect(response.status).toBe(401)
    expect(deleteBeanMock).not.toHaveBeenCalled()
  })

  it('BID_DEL2: 認証済みのとき deleteBeanMock が (userId, id) で呼ばれ 204 を返す', async () => {
    getAuthenticatedUserMock.mockResolvedValue({
      id: 'user-1',
      email: 'a@example.com',
      name: 'Alice',
    })
    deleteBeanMock.mockResolvedValue(true)

    const response = await DELETE(
      createRequest('DELETE', 'http://localhost/api/beans/bean-1'),
      { params: Promise.resolve({ id: 'bean-1' }) }
    )

    expect(response.status).toBe(204)
    expect(deleteBeanMock).toHaveBeenCalledWith('user-1', 'bean-1')
  })

  it('B404_DEL1: 認証済みだが他ユーザーの bean id を指定したとき 404 を返す', async () => {
    getAuthenticatedUserMock.mockResolvedValue({
      id: 'user-A',
      email: 'a@example.com',
      name: 'Alice',
    })
    deleteBeanMock.mockResolvedValue(false)

    const response = await DELETE(
      createRequest('DELETE', 'http://localhost/api/beans/bean-B1'),
      { params: Promise.resolve({ id: 'bean-B1' }) }
    )

    expect(response.status).toBe(404)
  })
})
