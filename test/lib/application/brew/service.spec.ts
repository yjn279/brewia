import { describe, expect, it, vi } from 'vitest'
import { BrewService } from '@/lib/application/brew/service'
import type { BrewRepository, CreateBrewParams } from '@/lib/application/brew/repository'
import type { Brew } from '@/lib/types'

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
    notes: null,
    created: '2026-04-01T00:00:00.000Z',
    updated: '2026-04-01T00:00:00.000Z',
    ...overrides,
  }
}

describe('BrewService', () => {
  it('deduplicates flavorIds and converts empty notes to null', async () => {
    const created = buildBrew()
    const create = vi.fn<[CreateBrewParams], Promise<Brew>>().mockResolvedValue(created)
    const repo: BrewRepository = { create }
    const service = new BrewService(repo)

    await service.create({
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

    expect(create).toHaveBeenCalledWith({
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
      notes: null,
      flavorIds: ['citrus', 'berry'],
    })
  })

  it('throws when undefined is passed as notes', async () => {
    const created = buildBrew()
    const create = vi.fn<[CreateBrewParams], Promise<Brew>>().mockResolvedValue(created)
    const repo: BrewRepository = { create }
    const service = new BrewService(repo)

    await expect(
      service.create({
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
        notes: undefined as unknown as string | null,
        flavorIds: ['citrus'],
      })
    ).rejects.toThrow('undefined is not allowed')
  })
})
