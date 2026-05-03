// @vitest-environment node

import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextResponse } from 'next/server'

const {
  getBeanByIdServiceMock,
  updateBeanServiceMock,
  deleteBeanServiceMock,
  requireUserMock,
} = vi.hoisted(() => ({
  getBeanByIdServiceMock: vi.fn(),
  updateBeanServiceMock: vi.fn(),
  deleteBeanServiceMock: vi.fn(),
  requireUserMock: vi.fn(),
}))

vi.mock('@/app/beans/service', () => ({
  beansService: {
    getBeanById: getBeanByIdServiceMock,
    updateBean: updateBeanServiceMock,
    deleteBean: deleteBeanServiceMock,
  },
}))

vi.mock('@/lib/auth/get-current-user', () => ({
  requireUser: requireUserMock,
}))

import { GET, PUT, DELETE } from '@/app/api/beans/[id]/route'

const TEST_USER_1 = { id: 'user-1', email: 'user1@brewia.app' }
const TEST_USER_2 = { id: 'user-2', email: 'user2@brewia.app' }
const BEAN_ID = 'bean-of-user-1'

function makeParams(id: string) {
  return { params: Promise.resolve({ id }) }
}

function makePutRequest(body: object) {
  return new Request(`http://localhost/api/beans/${BEAN_ID}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

const validBeanBody = {
  name: 'Test Bean',
  roaster: 'Test Roaster',
  country: 'Ethiopia',
  region: 'Yirgacheffe',
  farm: '',
  variety: 'Heirloom',
  process: 'Washed',
  roast: 'Light',
  notes: '',
}

describe('GET /api/beans/[id] — cross-user 404', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns 401 when user is not authenticated', async () => {
    requireUserMock.mockResolvedValue([null, NextResponse.json({ error: 'Unauthorized' }, { status: 401 })])

    const res = await GET(new Request('http://localhost/api/beans/bean-1'), makeParams(BEAN_ID))
    expect(res.status).toBe(401)
    expect(getBeanByIdServiceMock).not.toHaveBeenCalled()
  })

  it('returns 404 when bean belongs to another user', async () => {
    requireUserMock.mockResolvedValue([TEST_USER_2, null])
    getBeanByIdServiceMock.mockResolvedValue(undefined)

    const res = await GET(new Request('http://localhost/api/beans/bean-1'), makeParams(BEAN_ID))
    expect(res.status).toBe(404)
    expect(getBeanByIdServiceMock).toHaveBeenCalledWith(BEAN_ID, TEST_USER_2.id)
  })

  it('returns 200 when bean belongs to the authenticated user', async () => {
    const bean = { id: BEAN_ID, userId: TEST_USER_1.id, name: 'Test Bean' }
    requireUserMock.mockResolvedValue([TEST_USER_1, null])
    getBeanByIdServiceMock.mockResolvedValue(bean)

    const res = await GET(new Request('http://localhost/api/beans/bean-1'), makeParams(BEAN_ID))
    expect(res.status).toBe(200)
    expect(getBeanByIdServiceMock).toHaveBeenCalledWith(BEAN_ID, TEST_USER_1.id)
  })
})

describe('PUT /api/beans/[id] — cross-user 404', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns 401 when user is not authenticated', async () => {
    requireUserMock.mockResolvedValue([null, NextResponse.json({ error: 'Unauthorized' }, { status: 401 })])

    const res = await PUT(makePutRequest(validBeanBody), makeParams(BEAN_ID))
    expect(res.status).toBe(401)
    expect(updateBeanServiceMock).not.toHaveBeenCalled()
  })

  it('returns 404 when bean belongs to another user', async () => {
    requireUserMock.mockResolvedValue([TEST_USER_2, null])
    updateBeanServiceMock.mockResolvedValue(undefined)

    const res = await PUT(makePutRequest(validBeanBody), makeParams(BEAN_ID))
    expect(res.status).toBe(404)
    expect(updateBeanServiceMock).toHaveBeenCalledWith(BEAN_ID, TEST_USER_2.id, expect.objectContaining({ name: 'Test Bean' }))
  })

  it('returns 200 when bean belongs to the authenticated user', async () => {
    const updated = { id: BEAN_ID, userId: TEST_USER_1.id, name: 'Test Bean' }
    requireUserMock.mockResolvedValue([TEST_USER_1, null])
    updateBeanServiceMock.mockResolvedValue(updated)

    const res = await PUT(makePutRequest(validBeanBody), makeParams(BEAN_ID))
    expect(res.status).toBe(200)
    expect(updateBeanServiceMock).toHaveBeenCalledWith(BEAN_ID, TEST_USER_1.id, expect.objectContaining({ name: 'Test Bean' }))
  })
})

describe('DELETE /api/beans/[id] — cross-user 404', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns 401 when user is not authenticated', async () => {
    requireUserMock.mockResolvedValue([null, NextResponse.json({ error: 'Unauthorized' }, { status: 401 })])

    const res = await DELETE(new Request('http://localhost/api/beans/bean-1'), makeParams(BEAN_ID))
    expect(res.status).toBe(401)
    expect(deleteBeanServiceMock).not.toHaveBeenCalled()
  })

  it('returns 404 when bean belongs to another user', async () => {
    requireUserMock.mockResolvedValue([TEST_USER_2, null])
    deleteBeanServiceMock.mockResolvedValue(false)

    const res = await DELETE(new Request('http://localhost/api/beans/bean-1'), makeParams(BEAN_ID))
    expect(res.status).toBe(404)
    expect(deleteBeanServiceMock).toHaveBeenCalledWith(BEAN_ID, TEST_USER_2.id)
  })

  it('returns 204 when bean belongs to the authenticated user', async () => {
    requireUserMock.mockResolvedValue([TEST_USER_1, null])
    deleteBeanServiceMock.mockResolvedValue(true)

    const res = await DELETE(new Request('http://localhost/api/beans/bean-1'), makeParams(BEAN_ID))
    expect(res.status).toBe(204)
    expect(deleteBeanServiceMock).toHaveBeenCalledWith(BEAN_ID, TEST_USER_1.id)
  })
})
