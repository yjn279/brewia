// @vitest-environment node

import { beforeEach, describe, expect, it, vi } from 'vitest'
import { TEST_USER } from '@/lib/auth/test-helpers'

const { createBrewMock } = vi.hoisted(() => ({
  createBrewMock: vi.fn(),
}))

vi.mock('@/app/brews/service', () => ({
  brewsService: {
    createBrew: createBrewMock,
    getBrews: vi.fn(),
    getBrewsByBeanId: vi.fn(),
  },
}))

vi.mock('@/lib/auth/get-current-user', () => ({
  getCurrentUser: () => Promise.resolve(TEST_USER),
  requireUser: () => Promise.resolve([TEST_USER, null]),
}))

import { POST } from '@/app/api/brews/route'

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

describe('POST /api/brews', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    createBrewMock.mockResolvedValue({ id: 'brew-1' })
  })

  it('given odd gram values when the request is valid then it stores the exact weights', async () => {
    const response = await POST(createRequest(validBody))

    expect(response.status).toBe(201)
    expect(createBrewMock).toHaveBeenCalledWith(TEST_USER.id, {
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
    expect(createBrewMock).toHaveBeenCalledWith(TEST_USER.id, {
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
