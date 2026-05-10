// @vitest-environment node

import { beforeEach, describe, expect, it, vi } from 'vitest'

const {
  insertReturningMock,
  updateReturningMock,
  deleteReturningMock,
  selectMock,
} = vi.hoisted(() => ({
  insertReturningMock: vi.fn(),
  updateReturningMock: vi.fn(),
  deleteReturningMock: vi.fn(),
  selectMock: vi.fn(),
}))

vi.mock('@/lib/db/drizzle', () => ({
  db: {
    select: selectMock,
    insert: vi.fn(() => ({
      values: vi.fn(() => ({
        returning: insertReturningMock,
      })),
    })),
    update: vi.fn(() => ({
      set: vi.fn(() => ({
        where: vi.fn(() => ({
          returning: updateReturningMock,
        })),
      })),
    })),
    delete: vi.fn(() => ({
      where: vi.fn(() => ({
        returning: deleteReturningMock,
      })),
    })),
  },
}))

vi.mock('server-only', () => ({}))

import { BrewPresetsRepository } from '@/app/brew-presets/repository'

const sampleRow = {
  id: 'preset-1',
  userId: 'user-1',
  name: 'My Preset',
  description: 'A test preset',
  brewRatio: 15,
  steps: JSON.stringify([{ time: 30, water: 50 }, { time: 60, water: 200 }]),
  created: '2026-01-01T00:00:00Z',
  updated: '2026-01-01T00:00:00Z',
}

describe('BrewPresetsRepository', () => {
  let repo: BrewPresetsRepository

  beforeEach(() => {
    vi.clearAllMocks()
    repo = new BrewPresetsRepository()
  })

  it('create: inserts a new preset with userId and returns mapped record', async () => {
    insertReturningMock.mockResolvedValue([sampleRow])

    const result = await repo.create('user-1', {
      name: 'My Preset',
      description: 'A test preset',
      brewRatio: 15,
      steps: [{ time: 30, water: 50 }, { time: 60, water: 200 }],
    })

    expect(result.id).toBe('preset-1')
    expect(result.name).toBe('My Preset')
    expect(result.brewRatio).toBe(15)
    expect(result.steps).toEqual([{ time: 30, water: 50 }, { time: 60, water: 200 }])
  })

  it('findAll: returns all presets for userId ordered by updated desc', async () => {
    const orderByMock = vi.fn().mockResolvedValue([sampleRow])
    const whereMock = vi.fn(() => ({ orderBy: orderByMock }))
    const fromMock = vi.fn(() => ({ where: whereMock }))
    selectMock.mockReturnValue({ from: fromMock })

    const results = await repo.findAll('user-1')

    expect(results).toHaveLength(1)
    expect(results[0].id).toBe('preset-1')
    expect(results[0].brewRatio).toBe(15)
    expect(results[0].steps).toEqual([{ time: 30, water: 50 }, { time: 60, water: 200 }])
  })

  it('update: updates an existing preset and returns mapped record', async () => {
    updateReturningMock.mockResolvedValue([{ ...sampleRow, name: 'Updated Preset', brewRatio: 18 }])

    const result = await repo.update('user-1', 'preset-1', {
      name: 'Updated Preset',
      description: 'Updated',
      brewRatio: 18,
      steps: [{ time: 30, water: 50 }],
    })

    expect(result).toBeDefined()
    expect(result?.name).toBe('Updated Preset')
    expect(result?.brewRatio).toBe(18)
  })

  it('update: returns undefined when preset not found', async () => {
    updateReturningMock.mockResolvedValue([])

    const result = await repo.update('user-1', 'nonexistent', {
      name: 'X',
      description: '',
      brewRatio: 0,
      steps: [{ time: 10, water: 20 }],
    })

    expect(result).toBeUndefined()
  })

  it('delete: removes a preset and returns true', async () => {
    deleteReturningMock.mockResolvedValue([{ id: 'preset-1' }])

    const result = await repo.delete('user-1', 'preset-1')

    expect(result).toBe(true)
  })

  it('delete: returns false when preset not found', async () => {
    deleteReturningMock.mockResolvedValue([])

    const result = await repo.delete('user-1', 'nonexistent')

    expect(result).toBe(false)
  })
})
