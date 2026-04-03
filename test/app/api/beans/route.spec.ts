import { beforeEach, describe, expect, it, vi } from 'vitest'

const { createBeanMock, getBeansMock } = vi.hoisted(() => ({
  createBeanMock: vi.fn(),
  getBeansMock: vi.fn(),
}))

vi.mock('@/lib/db', () => ({
  createBean: createBeanMock,
  getBeans: getBeansMock,
}))

import { GET, POST } from '@/app/api/beans/route'

describe('BeansRoute spec (Red)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('不正リクエストは400を返す', async () => {
    const request = new Request('http://localhost/api/beans', {
      method: 'POST',
      body: JSON.stringify({ name: '' }),
      headers: { 'content-type': 'application/json' },
    })

    const response = await POST(request)

    expect(response.status).toBe(400)
  })

  it('正常系では201を返し、空文字を空文字のまま createBean に渡す', async () => {
    createBeanMock.mockResolvedValue({ id: 'bean-1' })

    const request = new Request('http://localhost/api/beans', {
      method: 'POST',
      body: JSON.stringify({
        name: 'Kenya AA',
        roaster: 'Brewia',
        country: 'Kenya',
        region: '',
        farm: '',
        variety: '',
        process: '',
        roast: 'Medium',
        notes: '',
      }),
      headers: { 'content-type': 'application/json' },
    })

    const response = await POST(request)

    expect(response.status).toBe(201)
    expect(createBeanMock).toHaveBeenCalledWith(
      expect.objectContaining({
        region: '',
        farm: '',
        variety: '',
        process: '',
        notes: '',
      })
    )
  })

  it('usecase/repository で例外が起きた場合は500を返す', async () => {
    createBeanMock.mockRejectedValue(new Error('db error'))

    const request = new Request('http://localhost/api/beans', {
      method: 'POST',
      body: JSON.stringify({
        name: 'Kenya AA',
        roaster: 'Brewia',
        country: 'Kenya',
        roast: 'Medium',
      }),
      headers: { 'content-type': 'application/json' },
    })

    const response = await POST(request)

    expect(response.status).toBe(500)
  })

  it('GET は200で一覧を返す', async () => {
    getBeansMock.mockResolvedValue([])

    const response = await GET()

    expect(response.status).toBe(200)
  })
})
