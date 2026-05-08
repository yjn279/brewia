// @vitest-environment node

import { beforeEach, describe, expect, it, vi } from 'vitest'

const { createBrewMock, getAuthenticatedUserMock, getBrewsByBeanIdMock } = vi.hoisted(() => ({
  createBrewMock: vi.fn(),
  getAuthenticatedUserMock: vi.fn(),
  getBrewsByBeanIdMock: vi.fn(),
}))

vi.mock('@/app/brews/service', () => ({
  brewsService: {
    createBrew: createBrewMock,
    getBrews: vi.fn(),
    getBrewsByBeanId: getBrewsByBeanIdMock,
  },
}))

vi.mock('@/lib/auth/require-user', () => ({
  getAuthenticatedUser: getAuthenticatedUserMock,
}))

import { GET, POST } from '@/app/api/brews/route'

const validBody = {
  acidity: 3,
  aroma: 4,
  beanGrind: 24,
  beanId: 'bean-1',
  beanWeight: 7,
  body: 3,
  flavorIds: ['flavor-1'],
  notes: 'Bright and juicy',
  overall: 4,
  sweetness: 4,
  waterTemp: 92,
  waterWeight: 103,
}

function createRequest(body: object) {
  return new Request('http://localhost/api/brews', {
    body: JSON.stringify(body),
    headers: {
      'Content-Type': 'application/json',
    },
    method: 'POST',
  })
}

describe('POST /api/brews — 認証', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    createBrewMock.mockResolvedValue({ id: 'brew-1' })
  })

  it('BREW_AUTH1: 認証なしのとき 401 を返す', async () => {
    getAuthenticatedUserMock.mockResolvedValue(null)

    const response = await POST(createRequest(validBody))

    expect(response.status).toBe(401)
    expect(createBrewMock).not.toHaveBeenCalled()
  })

  it('BREW_AUTH2: 認証済みのとき createBrewMock が userId を第 1 引数として呼ばれる', async () => {
    getAuthenticatedUserMock.mockResolvedValue({
      id: 'user-1',
      email: 'a@example.com',
      name: 'Alice',
    })
    createBrewMock.mockResolvedValue({ id: 'brew-new' })

    const response = await POST(createRequest(validBody))

    expect(response.status).toBe(201)
    expect(createBrewMock).toHaveBeenCalledWith(
      'user-1',
      expect.objectContaining({ beanId: 'bean-1' })
    )
  })
})

describe('POST /api/brews', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    createBrewMock.mockResolvedValue({ id: 'brew-1' })
    // 既存テストは認証済み状態をデフォルトに設定
    getAuthenticatedUserMock.mockResolvedValue({
      id: 'user-1',
      email: 'a@example.com',
      name: 'Alice',
    })
  })

  it('given odd gram values when the request is valid then it stores the exact weights', async () => {
    const response = await POST(createRequest(validBody))

    expect(response.status).toBe(201)
    expect(createBrewMock).toHaveBeenCalledWith('user-1', {
      acidity: 3,
      aroma: 4,
      beanGrind: 24,
      beanId: 'bean-1',
      beanWeight: 7,
      body: 3,
      flavorIds: ['flavor-1'],
      notes: 'Bright and juicy',
      overall: 4,
      steps: [],
      sweetness: 4,
      waterTemp: 92,
      waterWeight: 103,
    })
  })

  it('given decimal gram values when the request is valid then it preserves the decimal weights', async () => {
    const response = await POST(
      createRequest({
        ...validBody,
        beanWeight: 15.5,
        waterWeight: 225.3,
      })
    )

    expect(response.status).toBe(201)
    expect(createBrewMock).toHaveBeenCalledWith('user-1', {
      acidity: 3,
      aroma: 4,
      beanGrind: 24,
      beanId: 'bean-1',
      beanWeight: 15.5,
      body: 3,
      flavorIds: ['flavor-1'],
      notes: 'Bright and juicy',
      overall: 4,
      steps: [],
      sweetness: 4,
      waterTemp: 92,
      waterWeight: 225.3,
    })
  })

  it('given a zero bean weight when the request is parsed then it rejects the payload', async () => {
    const response = await POST(
      createRequest({
        ...validBody,
        beanWeight: 0,
      })
    )

    expect(response.status).toBe(400)
    expect(createBrewMock).not.toHaveBeenCalled()
  })

  it('given a negative water weight when the request is parsed then it rejects the payload', async () => {
    const response = await POST(
      createRequest({
        ...validBody,
        waterWeight: -1,
      })
    )

    expect(response.status).toBe(400)
    expect(createBrewMock).not.toHaveBeenCalled()
  })

  it('given a missing bean id when the request is parsed then it rejects the payload', async () => {
    const { beanId, ...bodyWithoutBeanId } = validBody

    const response = await POST(createRequest(bodyWithoutBeanId))

    expect(response.status).toBe(400)
    expect(createBrewMock).not.toHaveBeenCalled()
  })
})

describe('GET /api/brews — クロスユーザー beanId', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    getBrewsByBeanIdMock.mockResolvedValue([])
    // user-B として認証済み状態をセット
    getAuthenticatedUserMock.mockResolvedValue({
      id: 'user-B',
      email: 'b@example.com',
      name: 'Bob',
    })
  })

  it('BREW_CROSS_USER_BEAN: user-B が user-A の beanId で GET したとき、Service が user-B の userId で呼ばれる', async () => {
    // Arrange: user-A の beanId を持つリクエストを user-B として送る
    const userABeanId = 'bean-A1'
    const request = new Request(`http://localhost/api/brews?beanId=${userABeanId}`)

    // Act
    const response = await GET(request)

    // Assert: getBrewsByBeanId が user-B の userId と user-A の beanId で呼ばれることを確認
    // （空配列を返すかどうかは Repository の責任。ここでは引数の伝搬のみ検証）
    expect(response.status).toBe(200)
    expect(getBrewsByBeanIdMock).toHaveBeenCalledWith('user-B', userABeanId)
  })
})
