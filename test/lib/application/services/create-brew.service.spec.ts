import { describe, expect, it, vi } from 'vitest'
import { CreateBrewUseCase } from '@/lib/application/usecases/create-brew'
import type { Brew } from '@/lib/types'
import type { BrewRepository, CreateBrewParams } from '@/lib/ports/brew-repository'

function buildBrew(overrides: Partial<Brew> = {}): Brew {
  return {
    id: 'brew-1',
    beanId: 'bean-1',
    beanWeight: 15,
    beanGrind: 25,
    waterWeight: 250,
    waterTemp: 92,
    steps: [],
    aroma: 4,
    acidity: 4,
    sweetness: 4,
    body: 3,
    overall: 4,
    notes: '',
    created: '2026-04-01T00:00:00.000Z',
    updated: '2026-04-01T00:00:00.000Z',
    ...overrides,
  }
}

describe('CreateBrewService spec (Red)', () => {
  it('notes の空文字は null にせず空文字で repository に渡す', async () => {
    const create = vi.fn<[CreateBrewParams], Promise<Brew>>().mockResolvedValue(buildBrew())
    const repo: BrewRepository = { create }
    const service = new CreateBrewUseCase(repo)

    await service.execute({
      beanId: 'bean-1',
      beanWeight: 15,
      beanGrind: 25,
      waterWeight: 250,
      waterTemp: 92,
      steps: [],
      aroma: 4,
      acidity: 4,
      sweetness: 4,
      body: 3,
      overall: 4,
      notes: '',
      flavorIds: ['citrus', 'berry', 'citrus'],
    })

    expect(create).toHaveBeenCalledWith(expect.objectContaining({ notes: '' }))
  })

  it('flavorIds が空配列のとき空配列のまま渡す', async () => {
    const create = vi.fn<[CreateBrewParams], Promise<Brew>>().mockResolvedValue(buildBrew())
    const repo: BrewRepository = { create }
    const service = new CreateBrewUseCase(repo)

    await service.execute({
      beanId: 'bean-1',
      beanWeight: 15,
      beanGrind: 25,
      waterWeight: 250,
      waterTemp: 92,
      steps: [],
      aroma: 4,
      acidity: 4,
      sweetness: 4,
      body: 3,
      overall: 4,
      notes: 'balanced',
      flavorIds: [],
    })

    expect(create).toHaveBeenCalledWith(expect.objectContaining({ flavorIds: [] }))
  })

  it('notes の非空文字はそのまま保持する', async () => {
    const create = vi.fn<[CreateBrewParams], Promise<Brew>>().mockResolvedValue(buildBrew())
    const repo: BrewRepository = { create }
    const service = new CreateBrewUseCase(repo)

    await service.execute({
      beanId: 'bean-1',
      beanWeight: 15,
      beanGrind: 25,
      waterWeight: 250,
      waterTemp: 92,
      steps: [],
      aroma: 4,
      acidity: 4,
      sweetness: 4,
      body: 3,
      overall: 4,
      notes: 'juicy',
      flavorIds: ['citrus'],
    })

    expect(create).toHaveBeenCalledWith(expect.objectContaining({ notes: 'juicy' }))
  })
})
