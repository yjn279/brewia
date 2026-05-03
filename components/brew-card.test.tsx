import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { BrewCard } from '@/components/brew-card'
import type { BrewWithBean } from '@/lib/types'

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

const baseBrew: BrewWithBean = {
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
    priceJpy: null,
    updated: '2026-04-18T00:00:00.000Z',
    variety: 'SL28',
  },
  beanGrind: 24,
  beanId: 'bean-1',
  beanWeight: 15,
  body: 3,
  created: '2026-04-18T00:00:00.000Z',
  flavors: [],
  id: 'brew-1',
  notes: 'Good',
  overall: 4,
  steps: [],
  sweetness: 4,
  updated: '2026-04-18T00:00:00.000Z',
  waterTemp: 92,
  waterWeight: 225,
}

describe('BrewCard', () => {
  // D1: overall === 0 renders "-/5" not "0/5"
  it('D1: given a BrewWithBean with overall === 0, when BrewCard renders, then the rating label is "-/5" and not "0/5"', () => {
    const draftBrew: BrewWithBean = {
      ...baseBrew,
      aroma: 0,
      acidity: 0,
      sweetness: 0,
      body: 0,
      overall: 0,
    }

    render(<BrewCard brew={draftBrew} />)

    // Production code must render "-/5" when overall === 0.
    // This test will fail (red) until the implementation changes brew-card.tsx.
    expect(screen.getByText('-/5')).toBeDefined()
    expect(screen.queryByText('0/5')).toBeNull()
  })

  // D2: overall === 4 renders "4/5"
  it('D2: given a BrewWithBean with overall === 4, when BrewCard renders, then the rating label is "4/5"', () => {
    render(<BrewCard brew={baseBrew} />)

    expect(screen.getByText('4/5')).toBeDefined()
  })
})
