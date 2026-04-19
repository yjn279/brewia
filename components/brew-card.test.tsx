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

  // D3: link carries Surface interactive classes
  it('D3: renders with Surface interactive classes on the link', () => {
    render(<BrewCard brew={baseBrew} />)
    const link = screen.getByRole('link')
    expect(link.classList.contains('rounded-xl')).toBe(true)
    expect(link.classList.contains('bg-card')).toBe(true)
    expect(link.classList.contains('active:scale-[0.98]')).toBe(true)
  })

  // D4: link href points to /brews/:id
  it('D4: link href is /brews/:id', () => {
    render(<BrewCard brew={baseBrew} />)
    const link = screen.getByRole('link')
    const href = (link as HTMLAnchorElement).getAttribute('href') ?? ''
    expect(href).toContain('/brews/')
    expect(href).toContain(baseBrew.id)
  })

  // D5: renders flavor badges for each flavor (regression guard for FlavorBadge adoption)
  it('D5: renders flavor badges for each flavor in brew.flavors with rounded-full', () => {
    const brewWithFlavors: BrewWithBean = {
      ...baseBrew,
      flavors: [
        { id: '1', name: 'Berry', category: 'Fruity', subcategory: 'Berry', created: '2026-04-18T00:00:00.000Z', updated: '2026-04-18T00:00:00.000Z' },
        { id: '2', name: 'Floral', category: 'Floral', subcategory: 'Floral', created: '2026-04-18T00:00:00.000Z', updated: '2026-04-18T00:00:00.000Z' },
      ],
    }

    render(<BrewCard brew={brewWithFlavors} />)

    const berry = screen.getByText('Berry')
    const floral = screen.getByText('Floral')
    expect(berry).toBeDefined()
    expect(floral).toBeDefined()
    expect(berry.classList.contains('rounded-full')).toBe(true)
  })
})
