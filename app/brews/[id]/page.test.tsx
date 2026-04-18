import { render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import BrewDetailPage from '@/app/brews/[id]/page'
import type { BrewWithBean } from '@/lib/types'

const { getBrewByIdMock, notFoundMock, pourChartSpy, pushMock, refreshMock } = vi.hoisted(() => ({
  getBrewByIdMock: vi.fn(),
  notFoundMock: vi.fn(),
  pourChartSpy: vi.fn(),
  pushMock: vi.fn(),
  refreshMock: vi.fn(),
}))

vi.mock('@/app/brews/service', () => ({
  brewsService: {
    getBrewById: getBrewByIdMock,
  },
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
  useRouter: () => ({
    push: pushMock,
    refresh: refreshMock,
  }),
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

  // C1: brew.overall === 0 — TasteRadar is hidden
  it('C1: given a stored brew with overall === 0, when the detail page renders, then no element with data-testid="taste-radar" is present', async () => {
    const draftBrew: BrewWithBean = {
      ...brew,
      aroma: 0,
      acidity: 0,
      sweetness: 0,
      body: 0,
      overall: 0,
      flavors: [],
    }
    getBrewByIdMock.mockResolvedValue(draftBrew)

    const page = await BrewDetailPage({
      params: Promise.resolve({ id: 'brew-1' }),
    })

    render(page)

    expect(screen.queryByTestId('taste-radar')).toBeNull()
  })

  // C2: brew.overall === 0 — overall rating shows "-" not "0"
  it('C2: given a stored brew with overall === 0, when the page renders, then the overall area shows "-" followed by "/5"', async () => {
    const draftBrew: BrewWithBean = {
      ...brew,
      aroma: 0,
      acidity: 0,
      sweetness: 0,
      body: 0,
      overall: 0,
      flavors: [],
    }
    getBrewByIdMock.mockResolvedValue(draftBrew)

    const page = await BrewDetailPage({
      params: Promise.resolve({ id: 'brew-1' }),
    })

    render(page)

    // Expect "-" to be present in the rating area, and "/5" to still appear
    expect(screen.getByText('-')).toBeDefined()
    expect(screen.getByText('/5')).toBeDefined()

    // "0" should NOT appear as the overall rating value
    // (text "0" could exist elsewhere so we check the combined pattern)
    const overallRatingText = screen.queryByText('0/5')
    expect(overallRatingText).toBeNull()
  })

  // C3: brew.overall === 4 (happy path) — TasteRadar is rendered and rating shows "4/5"
  it('C3: given a stored brew with overall === 4, when the page renders, then TasteRadar is rendered once and overall shows "4" and "/5"', async () => {
    // Default mock already returns the brew with overall: 4
    const page = await BrewDetailPage({
      params: Promise.resolve({ id: 'brew-1' }),
    })

    render(page)

    expect(screen.getByTestId('taste-radar')).toBeDefined()
    expect(screen.getByText('4')).toBeDefined()
    expect(screen.getByText('/5')).toBeDefined()
  })
})
