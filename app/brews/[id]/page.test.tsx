import { render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import BrewDetailPage from '@/app/brews/[id]/page'
import type { BrewWithBean } from '@/lib/types'

const { getBrewByIdMock, notFoundMock, pourChartSpy } = vi.hoisted(() => ({
  getBrewByIdMock: vi.fn(),
  notFoundMock: vi.fn(),
  pourChartSpy: vi.fn(),
}))

vi.mock('@/lib/db', () => ({
  getBrewById: getBrewByIdMock,
}))

vi.mock('next/link', () => ({
  default: ({
    children,
    href,
    ...props
  }: {
    children: React.ReactNode
    href: string
  }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}))

vi.mock('next/navigation', () => ({
  notFound: notFoundMock,
}))

vi.mock('@/components/pour-chart', () => ({
  PourChart: (props: { steps: Array<{ time: number; water: number }>; totalWater: number }) => {
    pourChartSpy(props)
    return <div data-testid="pour-chart" />
  },
}))

vi.mock('@/components/taste-radar', () => ({
  TasteRadar: () => <div data-testid="taste-radar" />,
}))

const brew: BrewWithBean = {
  acidity: 3,
  aroma: 4,
  bean: {
    country: 'Kenya',
    created: '2026-04-18T00:00:00.000Z',
    farm: 'Kieni',
    id: 'bean-1',
    name: 'Kenya AA',
    notes: null,
    process: 'Washed',
    region: 'Nyeri',
    roast: 'Light',
    roaster: 'Glitch',
    updated: '2026-04-18T00:00:00.000Z',
    variety: 'SL28',
  },
  beanGrind: 24,
  beanId: 'bean-1',
  beanWeight: 7,
  body: 3,
  created: '2026-04-18T00:00:00.000Z',
  flavors: [],
  id: 'brew-1',
  notes: 'Bright and juicy',
  overall: 4,
  steps: [
    { time: 0, water: 30 },
    { time: 30, water: 103 },
  ],
  sweetness: 4,
  updated: '2026-04-18T00:00:00.000Z',
  waterTemp: 92,
  waterWeight: 103,
}

describe('BrewDetailPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    getBrewByIdMock.mockResolvedValue(brew)
  })

  it('given stored odd gram values when the page renders then it shows the exact values and derived ratio', async () => {
    const page = await BrewDetailPage({
      params: Promise.resolve({ id: 'brew-1' }),
    })

    render(page)

    expect(screen.getByText('7g')).toBeDefined()
    expect(screen.getByText('103g')).toBeDefined()
    expect(screen.getByText('1:14.7')).toBeDefined()
  })

  it('given stored odd gram values when the page renders then it forwards the exact water total to the pour chart', async () => {
    const page = await BrewDetailPage({
      params: Promise.resolve({ id: 'brew-1' }),
    })

    render(page)

    expect(pourChartSpy).toHaveBeenCalledTimes(1)
    expect(pourChartSpy.mock.calls[0][0]).toEqual({
      steps: [
        { time: 0, water: 30 },
        { time: 30, water: 103 },
      ],
      totalWater: 103,
    })
  })
})
