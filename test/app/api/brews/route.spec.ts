import { beforeEach, describe, expect, it, vi } from 'vitest'

const { createBrewMock, getBrewsMock, getBrewsByBeanIdMock } = vi.hoisted(() => ({
  createBrewMock: vi.fn(),
  getBrewsMock: vi.fn(),
  getBrewsByBeanIdMock: vi.fn(),
}))

vi.mock('@/lib/db', () => ({
  createBrew: createBrewMock,
  getBrews: getBrewsMock,
  getBrewsByBeanId: getBrewsByBeanIdMock,
}))

import { GET, POST } from '@/app/api/brews/route'

describe('BrewsRoute spec (Red)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('不正リクエストは400を返す', async () => {
    const request = new Request('http://localhost/api/brews', {
      method: 'POST',
      body: JSON.stringify({ beanId: '' }),
      headers: { 'content-type': 'application/json' },
    })

    const response = await POST(request)

    expect(response.status).toBe(400)
  })

  it('正常系では201を返し、notes 空文字を空文字のまま createBrew に渡す', async () => {
    createBrewMock.mockResolvedValue({ id: 'brew-1' })

    const request = new Request('http://localhost/api/brews', {
      method: 'POST',
      body: JSON.stringify({
        beanId: 'bean-1',
        beanWeight: 15,
        beanGrind: 25,
        waterWeight: 250,
        waterTemp: 92,
        aroma: 4,
        acidity: 4,
        sweetness: 4,
        body: 3,
        overall: 4,
        notes: '',
        flavorIds: ['citrus', 'berry', 'citrus'],
      }),
      headers: { 'content-type': 'application/json' },
    })

    const response = await POST(request)

    expect(response.status).toBe(201)
    expect(createBrewMock).toHaveBeenCalledWith(
      expect.objectContaining({
        notes: '',
        flavorIds: ['citrus', 'berry'],
      })
    )
  })

  it('usecase/repository で例外が起きた場合は500を返す', async () => {
    createBrewMock.mockRejectedValue(new Error('db error'))

    const request = new Request('http://localhost/api/brews', {
      method: 'POST',
      body: JSON.stringify({
        beanId: 'bean-1',
        beanWeight: 15,
        waterWeight: 250,
        aroma: 4,
        acidity: 4,
        sweetness: 4,
        body: 3,
        overall: 4,
      }),
      headers: { 'content-type': 'application/json' },
    })

    const response = await POST(request)

    expect(response.status).toBe(500)
  })

  it('GET は beanId がある場合 getBrewsByBeanId を呼ぶ', async () => {
    getBrewsByBeanIdMock.mockResolvedValue([])

    const response = await GET(new Request('http://localhost/api/brews?beanId=bean-1'))

    expect(response.status).toBe(200)
    expect(getBrewsByBeanIdMock).toHaveBeenCalledWith('bean-1')
  })

  it('GET は beanId がない場合 getBrews を呼ぶ', async () => {
    getBrewsMock.mockResolvedValue([])

    const response = await GET(new Request('http://localhost/api/brews'))

    expect(response.status).toBe(200)
    expect(getBrewsMock).toHaveBeenCalledTimes(1)
  })
})
