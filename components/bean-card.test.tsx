import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { BeanCard } from '@/components/bean-card'
import type { Bean } from '@/lib/types'

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

const baseBean: Bean = {
  id: 'bean-42',
  name: 'Yirgacheffe Natural',
  roaster: 'Blue Bottle',
  region: 'Yirgacheffe',
  country: 'Ethiopia',
  variety: 'Heirloom',
  process: 'Natural',
  roast: 'Light',
  farm: '',
  userId: 'user-1',
  priceJpy: 0,
  notes: '',
  created: '2026-04-01T00:00:00.000Z',
  updated: '2026-04-01T00:00:00.000Z',
}

describe('BeanCard', () => {
  it('renders bean name', () => {
    render(<BeanCard bean={baseBean} />)
    expect(screen.getByText('Yirgacheffe Natural')).toBeDefined()
  })

  it('renders a link to /beans/:id', () => {
    render(<BeanCard bean={baseBean} />)
    const link = screen.getByRole('link')
    expect((link as HTMLAnchorElement).getAttribute('href')).toBe('/beans/bean-42')
  })

  it('renders with Card interactive classes', () => {
    render(<BeanCard bean={baseBean} />)
    const link = screen.getByRole('link')
    expect(link.classList.contains('rounded-xl')).toBe(true)
    expect(link.classList.contains('bg-card')).toBe(true)
    expect(link.classList.contains('shadow-sm')).toBe(true)
    expect(link.classList.contains('active:scale-[0.98]')).toBe(true)
  })

  it('renders the country flag for Ethiopia', () => {
    render(<BeanCard bean={baseBean} />)
    expect(screen.getByText('🇪🇹')).toBeDefined()
  })
})
