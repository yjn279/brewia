// @vitest-environment node

import { beforeEach, describe, expect, it, vi } from 'vitest'

const { getAuthenticatedUserMock, getBrewByIdMock, updateBrewMock, deleteBrewMock } = vi.hoisted(
  () => ({
    getAuthenticatedUserMock: vi.fn(),
    getBrewByIdMock: vi.fn(),
    updateBrewMock: vi.fn(),
    deleteBrewMock: vi.fn(),
  })
)

vi.mock('@/lib/auth/require-user', () => ({
  getAuthenticatedUser: getAuthenticatedUserMock,
}))

vi.mock('@/app/brews/service', () => ({
  brewsService: {
    getBrewById: getBrewByIdMock,
    updateBrew: updateBrewMock,
    deleteBrew: deleteBrewMock,
  },
}))

import { GET, PUT, DELETE } from '@/app/api/brews/[id]/route'

const validBrewBody = {
  beanId: 'bean-1',
  beanWeight: 15,
  beanGrind: 24,
  waterWeight: 225,
  waterTemp: 92,
  steps: [],
  aroma: 4,
  acidity: 3,
  sweetness: 4,
  body: 3,
  overall: 4,
  notes: 'Bright and juicy',
  flavorIds: [],
}

const mockBrew = {
  id: 'brew-1',
  beanId: 'bean-1',
  userId: 'user-1',
  beanWeight: 15,
  beanGrind: 24,
  waterWeight: 225,
  waterTemp: 92,
  steps: [],
  aroma: 4,
  acidity: 3,
  sweetness: 4,
  body: 3,
  overall: 4,
  notes: 'Bright and juicy',
  flavors: [],
  bean: {
    id: 'bean-1',
    name: 'Ethiopia',
    country: 'Ethiopia',
    roaster: 'Glitch',
    region: 'Yirgacheffe',
    farm: null,
    variety: 'Heirloom',
    process: 'Washed',
    roast: 'Light',
    notes: null,
    userId: 'user-1',
    created: '2026-01-01T00:00:00.000Z',
    updated: '2026-01-01T00:00:00.000Z',
  },
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

describe('GET /api/brews/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('BRW404_GET1: 認証なしのとき 401 を返す', async () => {
    getAuthenticatedUserMock.mockResolvedValue(null)

    const response = await GET(
      createRequest('GET', 'http://localhost/api/brews/brew-1'),
      { params: Promise.resolve({ id: 'brew-1' }) }
    )

    expect(response.status).toBe(401)
    expect(getBrewByIdMock).not.toHaveBeenCalled()
  })

  it('BRW404_GET2: 認証済み + 他ユーザーの brew id のとき 404 を返す', async () => {
    getAuthenticatedUserMock.mockResolvedValue({
      id: 'user-A',
      email: 'a@example.com',
      name: 'Alice',
    })
    getBrewByIdMock.mockResolvedValue(undefined)

    const response = await GET(
      createRequest('GET', 'http://localhost/api/brews/brew-B1'),
      { params: Promise.resolve({ id: 'brew-B1' }) }
    )

    expect(response.status).toBe(404)
    expect(getBrewByIdMock).toHaveBeenCalledWith('user-A', 'brew-B1')
  })

  it('認証済み + 存在する自分の brew id のとき 200 を返す', async () => {
    getAuthenticatedUserMock.mockResolvedValue({
      id: 'user-1',
      email: 'a@example.com',
      name: 'Alice',
    })
    getBrewByIdMock.mockResolvedValue(mockBrew)

    const response = await GET(
      createRequest('GET', 'http://localhost/api/brews/brew-1'),
      { params: Promise.resolve({ id: 'brew-1' }) }
    )

    expect(response.status).toBe(200)
    expect(getBrewByIdMock).toHaveBeenCalledWith('user-1', 'brew-1')
  })
})

describe('PUT /api/brews/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('BRW404_PUT1: 認証なしのとき 401 を返す', async () => {
    getAuthenticatedUserMock.mockResolvedValue(null)

    const response = await PUT(
      createRequest('PUT', 'http://localhost/api/brews/brew-1', validBrewBody),
      { params: Promise.resolve({ id: 'brew-1' }) }
    )

    expect(response.status).toBe(401)
    expect(updateBrewMock).not.toHaveBeenCalled()
  })

  it('BRW404_PUT2: 認証済み + 他ユーザーの brew id のとき 404 を返す', async () => {
    getAuthenticatedUserMock.mockResolvedValue({
      id: 'user-A',
      email: 'a@example.com',
      name: 'Alice',
    })
    updateBrewMock.mockResolvedValue(undefined)

    const response = await PUT(
      createRequest('PUT', 'http://localhost/api/brews/brew-B1', validBrewBody),
      { params: Promise.resolve({ id: 'brew-B1' }) }
    )

    expect(response.status).toBe(404)
  })

  it('認証済み + 有効なボディのとき updateBrewMock が (userId, id, dto) で呼ばれ 200 を返す', async () => {
    getAuthenticatedUserMock.mockResolvedValue({
      id: 'user-1',
      email: 'a@example.com',
      name: 'Alice',
    })
    updateBrewMock.mockResolvedValue(mockBrew)

    const response = await PUT(
      createRequest('PUT', 'http://localhost/api/brews/brew-1', validBrewBody),
      { params: Promise.resolve({ id: 'brew-1' }) }
    )

    expect(response.status).toBe(200)
    expect(updateBrewMock).toHaveBeenCalledWith(
      'user-1',
      'brew-1',
      expect.objectContaining({ beanId: 'bean-1' })
    )
  })
})

describe('DELETE /api/brews/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('BRW404_DEL1: 認証なしのとき 401 を返す', async () => {
    getAuthenticatedUserMock.mockResolvedValue(null)

    const response = await DELETE(
      createRequest('DELETE', 'http://localhost/api/brews/brew-1'),
      { params: Promise.resolve({ id: 'brew-1' }) }
    )

    expect(response.status).toBe(401)
    expect(deleteBrewMock).not.toHaveBeenCalled()
  })

  it('BRW404_DEL2: 認証済み + 他ユーザーの brew id のとき 404 を返す', async () => {
    getAuthenticatedUserMock.mockResolvedValue({
      id: 'user-A',
      email: 'a@example.com',
      name: 'Alice',
    })
    deleteBrewMock.mockResolvedValue(false)

    const response = await DELETE(
      createRequest('DELETE', 'http://localhost/api/brews/brew-B1'),
      { params: Promise.resolve({ id: 'brew-B1' }) }
    )

    expect(response.status).toBe(404)
    expect(deleteBrewMock).toHaveBeenCalledWith('user-A', 'brew-B1')
  })

  it('認証済みのとき deleteBrewMock が (userId, id) で呼ばれ 204 を返す', async () => {
    getAuthenticatedUserMock.mockResolvedValue({
      id: 'user-1',
      email: 'a@example.com',
      name: 'Alice',
    })
    deleteBrewMock.mockResolvedValue(true)

    const response = await DELETE(
      createRequest('DELETE', 'http://localhost/api/brews/brew-1'),
      { params: Promise.resolve({ id: 'brew-1' }) }
    )

    expect(response.status).toBe(204)
    expect(deleteBrewMock).toHaveBeenCalledWith('user-1', 'brew-1')
  })
})
