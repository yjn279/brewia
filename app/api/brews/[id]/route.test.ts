// @vitest-environment node

import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextResponse } from 'next/server'

const {
  getBrewByIdServiceMock,
  updateBrewServiceMock,
  deleteBrewServiceMock,
  requireUserMock,
} = vi.hoisted(() => ({
  getBrewByIdServiceMock: vi.fn(),
  updateBrewServiceMock: vi.fn(),
  deleteBrewServiceMock: vi.fn(),
  requireUserMock: vi.fn(),
}))

vi.mock('@/app/brews/service', () => ({
  brewsService: {
    getBrewById: getBrewByIdServiceMock,
    updateBrew: updateBrewServiceMock,
    deleteBrew: deleteBrewServiceMock,
  },
}))

vi.mock('@/lib/auth/get-current-user', () => ({
  requireUser: requireUserMock,
}))

import { GET, PUT, DELETE } from '@/app/api/brews/[id]/route'

const TEST_USER_1 = { id: 'user-1', email: 'user1@brewia.app' }
const TEST_USER_2 = { id: 'user-2', email: 'user2@brewia.app' }
const BREW_ID = 'brew-of-user-1'

function makeParams(id: string) {
  return { params: Promise.resolve({ id }) }
}

function makePutRequest(body: object) {
  return new Request(`http://localhost/api/brews/${BREW_ID}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

const validBrewBody = {
  beanId: 'bean-1',
  beanWeight: 18,
  beanGrind: 24,
  waterWeight: 270,
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

describe('GET /api/brews/[id] — cross-user 404', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns 401 when user is not authenticated', async () => {
    requireUserMock.mockResolvedValue([null, NextResponse.json({ error: 'Unauthorized' }, { status: 401 })])

    const res = await GET(new Request('http://localhost/api/brews/brew-1'), makeParams(BREW_ID))
    expect(res.status).toBe(401)
    expect(getBrewByIdServiceMock).not.toHaveBeenCalled()
  })

  it('returns 404 when brew belongs to another user', async () => {
    requireUserMock.mockResolvedValue([TEST_USER_2, null])
    getBrewByIdServiceMock.mockResolvedValue(undefined)

    const res = await GET(new Request('http://localhost/api/brews/brew-1'), makeParams(BREW_ID))
    expect(res.status).toBe(404)
    expect(getBrewByIdServiceMock).toHaveBeenCalledWith(BREW_ID, TEST_USER_2.id)
  })

  it('returns 200 when brew belongs to the authenticated user', async () => {
    const brew = { id: BREW_ID, userId: TEST_USER_1.id, beanId: 'bean-1' }
    requireUserMock.mockResolvedValue([TEST_USER_1, null])
    getBrewByIdServiceMock.mockResolvedValue(brew)

    const res = await GET(new Request('http://localhost/api/brews/brew-1'), makeParams(BREW_ID))
    expect(res.status).toBe(200)
    expect(getBrewByIdServiceMock).toHaveBeenCalledWith(BREW_ID, TEST_USER_1.id)
  })
})

describe('PUT /api/brews/[id] — cross-user 404', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns 401 when user is not authenticated', async () => {
    requireUserMock.mockResolvedValue([null, NextResponse.json({ error: 'Unauthorized' }, { status: 401 })])

    const res = await PUT(makePutRequest(validBrewBody), makeParams(BREW_ID))
    expect(res.status).toBe(401)
    expect(updateBrewServiceMock).not.toHaveBeenCalled()
  })

  it('returns 404 when brew belongs to another user', async () => {
    requireUserMock.mockResolvedValue([TEST_USER_2, null])
    updateBrewServiceMock.mockResolvedValue(undefined)

    const res = await PUT(makePutRequest(validBrewBody), makeParams(BREW_ID))
    expect(res.status).toBe(404)
    expect(updateBrewServiceMock).toHaveBeenCalledWith(BREW_ID, TEST_USER_2.id, expect.objectContaining({ beanId: 'bean-1' }))
  })

  it('returns 200 when brew belongs to the authenticated user', async () => {
    const updated = { id: BREW_ID, userId: TEST_USER_1.id, beanId: 'bean-1' }
    requireUserMock.mockResolvedValue([TEST_USER_1, null])
    updateBrewServiceMock.mockResolvedValue(updated)

    const res = await PUT(makePutRequest(validBrewBody), makeParams(BREW_ID))
    expect(res.status).toBe(200)
    expect(updateBrewServiceMock).toHaveBeenCalledWith(BREW_ID, TEST_USER_1.id, expect.objectContaining({ beanId: 'bean-1' }))
  })
})

describe('DELETE /api/brews/[id] — cross-user 404', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns 401 when user is not authenticated', async () => {
    requireUserMock.mockResolvedValue([null, NextResponse.json({ error: 'Unauthorized' }, { status: 401 })])

    const res = await DELETE(new Request('http://localhost/api/brews/brew-1'), makeParams(BREW_ID))
    expect(res.status).toBe(401)
    expect(deleteBrewServiceMock).not.toHaveBeenCalled()
  })

  it('returns 404 when brew belongs to another user', async () => {
    requireUserMock.mockResolvedValue([TEST_USER_2, null])
    deleteBrewServiceMock.mockResolvedValue(false)

    const res = await DELETE(new Request('http://localhost/api/brews/brew-1'), makeParams(BREW_ID))
    expect(res.status).toBe(404)
    expect(deleteBrewServiceMock).toHaveBeenCalledWith(BREW_ID, TEST_USER_2.id)
  })

  it('returns 204 when brew belongs to the authenticated user', async () => {
    requireUserMock.mockResolvedValue([TEST_USER_1, null])
    deleteBrewServiceMock.mockResolvedValue(true)

    const res = await DELETE(new Request('http://localhost/api/brews/brew-1'), makeParams(BREW_ID))
    expect(res.status).toBe(204)
    expect(deleteBrewServiceMock).toHaveBeenCalledWith(BREW_ID, TEST_USER_1.id)
  })
})
