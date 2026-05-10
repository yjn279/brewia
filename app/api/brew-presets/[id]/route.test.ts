// @vitest-environment node

import { beforeEach, describe, expect, it, vi } from 'vitest'

const { getPresetByIdMock, updatePresetMock, deletePresetMock, getAuthenticatedUserMock } = vi.hoisted(() => ({
  getPresetByIdMock: vi.fn(),
  updatePresetMock: vi.fn(),
  deletePresetMock: vi.fn(),
  getAuthenticatedUserMock: vi.fn(),
}))

vi.mock('@/lib/auth/require-user', () => ({
  getAuthenticatedUser: getAuthenticatedUserMock,
}))

vi.mock('@/app/brew-presets/service', () => ({
  brewPresetsService: {
    getBrewPresetById: getPresetByIdMock,
    updateBrewPreset: updatePresetMock,
    deleteBrewPreset: deletePresetMock,
  },
}))

import { DELETE, GET, PUT } from '@/app/api/brew-presets/[id]/route'

const samplePreset = {
  id: 'preset-1',
  userId: 'user-1',
  name: 'My Preset',
  description: 'A test',
  brewRatio: 15,
  steps: [{ time: 30, water: 50 }],
  created: '2026-01-01T00:00:00Z',
  updated: '2026-01-01T00:00:00Z',
}

function createRequest(method: string, body?: object) {
  return new Request('http://localhost/api/brew-presets/preset-1', {
    method,
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  })
}

function createParams(id: string) {
  return { params: Promise.resolve({ id }) }
}

describe('GET /api/brew-presets/:id', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    getAuthenticatedUserMock.mockResolvedValue({ id: 'user-1', email: 'a@example.com', name: null })
  })

  it('returns 200 with preset when found', async () => {
    getPresetByIdMock.mockResolvedValue(samplePreset)
    const response = await GET(createRequest('GET'), createParams('preset-1'))

    expect(response.status).toBe(200)
    const json = await response.json()
    expect(json.id).toBe('preset-1')
  })

  it('returns 401 when unauthenticated', async () => {
    getAuthenticatedUserMock.mockResolvedValue(null)
    const response = await GET(createRequest('GET'), createParams('preset-1'))

    expect(response.status).toBe(401)
    expect(getPresetByIdMock).not.toHaveBeenCalled()
  })

  it('returns 404 when preset not found', async () => {
    getPresetByIdMock.mockResolvedValue(undefined)
    const response = await GET(createRequest('GET'), createParams('nonexistent'))

    expect(response.status).toBe(404)
    const json = await response.json()
    expect(json.error).toBe('Preset not found')
  })
})

describe('PUT /api/brew-presets/:id', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    getAuthenticatedUserMock.mockResolvedValue({ id: 'user-1', email: 'a@example.com', name: null })
  })

  const validBody = {
    name: 'Updated Preset',
    description: 'Updated',
    brewRatio: 16,
    steps: [{ time: 30, water: 50 }],
  }

  it('returns 200 with updated preset when successful', async () => {
    updatePresetMock.mockResolvedValue({ ...samplePreset, name: 'Updated Preset' })
    const response = await PUT(createRequest('PUT', validBody), createParams('preset-1'))

    expect(response.status).toBe(200)
    const json = await response.json()
    expect(json.name).toBe('Updated Preset')
    const callArg = updatePresetMock.mock.calls[0][2] as { brewRatio: number }
    expect(callArg.brewRatio).toBe(16)
  })

  it('returns 401 when unauthenticated', async () => {
    getAuthenticatedUserMock.mockResolvedValue(null)
    const response = await PUT(createRequest('PUT', validBody), createParams('preset-1'))

    expect(response.status).toBe(401)
    expect(updatePresetMock).not.toHaveBeenCalled()
  })

  it('returns 400 when body is invalid', async () => {
    const response = await PUT(
      createRequest('PUT', { name: '', steps: [] }),
      createParams('preset-1')
    )

    expect(response.status).toBe(400)
    expect(updatePresetMock).not.toHaveBeenCalled()
  })

  it('returns 404 when preset not found', async () => {
    updatePresetMock.mockResolvedValue(undefined)
    const response = await PUT(createRequest('PUT', validBody), createParams('nonexistent'))

    expect(response.status).toBe(404)
  })
})

describe('DELETE /api/brew-presets/:id', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    getAuthenticatedUserMock.mockResolvedValue({ id: 'user-1', email: 'a@example.com', name: null })
  })

  it('returns 204 when successfully deleted', async () => {
    deletePresetMock.mockResolvedValue(true)
    const response = await DELETE(createRequest('DELETE'), createParams('preset-1'))

    expect(response.status).toBe(204)
  })

  it('returns 401 when unauthenticated', async () => {
    getAuthenticatedUserMock.mockResolvedValue(null)
    const response = await DELETE(createRequest('DELETE'), createParams('preset-1'))

    expect(response.status).toBe(401)
    expect(deletePresetMock).not.toHaveBeenCalled()
  })

  it('returns 404 when preset not found', async () => {
    deletePresetMock.mockResolvedValue(false)
    const response = await DELETE(createRequest('DELETE'), createParams('nonexistent'))

    expect(response.status).toBe(404)
  })
})
