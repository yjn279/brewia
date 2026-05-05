import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { FlavorBadge } from '@/components/flavor-badge'

describe('FlavorBadge', () => {
  it('renders the name as text inside a <span>', () => {
    render(<FlavorBadge name="Berry" />)
    const el = screen.getByText('Berry')
    expect(el).toBeDefined()
    expect(el.tagName).toBe('SPAN')
  })

  it('has rounded-full class', () => {
    render(<FlavorBadge name="Berry" />)
    expect(screen.getByText('Berry').classList.contains('rounded-full')).toBe(true)
  })

  it('does NOT use rounded-md', () => {
    render(<FlavorBadge name="Berry" />)
    expect(screen.getByText('Berry').classList.contains('rounded-md')).toBe(false)
  })

  it('has compact sizing (text-xs px-2 py-0.5) and not large-variant classes', () => {
    render(<FlavorBadge name="Berry" />)
    const el = screen.getByText('Berry')
    expect(el.classList.contains('text-xs')).toBe(true)
    expect(el.classList.contains('px-2')).toBe(true)
    expect(el.classList.contains('py-0.5')).toBe(true)
    expect(el.classList.contains('text-sm')).toBe(false)
    expect(el.classList.contains('px-3')).toBe(false)
    expect(el.classList.contains('py-1.5')).toBe(false)
  })

  it('uses secondary variant colors', () => {
    render(<FlavorBadge name="Berry" />)
    const el = screen.getByText('Berry')
    expect(el.classList.contains('bg-secondary')).toBe(true)
    expect(el.classList.contains('text-secondary-foreground')).toBe(true)
  })

  it('accepts className for overrides', () => {
    render(<FlavorBadge name="Berry" className="custom-x" />)
    const el = screen.getByText('Berry')
    expect(el.classList.contains('custom-x')).toBe(true)
    expect(el.classList.contains('rounded-full')).toBe(true)
  })
})
