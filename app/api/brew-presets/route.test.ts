// @vitest-environment node

import { beforeEach, describe, expect, it, vi } from 'vitest'

const { createPresetMock, getPresetsMock, getAuthenticatedUserMock } = vi.hoisted(() => ({
  createPresetMock: vi.fn(),
  getPresetsMock: vi.fn(),
  getAuthenticatedUserMock: vi.fn(),
}))

vi.mock('@/lib/auth/require-user', () => ({
  getAuthenticatedUser: getAuthenticatedUserMock,
}))

vi.mock('@/app/brew-presets/service', () => ({
  brewPresetsService: {
    createBrewPreset: createPresetMock,
    getBrewPresets: getPresetsMock,
  },
}))

import { GET, POST } from '@/app/api/brew-presets/route'

const validBody = {
  name: 'My Custom Preset',
  description: 'A great preset',
  defaultBeanWeight: 20,
  defaultWaterTemp: 93,
  steps: [{ time: 30, water: 50 }, { time: 90, water: 200 }],
}

function createRequest(body: object) {
  return new Request('http://localhost/api/brew-presets', {
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
    method: 'POST',
  })
}

describe('POST /api/brew-presets', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    getAuthenticatedUserMock.mockResolvedValue({ id: 'user-1', email: 'a@example.com', name: null })
    createPresetMock.mockResolvedValue({ id: 'preset-1' })
  })

  it('given a valid body, returns 201 with preset id', async () => {
    const response = await POST(createRequest(validBody))

    expect(response.status).toBe(201)
    const json = await response.json()
    expect(json.id).toBe('preset-1')
    expect(createPresetMock).toHaveBeenCalledOnce()
  })

  it('given unauthenticated, returns 401', async () => {
    getAuthenticatedUserMock.mockResolvedValue(null)

    const response = await POST(createRequest(validBody))

    expect(response.status).toBe(401)
    expect(createPresetMock).not.toHaveBeenCalled()
  })

  it('given a missing name, returns 400', async () => {
    const { name: _name, ...bodyWithoutName } = validBody
    const response = await POST(createRequest(bodyWithoutName))

    expect(response.status).toBe(400)
    const json = await response.json()
    expect(json.error).toBe('Invalid request body')
    expect(createPresetMock).not.toHaveBeenCalled()
  })

  it('given empty steps array, returns 400', async () => {
    const response = await POST(createRequest({ ...validBody, steps: [] }))

    expect(response.status).toBe(400)
    expect(createPresetMock).not.toHaveBeenCalled()
  })

  it('given a negative defaultBeanWeight, returns 400', async () => {
    const response = await POST(createRequest({ ...validBody, defaultBeanWeight: -1 }))

    expect(response.status).toBe(400)
    expect(createPresetMock).not.toHaveBeenCalled()
  })
})

describe('GET /api/brew-presets', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    getAuthenticatedUserMock.mockResolvedValue({ id: 'user-1', email: 'a@example.com', name: null })
    getPresetsMock.mockResolvedValue([])
  })

  it('returns 200 with empty array when no presets', async () => {
    const response = await GET()

    expect(response.status).toBe(200)
    const json = await response.json()
    expect(json).toEqual([])
  })

  it('given unauthenticated, returns 401', async () => {
    getAuthenticatedUserMock.mockResolvedValue(null)

    const response = await GET()

    expect(response.status).toBe(401)
    expect(getPresetsMock).not.toHaveBeenCalled()
  })
})
