import { describe, expect, it, vi } from 'vitest'
import { CreateBeanUseCase } from '@/lib/application/usecases/create-bean'
import type { BeanRepository, CreateBeanParams } from '@/lib/ports/bean-repository'
import type { Bean } from '@/lib/types'

function buildBean(overrides: Partial<Bean> = {}): Bean {
  return {
    id: 'bean-1',
    name: 'Test Bean',
    country: 'Ethiopia',
    region: null,
    farm: null,
    process: null,
    variety: null,
    roast: 'Light',
    roaster: 'Test Roaster',
    notes: null,
    created: '2026-04-01T00:00:00.000Z',
    updated: '2026-04-01T00:00:00.000Z',
    ...overrides,
  }
}

describe('CreateBeanUseCase', () => {
  it('converts optional empty strings to null before saving', async () => {
    const created = buildBean()
    const create = vi.fn<[CreateBeanParams], Promise<Bean>>().mockResolvedValue(created)
    const repo: BeanRepository = { create }
    const useCase = new CreateBeanUseCase(repo)

    await useCase.execute({
      name: 'Yirgacheffe',
      country: 'Ethiopia',
      roast: 'Light',
      roaster: 'Kurasu',
      region: '',
      farm: '',
      process: '',
      variety: '',
      notes: '',
    })

    expect(create).toHaveBeenCalledWith({
      name: 'Yirgacheffe',
      country: 'Ethiopia',
      roast: 'Light',
      roaster: 'Kurasu',
      region: null,
      farm: null,
      process: null,
      variety: null,
      notes: null,
    })
  })
})
