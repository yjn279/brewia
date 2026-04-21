import { render, screen, within } from '@testing-library/react'
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

vi.mock('@/components/taste-bars', () => ({
  TasteBars: () => <div data-testid="taste-bars" />,
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

    expect(screen.getByText('7 g')).toBeDefined()
    expect(screen.getByText('103 g')).toBeDefined()
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

  // C1: brew.overall === 0 — TasteBars is hidden
  it('C1: given a stored brew with overall === 0, when the detail page renders, then no element with data-testid="taste-bars" is present', async () => {
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

    expect(screen.queryByTestId('taste-bars')).toBeNull()
  })

  // C2: bean reference does not display any score or /5 text
  it('C2: given a draft brew, when the page renders, then the bean reference does not display any score or /5 text', async () => {
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

    expect(screen.queryByText('/5')).toBeNull()
    expect(screen.queryByTestId('taste-bars')).toBeNull()
  })

  // C3: brew.overall === 4 (happy path) — TasteBars is rendered
  it('C3: given a stored brew with overall === 4, when the page renders, then TasteBars is rendered', async () => {
    // Default mock already returns the brew with overall: 4
    const page = await BrewDetailPage({
      params: Promise.resolve({ id: 'brew-1' }),
    })

    render(page)

    expect(screen.getByTestId('taste-bars')).toBeDefined()
  })

  // C4: waterTemp null → "-" shown (no unit), "null" NOT shown, Temperature label still visible
  it('C4: given a brew with waterTemp === null, when the page renders, then "-" is shown, "null" is not shown, and the Temperature label is still visible', async () => {
    const brewNullTemp: BrewWithBean = { ...brew, waterTemp: null }
    getBrewByIdMock.mockResolvedValue(brewNullTemp)

    const page = await BrewDetailPage({
      params: Promise.resolve({ id: 'brew-1' }),
    })

    render(page)

    expect(screen.getByText('-')).toBeDefined()
    expect(screen.queryByText(/null/)).toBeNull()
    expect(screen.getByText('Temperature')).toBeDefined()
  })

  // C5: beanGrind null → "-" shown in grind tile, "null" not shown, Grind label still visible
  it('C5: given a brew with beanGrind === null, when the page renders, then "-" is shown, "null" is not shown as the grind value, and the Grind label is still visible', async () => {
    const brewNullGrind: BrewWithBean = { ...brew, beanGrind: null }
    getBrewByIdMock.mockResolvedValue(brewNullGrind)

    const page = await BrewDetailPage({
      params: Promise.resolve({ id: 'brew-1' }),
    })

    render(page)

    const grindLabel = screen.getByText('Grind')
    const grindTile = grindLabel.parentElement
    if (!grindTile) throw new Error('Grind tile not found')
    expect(within(grindTile).getByText('-')).toBeDefined()
    expect(within(grindTile).queryByText('null')).toBeNull()
  })

  // C6: both waterTemp and beanGrind null → both show "-" (no unit), "null" does not appear, both labels still visible
  it('C6: given a brew with both waterTemp and beanGrind null, when the page renders, then two "-" values are shown, "null" does not appear, and both labels are still visible', async () => {
    const brewBothNull: BrewWithBean = { ...brew, waterTemp: null, beanGrind: null }
    getBrewByIdMock.mockResolvedValue(brewBothNull)

    const page = await BrewDetailPage({
      params: Promise.resolve({ id: 'brew-1' }),
    })

    render(page)

    expect(screen.getAllByText('-')).toHaveLength(2)
    expect(screen.queryByText(/null/)).toBeNull()
    expect(screen.getByText('Temperature')).toBeDefined()
    expect(screen.getByText('Grind')).toBeDefined()
  })

  // C7: happy path regression — waterTemp and beanGrind both present render exactly, no "-" in those tiles
  it('C7: given a brew with waterTemp === 92 and beanGrind === 24, when the page renders, then "92 °C" and "24 clicks" render exactly and "-" does not appear', async () => {
    // Default mock already returns the brew with waterTemp: 92 and beanGrind: 24
    const page = await BrewDetailPage({
      params: Promise.resolve({ id: 'brew-1' }),
    })

    render(page)

    expect(screen.getByText('92 °C')).toBeDefined()
    expect(screen.getByText('24 clicks')).toBeDefined()
    expect(screen.queryByText('-')).toBeNull()
  })
})
