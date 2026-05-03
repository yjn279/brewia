// @vitest-environment node

import { beforeEach, describe, expect, it, vi } from 'vitest'

const { getBeansServiceMock, createBeanServiceMock, requireUserMock } = vi.hoisted(() => ({
  getBeansServiceMock: vi.fn(),
  createBeanServiceMock: vi.fn(),
  requireUserMock: vi.fn(),
}))

vi.mock('@/app/beans/service', () => ({
  beansService: {
    getBeans: getBeansServiceMock,
    createBean: createBeanServiceMock,
  },
}))

vi.mock('@/lib/auth/get-current-user', () => ({
  requireUser: requireUserMock,
}))

import { GET, POST } from '@/app/api/beans/route'
import { NextResponse } from 'next/server'

const TEST_USER = { id: 'user-1', email: 'test@brewia.app' }

function makeRequest(body?: object) {
  return new Request('http://localhost/api/beans', {
    method: body ? 'POST' : 'GET',
    headers: body ? { 'Content-Type': 'application/json' } : {},
    body: body ? JSON.stringify(body) : undefined,
  })
}

describe('GET /api/beans — auth guard', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns 401 when user is not authenticated', async () => {
    requireUserMock.mockResolvedValue([null, NextResponse.json({ error: 'Unauthorized' }, { status: 401 })])

    const res = await GET()
    expect(res.status).toBe(401)
    expect(getBeansServiceMock).not.toHaveBeenCalled()
  })

  it('returns 200 with beans for authenticated user', async () => {
    requireUserMock.mockResolvedValue([TEST_USER, null])
    getBeansServiceMock.mockResolvedValue([])

    const res = await GET()
    expect(res.status).toBe(200)
    expect(getBeansServiceMock).toHaveBeenCalledWith(TEST_USER.id)
  })
})

describe('POST /api/beans — auth guard', () => {
  const validBean = {
    name: 'Test Bean',
    country: 'Ethiopia',
    roast: 'Light',
    roaster: 'Test Roaster',
    region: 'Yirgacheffe',
    farm: '',
    variety: 'Heirloom',
    process: 'Washed',
    notes: '',
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns 401 when user is not authenticated', async () => {
    requireUserMock.mockResolvedValue([null, NextResponse.json({ error: 'Unauthorized' }, { status: 401 })])

    const res = await POST(makeRequest(validBean))
    expect(res.status).toBe(401)
    expect(createBeanServiceMock).not.toHaveBeenCalled()
  })

  it('injects user_id server-side on successful POST', async () => {
    requireUserMock.mockResolvedValue([TEST_USER, null])
    createBeanServiceMock.mockResolvedValue({ id: 'bean-1' })

    const res = await POST(makeRequest(validBean))
    expect(res.status).toBe(201)
    expect(createBeanServiceMock).toHaveBeenCalledWith(TEST_USER.id, expect.objectContaining({ name: 'Test Bean' }))
  })
})
