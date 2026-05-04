import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { HeaderAction, PageHeader } from '@/components/page-header'

vi.mock('next/link', () => ({
  default: ({
    children,
    href,
    ...props
  }: {
    children: React.ReactNode
    href: string
    [key: string]: unknown
  }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}))

describe('PageHeader', () => {
  it('renders leading and actions slots', () => {
    const { container } = render(
      <PageHeader
        leading={<span>Hello Title</span>}
        actions={<button type="button">Act</button>}
      />
    )

    expect(screen.getByText('Hello Title')).toBeDefined()
    expect(screen.getByRole('button', { name: 'Act' })).toBeDefined()

    const header = container.querySelector('header')
    expect(header).not.toBeNull()
    expect(header!.classList.contains('sticky')).toBe(true)
    expect(header!.classList.contains('top-0')).toBe(true)
    expect(header!.classList.contains('z-40')).toBe(true)
  })

  it('renders without actions (new entry page case)', () => {
    const { container } = render(
      <PageHeader leading={<span>Only title</span>} />
    )

    expect(screen.getByText('Only title')).toBeDefined()
    expect(screen.queryByRole('button')).toBeNull()

    const header = container.querySelector('header')
    expect(header).not.toBeNull()
    expect(header!.classList.contains('sticky')).toBe(true)
  })

  it('accepts arbitrary ReactNode as actions (DeleteResourceButton compatibility)', () => {
    render(
      <PageHeader
        leading={<span>T</span>}
        actions={<div data-testid="drb-stub">delete here</div>}
      />
    )

    expect(screen.getByTestId('drb-stub')).toBeDefined()
  })
})

describe('HeaderAction', () => {
  it('variant "primary" applies correct classes', () => {
    render(
      <HeaderAction href="/foo" variant="primary" aria-label="Add">
        <span>+</span>
      </HeaderAction>
    )

    const anchor = screen.getByRole('link', { name: 'Add' })
    expect(anchor.classList.contains('bg-primary')).toBe(true)
    expect(anchor.classList.contains('text-primary-foreground')).toBe(true)
    expect(anchor.classList.contains('hover:bg-primary/90')).toBe(true)
    expect(anchor.classList.contains('h-8')).toBe(true)
    expect(anchor.classList.contains('w-8')).toBe(true)
    expect(anchor.classList.contains('rounded-lg')).toBe(true)
    expect(anchor.getAttribute('href')).toBe('/foo')
  })

  it('variant "secondary" applies correct classes and excludes bg-primary', () => {
    render(
      <HeaderAction href="/x" variant="secondary" aria-label="Edit">
        <span>E</span>
      </HeaderAction>
    )

    const anchor = screen.getByRole('link', { name: 'Edit' })
    expect(anchor.classList.contains('border')).toBe(true)
    expect(anchor.classList.contains('border-border')).toBe(true)
    expect(anchor.classList.contains('bg-card')).toBe(true)
    expect(anchor.classList.contains('hover:bg-secondary')).toBe(true)
    expect(anchor.classList.contains('h-8')).toBe(true)
    expect(anchor.classList.contains('w-8')).toBe(true)
    expect(anchor.classList.contains('rounded-lg')).toBe(true)
    expect(anchor.classList.contains('bg-primary')).toBe(false)
  })

  it('default variant (ghost) applies correct classes and excludes primary/secondary markers', () => {
    render(
      <HeaderAction href="/" aria-label="Back">
        <span>B</span>
      </HeaderAction>
    )

    const anchor = screen.getByRole('link', { name: 'Back' })
    expect(anchor.classList.contains('hover:bg-secondary')).toBe(true)
    expect(anchor.classList.contains('h-8')).toBe(true)
    expect(anchor.classList.contains('w-8')).toBe(true)
    expect(anchor.classList.contains('rounded-lg')).toBe(true)
    expect(anchor.classList.contains('border')).toBe(false)
    expect(anchor.classList.contains('bg-primary')).toBe(false)
    expect(anchor.classList.contains('bg-card')).toBe(false)
  })

  it('accepts and merges custom className without replacing base classes', () => {
    render(
      <HeaderAction href="/" className="custom-extra" aria-label="Back">
        <span>B</span>
      </HeaderAction>
    )

    const anchor = screen.getByRole('link', { name: 'Back' })
    expect(anchor.classList.contains('custom-extra')).toBe(true)
    expect(anchor.classList.contains('h-8')).toBe(true)
    expect(anchor.classList.contains('w-8')).toBe(true)
    expect(anchor.classList.contains('rounded-lg')).toBe(true)
  })
})
