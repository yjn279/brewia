import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { SectionHeading } from '@/components/section-heading'

describe('SectionHeading', () => {
  it('renders children inside an h2', () => {
    render(<SectionHeading>Origin</SectionHeading>)

    expect(screen.getByRole('heading', { level: 2, name: 'Origin' })).toBeDefined()
  })

  it('applies the consolidated class set by default', () => {
    render(<SectionHeading>Title</SectionHeading>)

    const heading = screen.getByRole('heading', { level: 2, name: 'Title' })
    expect(heading.classList.contains('text-sm')).toBe(true)
    expect(heading.classList.contains('font-medium')).toBe(true)
    expect(heading.classList.contains('uppercase')).toBe(true)
    expect(heading.classList.contains('tracking-wider')).toBe(true)
    expect(heading.classList.contains('text-muted-foreground')).toBe(true)
    expect(heading.classList.contains('mb-3')).toBe(true)
  })

  it('className prop merges with defaults', () => {
    render(<SectionHeading className="custom-x">Title</SectionHeading>)

    const heading = screen.getByRole('heading', { level: 2, name: 'Title' })
    expect(heading.classList.contains('custom-x')).toBe(true)
    expect(heading.classList.contains('text-sm')).toBe(true)
    expect(heading.classList.contains('font-medium')).toBe(true)
    expect(heading.classList.contains('uppercase')).toBe(true)
    expect(heading.classList.contains('tracking-wider')).toBe(true)
    expect(heading.classList.contains('text-muted-foreground')).toBe(true)
    expect(heading.classList.contains('mb-3')).toBe(true)
  })

  it('className can override mb-3 via Tailwind merging (cn/twMerge)', () => {
    render(<SectionHeading className="mb-0">Title</SectionHeading>)

    const heading = screen.getByRole('heading', { level: 2, name: 'Title' })
    expect(heading.classList.contains('mb-0')).toBe(true)
    expect(heading.classList.contains('mb-3')).toBe(false)
  })
})
