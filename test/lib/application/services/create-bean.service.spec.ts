import { describe, expect, it, vi } from 'vitest'
import { CreateBeanUseCase } from '@/lib/application/usecases/create-bean'
import type { Bean } from '@/lib/types'
import type { BeanRepository, CreateBeanParams } from '@/lib/ports/bean-repository'

function buildBean(overrides: Partial<Bean> = {}): Bean {
  return {
    id: 'bean-1',
    name: 'Test Bean',
    country: 'Ethiopia',
    region: '',
    farm: '',
    process: '',
    variety: '',
    roast: 'Light',
    roaster: 'Test Roaster',
    notes: '',
    created: '2026-04-01T00:00:00.000Z',
    updated: '2026-04-01T00:00:00.000Z',
    ...overrides,
  }
}

describe('CreateBeanService spec (Red)', () => {
  it('空文字は null にせず空文字のまま repository に渡す', async () => {
    const create = vi.fn<[CreateBeanParams], Promise<Bean>>().mockResolvedValue(buildBean())
    const repo: BeanRepository = { create }
    const service = new CreateBeanUseCase(repo)

    await service.execute({
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
      region: '',
      farm: '',
      process: '',
      variety: '',
      notes: '',
    })
  })

  it('任意項目が undefined の場合も空文字として repository に渡す', async () => {
    const create = vi.fn<[CreateBeanParams], Promise<Bean>>().mockResolvedValue(buildBean())
    const repo: BeanRepository = { create }
    const service = new CreateBeanUseCase(repo)

    await service.execute({
      name: 'Guji',
      country: 'Ethiopia',
      roast: 'Medium',
      roaster: 'Brewia',
    })

    expect(create).toHaveBeenCalledWith({
      name: 'Guji',
      country: 'Ethiopia',
      roast: 'Medium',
      roaster: 'Brewia',
      region: '',
      farm: '',
      process: '',
      variety: '',
      notes: '',
    })
  })

  it('roaster の非空文字はそのまま保持する', async () => {
    const create = vi.fn<[CreateBeanParams], Promise<Bean>>().mockResolvedValue(buildBean())
    const repo: BeanRepository = { create }
    const service = new CreateBeanUseCase(repo)

    await service.execute({
      name: 'Sidamo',
      country: 'Ethiopia',
      roast: 'High',
      roaster: 'Onibus',
      region: 'Region A',
      farm: 'Farm A',
      process: 'Washed',
      variety: 'Heirloom',
      notes: 'Clean cup',
    })

    expect(create).toHaveBeenCalledWith(expect.objectContaining({ roaster: 'Onibus' }))
  })
})
