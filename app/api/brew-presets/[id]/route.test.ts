// @vitest-environment node

import { beforeEach, describe, expect, it, vi } from 'vitest'

const { getPresetByIdMock, updatePresetMock, deletePresetMock } = vi.hoisted(() => ({
  getPresetByIdMock: vi.fn(),
  updatePresetMock: vi.fn(),
  deletePresetMock: vi.fn(),
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
  name: 'My Preset',
  description: 'A test',
  defaultBeanWeight: 20,
  defaultWaterTemp: 93,
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
  beforeEach(() => vi.clearAllMocks())

  it('returns 200 with preset when found', async () => {
    getPresetByIdMock.mockResolvedValue(samplePreset)
    const response = await GET(createRequest('GET'), createParams('preset-1'))

    expect(response.status).toBe(200)
    const json = await response.json()
    expect(json.id).toBe('preset-1')
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
  beforeEach(() => vi.clearAllMocks())

  const validBody = {
    name: 'Updated Preset',
    description: 'Updated',
    defaultBeanWeight: 25,
    defaultWaterTemp: 90,
    steps: [{ time: 30, water: 50 }],
  }

  it('returns 200 with updated preset when successful', async () => {
    updatePresetMock.mockResolvedValue({ ...samplePreset, name: 'Updated Preset' })
    const response = await PUT(createRequest('PUT', validBody), createParams('preset-1'))

    expect(response.status).toBe(200)
    const json = await response.json()
    expect(json.name).toBe('Updated Preset')
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
  beforeEach(() => vi.clearAllMocks())

  it('returns 204 when successfully deleted', async () => {
    deletePresetMock.mockResolvedValue(true)
    const response = await DELETE(createRequest('DELETE'), createParams('preset-1'))

    expect(response.status).toBe(204)
  })

  it('returns 404 when preset not found', async () => {
    deletePresetMock.mockResolvedValue(false)
    const response = await DELETE(createRequest('DELETE'), createParams('nonexistent'))

    expect(response.status).toBe(404)
  })
})
