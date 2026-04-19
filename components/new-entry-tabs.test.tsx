import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

// ---- next/navigation mock ----

vi.mock('next/navigation', () => ({
  useSearchParams: () => new URLSearchParams(),
}))

// ---- NewBeanForm mock ----

vi.mock('@/components/new-bean-form', () => ({
  NewBeanForm: () => <div data-testid="bean-form" />,
}))

// ---- NewBrewForm mock ----

vi.mock('@/components/new-brew-form', () => ({
  NewBrewForm: () => <div data-testid="brew-form" />,
}))

import { NewEntryTabs } from '@/components/new-entry-tabs'

describe('NewEntryTabs', () => {
  it('renders an h1 with the page label', () => {
    render(<NewEntryTabs beans={[]} flavors={[]} />)

    const heading = screen.getByRole('heading', { level: 1 })
    expect(heading).toBeDefined()
    expect(heading.textContent).toBe('New Entry')
  })
})
